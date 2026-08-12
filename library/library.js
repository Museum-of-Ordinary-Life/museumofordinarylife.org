(() => {
  const roomArt = document.querySelector('[data-room-art]');
  const imageParts = [
    './assets/reading-room/part-01.txt',
    './assets/reading-room/part-02.txt',
    './assets/reading-room/part-03.txt',
    './assets/reading-room/part-04.txt',
    './assets/reading-room/part-05.txt',
    './assets/reading-room/part-06.txt',
    './assets/reading-room/part-07.txt',
    './assets/reading-room/part-08.txt'
  ];

  async function loadRoomArt() {
    if (!roomArt) return;
    try {
      const responses = await Promise.all(imageParts.map(path => fetch(path, { cache: 'force-cache' })));
      if (responses.some(response => !response.ok)) throw new Error('Reading room image data unavailable');
      const chunks = await Promise.all(responses.map(response => response.text()));
      const encoded = chunks.join('').replace(/\s+/g, '');
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
      roomArt.addEventListener('load', () => {
        roomArt.classList.add('is-ready');
        URL.revokeObjectURL(url);
      }, { once: true });
      roomArt.src = url;
    } catch (error) {
      console.warn('[Museum Library] Reading room image unavailable.', error);
    }
  }

  loadRoomArt();

  const panel = document.getElementById('library-panel');
  const panelTitle = document.getElementById('library-panel-title');
  const panelBody = document.getElementById('library-panel-body');
  const closeButton = document.querySelector('[data-panel-close]');
  const actions = document.querySelectorAll('[data-library-action]');
  const quietButton = document.querySelector('[data-quiet-toggle]');
  let lastFocus = null;

  if (!panel || !panelTitle || !panelBody) return;

  function closePanel() {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    actions.forEach(button => button.setAttribute('aria-pressed', 'false'));
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  }

  function openPanel(title, html, sourceButton) {
    lastFocus = sourceButton || document.activeElement;
    panelTitle.textContent = title;
    panelBody.innerHTML = html;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    actions.forEach(button => button.setAttribute('aria-pressed', button === sourceButton ? 'true' : 'false'));
    closeButton?.focus();
  }

  async function openShelves(button) {
    try {
      const response = await fetch('./data/shelves.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Shelf data: ${response.status}`);
      const data = await response.json();
      const shelves = Array.isArray(data.shelves) ? data.shelves : [];
      const rows = shelves.map(shelf => {
        const count = Array.isArray(shelf.items) ? shelf.items.length : 0;
        const note = count
          ? `${count} item${count === 1 ? '' : 's'}`
          : 'Shelf still forming.';
        return `<div class="shelf-row"><strong>${escapeHtml(shelf.label || 'Untitled shelf')}</strong><span>${note}</span></div>`;
      }).join('');
      openPanel('Browse the shelves', `<p>The Library is being built slowly. We would rather leave a shelf empty than pretend something is here.</p><div class="shelf-list">${rows || '<p>No shelves have been cataloged yet.</p>'}</div>`, button);
    } catch (error) {
      openPanel('Browse the shelves', '<p>The shelf list is temporarily unavailable. The room itself is still open.</p>', button);
    }
  }

  function openTable(button) {
    openPanel('On the table', `
      <p>Nothing has been placed here yet.</p>
      <p>This will eventually hold a small number of things the Museum is currently reading, noticing, or using: a book, an essay, a field note, a document, or another reference that helps explain ordinary life.</p>
      <p><em>Empty is a valid collection state.</em></p>
    `, button);
  }

  function openNotebook(button) {
    openPanel('Table Notebook', `
      <label class="notebook-label" for="library-notebook">What are you noticing?</label>
      <textarea class="notebook" id="library-notebook" autocomplete="off" spellcheck="true" placeholder="A thought, a detail, something you almost missed…"></textarea>
      <p class="notebook-note">This stays in this page only. It is not submitted, saved, synced, or sent anywhere. Reloading or closing the page clears it.</p>
    `, button);
    requestAnimationFrame(() => document.getElementById('library-notebook')?.focus());
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  actions.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.libraryAction;
      if (action === 'shelves') openShelves(button);
      if (action === 'table') openTable(button);
      if (action === 'notebook') openNotebook(button);
    });
  });

  closeButton?.addEventListener('click', closePanel);

  quietButton?.addEventListener('click', () => {
    const isQuiet = document.body.classList.toggle('quiet');
    quietButton.setAttribute('aria-pressed', String(isQuiet));
    quietButton.textContent = isQuiet ? 'Leave quiet mode' : 'Quiet mode';
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });
})();
