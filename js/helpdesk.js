(() => {
  const LIBRARY_URL = './library/';
  const libraryWords = ['library', 'reading', 'cafe', 'coffee', 'rest'];
  const longest = Math.max(...libraryWords.map(word => word.length));
  let keyBuffer = '';

  function updateLibraryEntrances(root = document) {
    root.querySelectorAll?.('a[href="./cafe/"], a[href="cafe/"], a[href="/cafe/"]').forEach(link => {
      link.setAttribute('href', LIBRARY_URL);

      const current = link.textContent || '';
      let updated = current
        .replace(/Collection Lounge\s*\/\s*Café/gi, 'Library / Reading Room')
        .replace(/Sit in the Collection Lounge/gi, 'Sit in the Library')
        .replace(/Café\s*\/\s*Lounge/gi, 'Library / Reading Room')
        .replace(/Go to the Café/gi, 'Go to the Library')
        .replace(/Visit the Café/gi, 'Visit the Library');

      if (updated === current && /café|cafe|collection lounge/i.test(current)) {
        updated = 'Library / Reading Room';
      }
      link.textContent = updated;
    });

    root.querySelectorAll?.('.archive-msg-suggestions button').forEach(button => {
      if (/where.?s the caf/i.test(button.textContent || '')) {
        button.textContent = "Where's the Library?";
      }
    });
  }

  updateLibraryEntrances();

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) updateLibraryEntrances(node);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Keep the old hidden shortcuts useful while making the Library the destination.
  // Capture phase runs before the older inline Café listener in index.html.
  window.addEventListener('keydown', event => {
    const target = event.target;
    const typing = target && (target.matches?.('input, textarea, select') || target.isContentEditable);
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

    const key = String(event.key || '').toLowerCase();
    if (!/^[a-z]$/.test(key)) return;

    keyBuffer = (keyBuffer + key).slice(-longest);
    if (libraryWords.some(word => keyBuffer.endsWith(word))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      keyBuffer = '';
      window.location.href = LIBRARY_URL;
    }
  }, true);

  const core = document.createElement('script');
  core.src = './js/helpdesk-core.js?v=library-20260812';
  core.async = false;
  document.head.appendChild(core);
})();
