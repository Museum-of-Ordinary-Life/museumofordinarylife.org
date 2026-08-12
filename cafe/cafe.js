(() => {
  const DATA_URL = './data/scenes.json';
  const windowMedia = document.getElementById('window-media');
  const windowEmpty = document.getElementById('window-empty');
  const windowCatalog = document.getElementById('window-catalog');
  const windowStateLabel = document.getElementById('window-state-label');
  const projectorMedia = document.getElementById('projector-media');
  const projectionEmpty = document.getElementById('projection-empty');
  const programTitle = document.getElementById('program-title');
  const programDescription = document.getElementById('program-description');
  const previousButton = document.getElementById('previous-scene');
  const nextButton = document.getElementById('next-scene');
  const shuffleButton = document.getElementById('shuffle-scene');
  const soundToggle = document.getElementById('sound-toggle');
  const soundTitle = document.getElementById('sound-title');
  const soundDescription = document.getElementById('sound-description');
  const audio = document.getElementById('room-audio');
  const quietToggle = document.getElementById('quiet-toggle');
  const quietExit = document.getElementById('quiet-exit');
  const notebook = document.getElementById('notebook-entry');
  const clearNote = document.getElementById('clear-note');

  let scenes = [];
  let visualScenes = [];
  let soundScenes = [];
  let currentVisualIndex = 0;
  let currentSound = null;
  let soundOn = false;
  let rotationTimer = null;
  let rotationMs = 90000;

  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function clearNode(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function makeMedia(scene, host) {
    clearNode(host);
    const media = scene?.media;
    if (!media?.src) return false;
    if (media.type === 'video') {
      const video = document.createElement('video');
      video.src = media.src;
      if (media.poster) video.poster = media.poster;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loop = media.loop !== false;
      video.setAttribute('aria-label', media.alt || scene.title || 'Collection video');
      host.appendChild(video);
      video.play().catch(() => {});
      return true;
    }
    const img = document.createElement('img');
    img.src = media.src;
    img.alt = media.alt || scene.title || 'Collection image';
    img.loading = 'eager';
    host.appendChild(img);
    return true;
  }

  function setCatalog(scene) {
    if (!scene) return;
    const details = [scene.location, scene.date, scene.credit].filter(Boolean);
    windowCatalog.innerHTML = `
      <span class="catalog-status">${escape(scene.id || 'Collection record')}</span>
      <h2>${escape(scene.title || 'Untitled view')}</h2>
      ${details.length ? `<p>${details.map(escape).join(' · ')}</p>` : ''}
      ${scene.description ? `<p>${escape(scene.description)}</p>` : ''}
    `;
  }

  function renderVisual(index) {
    if (!visualScenes.length) return;
    currentVisualIndex = (index + visualScenes.length) % visualScenes.length;
    const scene = visualScenes[currentVisualIndex];
    if (scene.surface === 'projector') {
      clearNode(windowMedia); windowEmpty.hidden = false; projectionEmpty.hidden = true;
      makeMedia(scene, projectorMedia);
      document.getElementById('projection-title').textContent = scene.title || 'Collection projection';
    } else {
      clearNode(projectorMedia); projectionEmpty.hidden = false; windowEmpty.hidden = true;
      makeMedia(scene, windowMedia);
      windowStateLabel.textContent = scene.title || 'Collection view';
      setCatalog(scene);
    }
    if (scene.audio?.src) { currentSound = scene.audio; configureAudio(); }
  }

  function configureAudio() {
    if (!currentSound?.src) {
      const fallback = soundScenes[0];
      currentSound = fallback?.audio?.src ? fallback.audio : null;
    }
    if (!currentSound?.src) {
      audio.pause(); audio.removeAttribute('src'); soundToggle.disabled = true;
      soundToggle.textContent = 'Sound unavailable'; soundTitle.textContent = 'Quiet';
      soundDescription.textContent = 'No collection sound is assigned to the room.'; return;
    }
    soundToggle.disabled = false;
    soundTitle.textContent = currentSound.label || 'Collection sound';
    soundDescription.textContent = 'Sound is opt-in. Nothing will play until you turn it on.';
    if (audio.src !== new URL(currentSound.src, location.href).href) {
      audio.src = currentSound.src; audio.loop = true;
      if (soundOn) audio.play().catch(() => {});
    }
    soundToggle.textContent = soundOn ? 'Sound off' : 'Sound on';
  }

  function resetRotation() {
    clearInterval(rotationTimer);
    if (visualScenes.length > 1 && rotationMs > 0) rotationTimer = setInterval(() => renderVisual(currentVisualIndex + 1), rotationMs);
  }

  function enableControls() {
    const enabled = visualScenes.length > 0;
    previousButton.disabled = !enabled || visualScenes.length < 2;
    nextButton.disabled = !enabled || visualScenes.length < 2;
    shuffleButton.disabled = !enabled || visualScenes.length < 2;
  }

  async function loadProgram() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      programTitle.textContent = data.program?.title || 'Collection program';
      programDescription.textContent = data.program?.description || '';
      rotationMs = Math.max(20, Number(data.program?.rotationSeconds) || 90) * 1000;
      scenes = Array.isArray(data.scenes) ? data.scenes.filter(scene => scene && scene.cafeDisplay === true) : [];
      visualScenes = scenes.filter(scene => (scene.surface === 'window' || scene.surface === 'projector') && scene.media?.src);
      soundScenes = scenes.filter(scene => scene.surface === 'room-sound' && scene.audio?.src);
      if (visualScenes.length) {
        renderVisual(0);
        programDescription.textContent = `${visualScenes.length} collection ${visualScenes.length === 1 ? 'view is' : 'views are'} available in this program.`;
      }
      if (!currentSound && soundScenes.length) currentSound = soundScenes[0].audio;
      configureAudio(); enableControls(); resetRotation();
    } catch (error) {
      console.warn('Collection Lounge program could not be loaded:', error);
      programDescription.textContent = 'The room is open, but its collection program could not be loaded.';
    }
  }

  previousButton.addEventListener('click', () => { renderVisual(currentVisualIndex - 1); resetRotation(); });
  nextButton.addEventListener('click', () => { renderVisual(currentVisualIndex + 1); resetRotation(); });
  shuffleButton.addEventListener('click', () => {
    if (visualScenes.length < 2) return;
    let next = currentVisualIndex;
    while (next === currentVisualIndex) next = Math.floor(Math.random() * visualScenes.length);
    renderVisual(next); resetRotation();
  });

  soundToggle.addEventListener('click', async () => {
    if (!currentSound?.src) return;
    soundOn = !soundOn;
    if (soundOn) { try { await audio.play(); } catch { soundOn = false; } }
    else audio.pause();
    soundToggle.textContent = soundOn ? 'Sound off' : 'Sound on';
  });

  function setQuietMode(on) {
    document.body.classList.toggle('quiet-mode', on);
    quietToggle.setAttribute('aria-pressed', String(on));
    quietExit.hidden = !on;
    if (on) quietExit.focus();
  }

  quietToggle.addEventListener('click', () => setQuietMode(!document.body.classList.contains('quiet-mode')));
  quietExit.addEventListener('click', () => setQuietMode(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('quiet-mode')) { event.preventDefault(); setQuietMode(false); }
  });

  clearNote.addEventListener('click', () => { notebook.value = ''; notebook.focus(); });
  // Intentionally no localStorage and no network submission: the notebook is ephemeral.
  loadProgram();
})();
