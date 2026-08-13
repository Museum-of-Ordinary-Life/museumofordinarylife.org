(() => {
  const DATA_URL = './data/helpdesk-core.json';
  const ENTRY_URLS = [
    './data/helpdesk-entries-01.json',
    './data/helpdesk-entries-02.json',
    './data/helpdesk-entries-03.json',
    './data/helpdesk-entries-04.json',
    './data/helpdesk-entries-05.json',
  ];
  const triggers = ['notice', 'help'];
  const maxTriggerLength = Math.max(...triggers.map(word => word.length));

  let keyBuffer = '';
  let roomMode = 'notice';
  let lastFocus = null;
  let helpData = null;
  let helpDataPromise = null;

  const room = document.getElementById('archive-room');
  const form = document.getElementById('archive-room-form');
  const input = document.getElementById('archive-room-input');
  const log = document.getElementById('archive-room-log');
  const closeButton = room?.querySelector('.archive-room-close');
  const promptButtons = room?.querySelectorAll('[data-archive-prompt]') || [];
  const modeLabel = document.getElementById('archive-room-mode-label');
  const statusLabel = document.getElementById('archive-room-status');
  const stamp = document.getElementById('archive-room-stamp');
  const title = document.getElementById('archive-room-title');
  const introPrimary = document.getElementById('archive-room-intro-primary');
  const introSecondary = document.getElementById('archive-room-intro-secondary');
  const exitNote = document.getElementById('archive-room-exit-note');

  if (!room || !form || !input || !log) return;

  const fallbackData = {
    modes: {
      notice: {
        modeLabel: 'Reference desk / after hours',
        status: 'Uncatalogued room',
        stamp: 'FOUND',
        title: 'You<br><em>noticed.</em>',
        primary: 'This room isn’t listed on the public floor plan.',
        secondary: 'Ask about the Museum, the collection, or what you might document next.',
        placeholder: 'Ask the Museum something…',
        initial: 'After-hours desk open.',
        exitNote: 'Esc or “exit” returns to the galleries.',
        prompts: [['Help', 'help']]
      },
      help: {
        modeLabel: 'Visitor services / help desk',
        status: 'Museum assistance',
        stamp: 'OPEN',
        title: 'Museum<br><em>help desk.</em>',
        primary: 'Questions about the Museum and finding your way around.',
        secondary: 'The Help Desk file is loading.',
        placeholder: 'How can the Museum help?',
        initial: 'Help Desk open.',
        exitNote: 'Esc or “exit” closes the help desk.',
        prompts: [['Help', 'help']]
      }
    },
    stopwords: [],
    synonym_groups: [],
    noticing_prompts: [],
    hidden_notes: [],
    entries: [],
    fallbacks: {
      no_match: 'I don’t have a reliable answer for that in the Help Desk file yet.',
      data_error: 'The Help Desk file didn’t load. The rest of the Museum still works, but this desk has temporarily misplaced its catalog cards.'
    }
  };

  async function loadHelpData() {
    if (helpData) return helpData;
    if (helpDataPromise) return helpDataPromise;

    helpDataPromise = Promise.all([
      fetch(DATA_URL, { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error(`Help Desk data: ${response.status}`);
        return response.json();
      }),
      ...ENTRY_URLS.map(url => fetch(url, { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error(`Help Desk entries: ${response.status}`);
        return response.json();
      }))
    ])
      .then(([data, ...entryGroups]) => {
        data.entries = entryGroups.flat();
        helpData = data;
        return data;
      })
      .catch(error => {
        console.warn('Museum Help Desk data could not be loaded.', error);
        helpData = fallbackData;
        return helpData;
      });

    return helpDataPromise;
  }

  // Start loading the small catalog file as soon as the page is ready.
  loadHelpData();

  const pick = list => list?.length ? list[Math.floor(Math.random() * list.length)] : '';

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/\bwhat's\b/g, 'what is')
      .replace(/\bwhere's\b/g, 'where is')
      .replace(/\bwho's\b/g, 'who is')
      .replace(/\bhow's\b/g, 'how is')
      .replace(/\bdoesn't\b/g, 'does not')
      .replace(/\bdon't\b/g, 'do not')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\bi'd\b/g, 'i would')
      .replace(/\bi've\b/g, 'i have')
      .replace(/\bmachine[\s-]+learning\b/g, 'machinelearning')
      .replace(/\bartificial intelligence\b/g, 'ai')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildSynonymMap(data) {
    const map = new Map();
    for (const group of data.synonym_groups || []) {
      const canonical = normalize(group[0]).replace(/\s+/g, '');
      for (const item of group) map.set(normalize(item).replace(/\s+/g, ''), canonical);
    }
    return map;
  }

  function tokenSet(value, data) {
    const stop = new Set(data.stopwords || []);
    const synonyms = buildSynonymMap(data);
    const raw = normalize(value).split(' ').filter(Boolean);
    const mapped = raw.map(token => synonyms.get(token) || token);
    const useful = mapped.filter(token => !stop.has(token));
    return new Set(useful.length ? useful : mapped);
  }

  function diceCoefficient(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;

    const pairs = str => {
      const out = new Map();
      for (let i = 0; i < str.length - 1; i++) {
        const pair = str.slice(i, i + 2);
        out.set(pair, (out.get(pair) || 0) + 1);
      }
      return out;
    };

    const A = pairs(a);
    const B = pairs(b);
    let overlap = 0;
    for (const [pair, count] of A) overlap += Math.min(count, B.get(pair) || 0);

    return (2 * overlap) / Math.max(1, (a.length - 1) + (b.length - 1));
  }

  function setOverlap(a, b) {
    if (!a.size || !b.size) return 0;
    let intersection = 0;
    for (const item of a) if (b.has(item)) intersection++;
    const precision = intersection / a.size;
    const recall = intersection / b.size;
    return (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;
  }

  function scoreEntry(question, entry, data) {
    const q = normalize(question);
    const qTokens = tokenSet(q, data);
    let score = Number(entry.priority || 0) * 2;

    for (const variantRaw of entry.questions || []) {
      const variant = normalize(variantRaw);
      if (!variant) continue;
      if (q === variant) return 1000 + score;

      if ((q.includes(variant) || variant.includes(q)) && Math.min(q.length, variant.length) >= 6) {
        score = Math.max(score, 150 + Math.min(q.length, variant.length) / 10);
      }

      const overlap = setOverlap(qTokens, tokenSet(variant, data));
      const chars = diceCoefficient(q.replace(/\s/g, ''), variant.replace(/\s/g, ''));
      score = Math.max(score, overlap * 92 + chars * 24);
    }

    let keywordScore = 0;
    for (const keywordRaw of entry.keywords || []) {
      const keyword = normalize(keywordRaw);
      if (!keyword) continue;
      if (q.includes(keyword)) keywordScore += keyword.includes(' ') ? 22 : 13;
      else {
        const overlap = setOverlap(qTokens, tokenSet(keyword, data));
        if (overlap >= .66) keywordScore += 8 * overlap;
      }
    }

    return score + Math.min(keywordScore, 44);
  }

  function entryById(data, id) {
    return (data.entries || []).find(entry => entry.id === id) || null;
  }

  function rankEntries(question, data) {
    const ranked = (data.entries || [])
      .map(entry => ({ entry, score: scoreEntry(question, entry, data) }))
      .sort((a, b) => b.score - a.score);
    return { best: ranked[0] || null, second: ranked[1] || null };
  }

  function hasPhrase(haystack, needle) {
    const phrase = normalize(needle);
    if (!phrase) return false;
    if (phrase.includes(' ')) return haystack.includes(phrase);
    return haystack.split(' ').includes(phrase);
  }

  function looksLikeWayfinding(question, data) {
    const q = normalize(question);
    if (/^where\b/.test(q)) return true;
    return (data.intent_patterns?.wayfinding || []).some(pattern => q.includes(normalize(pattern)));
  }

  function directIntentMatch(question, data) {
    const q = normalize(question);

    // Safety-sensitive questions should never be left to fuzzy matching.
    const missing = entryById(data, 'missing-person');
    if (missing && (missing.direct_patterns || []).some(pattern => q.includes(normalize(pattern)))) {
      return { entry: missing, score: 5000, direct: true };
    }

    if (/\b(manager|in charge)\b/.test(q)) {
      const manager = entryById(data, 'manager');
      if (manager) return { entry: manager, score: 4500, direct: true };
    }

    if (/^(what can i do|what can i do here|what is there to do|what should i do here|where should i start|show me around)$/.test(q)) {
      const options = entryById(data, 'visitor-options');
      if (options) return { entry: options, score: 4500, direct: true };
    }

    // Opening-date questions are different from ordinary wayfinding.
    if (/\b(when|what time)\b/.test(q) && /\b(open|opens|opening|start|starts)\b/.test(q)) {
      if (/\bmuseum\b/.test(q) && !/\b(collection|exhibition|exhibit|show)\b/.test(q)) {
        const hours = entryById(data, 'hours');
        if (hours) return { entry: hours, score: 4300, direct: true };
      }
      const opening = entryById(data, 'named-opening');
      if (opening) return { entry: opening, score: 4250, direct: true };
    }

    // Common visitor destinations get deterministic routing before semantic/fuzzy matching.
    if (looksLikeWayfinding(q, data)) {
      const places = [...(data.places || [])].sort((a, b) => {
        const aa = Math.max(...(a.aliases || []).map(alias => normalize(alias).length), 0);
        const bb = Math.max(...(b.aliases || []).map(alias => normalize(alias).length), 0);
        return bb - aa;
      });

      for (const place of places) {
        if ((place.aliases || []).some(alias => hasPhrase(q, alias))) {
          const entry = entryById(data, place.entry);
          if (entry) return { entry, score: 4000, direct: true };
        }
      }

      // A visitor is clearly asking for a place, but the place is not in the map yet.
      return {
        entry: null,
        score: 0,
        direct: true,
        fallback: data.fallbacks?.wayfinding_unknown || fallbackData.fallbacks.no_match
      };
    }

    // Books and reading-room requests often contain a title the static matcher has never seen.
    if (/\b(book|books|library|reading room|reading shelf|bookshelf)\b/.test(q) && /\b(find|have|where|looking|read)\b/.test(q)) {
      const books = entryById(data, 'books-reading');
      if (books) return { entry: books, score: 3900, direct: true };
    }

    // "Do you have X?" may contain a title or object name that isn't in the static catalog yet.
    // Don't let fuzzy matching confidently turn an unknown named thing into an unrelated Museum topic.
    if ((data.intent_patterns?.availability || []).some(pattern => q.includes(normalize(pattern)))) {
      for (const place of data.places || []) {
        if ((place.aliases || []).some(alias => hasPhrase(q, alias))) {
          const entry = entryById(data, place.entry);
          if (entry) return { entry, score: 3800, direct: true };
        }
      }
      return {
        entry: null,
        score: 0,
        direct: true,
        fallback: data.fallbacks?.availability_unknown || fallbackData.fallbacks.no_match
      };
    }

    return null;
  }

  function bestEntry(question, data) {
    const direct = directIntentMatch(question, data);
    if (direct) return direct;

    const { best, second } = rankEntries(question, data);
    if (!best) return null;

    const margin = best.score - (second?.score || 0);
    const exactish = best.score >= 150;
    const confident = best.score >= 58 && margin >= 7;
    const veryConfident = best.score >= 82;

    return (exactish || confident || veryConfident) ? best : null;
  }

  function suggestionsFor(entry, data) {
    const pool = entry?.suggestions?.length
      ? entry.suggestions
      : (data.category_suggestions?.[entry?.category] || data.category_suggestions?.helpdesk || []);
    return [...new Set(pool)].slice(0, 4);
  }

  function resolveAnswer(entry, data) {
    if (!entry) return null;
    if (entry.random_pool) return pick(data[entry.random_pool] || []);
    if (entry.answers) return entry.answers[roomMode] || entry.answers.default || Object.values(entry.answers)[0] || '';
    return entry.answer || '';
  }

  function addMessage(role, text, actions = [], suggestions = []) {
    const row = document.createElement('div');
    row.className = `archive-msg ${role === 'you' ? 'user' : 'museum'}`;

    const label = document.createElement('div');
    label.className = 'archive-msg-role';
    label.textContent = role === 'you' ? 'Visitor' : (roomMode === 'help' ? 'Help desk' : 'Reference desk');

    const content = document.createElement('div');
    const body = document.createElement('div');
    body.className = 'archive-msg-text';
    body.textContent = text;
    content.appendChild(body);

    if (role !== 'you' && actions?.length) {
      const actionWrap = document.createElement('div');
      actionWrap.className = 'archive-msg-actions';

      for (const action of actions) {
        if (!action?.label) continue;

        if (action.command === 'close') {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = action.label;
          button.addEventListener('click', () => closeRoom());
          actionWrap.appendChild(button);
          continue;
        }

        if (!action.href) continue;
        const link = document.createElement('a');
        link.href = action.href;
        link.textContent = action.label;

        if (/^https?:/i.test(action.href)) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        } else if (action.href.startsWith('#')) {
          link.addEventListener('click', event => {
            event.preventDefault();
            const destination = action.href;
            closeRoom({ clearHelpHash: false });
            window.setTimeout(() => { location.hash = destination; }, 140);
          });
        }
        actionWrap.appendChild(link);
      }

      if (actionWrap.childElementCount) content.appendChild(actionWrap);
    }

    if (role !== 'you' && suggestions?.length) {
      const suggestionWrap = document.createElement('div');
      suggestionWrap.className = 'archive-msg-suggestions';

      const suggestionLabel = document.createElement('div');
      suggestionLabel.className = 'archive-msg-suggestions-label';
      suggestionLabel.textContent = 'You might also ask';
      suggestionWrap.appendChild(suggestionLabel);

      const buttons = document.createElement('div');
      buttons.className = 'archive-msg-suggestions-buttons';
      for (const suggestion of suggestions.slice(0, 4)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = suggestion;
        button.addEventListener('click', () => submitQuestion(suggestion));
        buttons.appendChild(button);
      }
      suggestionWrap.appendChild(buttons);
      content.appendChild(suggestionWrap);
    }

    row.append(label, content);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function applyRoomMode(mode, data) {
    roomMode = data.modes?.[mode] ? mode : 'notice';
    const config = data.modes?.[roomMode] || fallbackData.modes[roomMode];

    room.classList.toggle('help-mode', roomMode === 'help');
    if (modeLabel) modeLabel.textContent = config.modeLabel;
    if (statusLabel) statusLabel.textContent = config.status;
    if (stamp) stamp.textContent = config.stamp;
    if (title) title.innerHTML = config.title;
    if (introPrimary) introPrimary.textContent = config.primary;
    if (introSecondary) introSecondary.textContent = config.secondary;
    if (exitNote) exitNote.textContent = config.exitNote;
    input.placeholder = config.placeholder;

    promptButtons.forEach((button, index) => {
      const prompt = config.prompts?.[index];
      if (!prompt) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.textContent = prompt[0];
      button.dataset.archivePrompt = prompt[1];
    });
  }

  async function openRoom(mode = 'notice') {
    const data = await loadHelpData();

    if (room.classList.contains('is-open')) {
      applyRoomMode(mode, data);
      return;
    }

    lastFocus = document.activeElement;
    applyRoomMode(mode, data);
    log.replaceChildren();
    addMessage('museum', (data.modes?.[roomMode] || fallbackData.modes[roomMode]).initial);

    if (data === fallbackData) addMessage('museum', fallbackData.fallbacks.data_error);

    room.setAttribute('aria-hidden', 'false');
    document.body.classList.add('archive-room-open');
    requestAnimationFrame(() => room.classList.add('is-open'));
    window.setTimeout(() => input.focus(), 520);
  }

  function clearHelpHash() {
    if (location.hash.toLowerCase() === '#help') {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function closeRoom({ clearHelpHash: clear = true } = {}) {
    if (!room.classList.contains('is-open')) return;
    room.classList.remove('is-open');
    room.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('archive-room-open');
    keyBuffer = '';
    if (clear) clearHelpHash();

    window.setTimeout(() => {
      if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) lastFocus.focus();
    }, 120);
  }

  async function answer(raw) {
    const q = normalize(raw);
    if (!q) return;

    if (['exit','close','leave','bye','goodbye'].includes(q)) {
      addMessage('museum', roomMode === 'help' ? 'Closing the help desk.' : 'Returning you to normal opening hours.');
      window.setTimeout(() => closeRoom(), 300);
      return;
    }

    const data = await loadHelpData();
    const match = bestEntry(raw, data);

    if (!match) {
      addMessage(
        'museum',
        data.fallbacks?.no_match || fallbackData.fallbacks.no_match,
        [],
        (data.category_suggestions?.helpdesk || []).slice(0, 4)
      );
      return;
    }

    if (!match.entry && match.fallback) {
      addMessage(
        'museum',
        match.fallback,
        [],
        ["Where's the café?", "Is there a map?", "What can I see right now?", "Where's the front desk?"]
      );
      return;
    }

    const text = resolveAnswer(match.entry, data);
    addMessage(
      'museum',
      text || data.fallbacks?.no_match || fallbackData.fallbacks.no_match,
      match.entry.actions || [],
      suggestionsFor(match.entry, data)
    );
  }

  function submitQuestion(text) {
    const value = (text ?? input.value).trim();
    if (!value) return;
    addMessage('you', value);
    input.value = '';
    input.style.height = '';
    window.setTimeout(() => answer(value), 90);
  }

  // Visible Help Desk entrances.
  document.querySelectorAll('[data-helpdesk-open]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      if (location.hash.toLowerCase() !== '#help') {
        history.pushState(null, '', location.pathname + location.search + '#help');
      }
      openRoom('help');
    });
  });

  // Direct link: museumofordinarylife.org/#help
  if (location.hash.toLowerCase() === '#help') openRoom('help');

  window.addEventListener('hashchange', () => {
    if (location.hash.toLowerCase() === '#help') openRoom('help');
  });

  // Typed entrances. "help" is also public; "notice" remains the hidden one.
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && room.classList.contains('is-open')) {
      event.preventDefault();
      closeRoom();
      return;
    }

    if (room.classList.contains('is-open')) return;

    const target = event.target;
    const typing = target && (target.matches?.('input, textarea, select') || target.isContentEditable);
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

    const key = String(event.key || '').toLowerCase();
    if (!/^[a-z]$/.test(key)) return;

    keyBuffer = (keyBuffer + key).slice(-maxTriggerLength);
    const matchedTrigger = triggers.find(word => keyBuffer.endsWith(word));
    if (matchedTrigger) {
      event.preventDefault();
      keyBuffer = '';
      openRoom(matchedTrigger);
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    submitQuestion();
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 150) + 'px';
  });

  closeButton?.addEventListener('click', () => closeRoom());

  promptButtons.forEach(button => {
    button.addEventListener('click', () => {
      submitQuestion(button.dataset.archivePrompt || button.textContent || '');
    });
  });

  room.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...room.querySelectorAll('button, textarea, input, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  room.addEventListener('mousedown', event => {
    if (event.target === room) closeRoom();
  });
})();
