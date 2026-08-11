(() => {
  const panel = document.querySelector('.about-panel');
  const backdrop = document.querySelector('.about-backdrop');
  const openers = document.querySelectorAll('[data-about-open]');
  const closers = document.querySelectorAll('[data-about-close]');

  const stewardshipPanel = document.querySelector('.stewardship-panel');
  const stewardshipBackdrop = document.querySelector('.stewardship-backdrop');
  const stewardshipOpeners = document.querySelectorAll('[data-stewardship-open]');
  const stewardshipClosers = document.querySelectorAll('[data-stewardship-close]');

  const metaPanel = document.querySelector('.meta-panel');
  const metaBackdrop = document.querySelector('.meta-backdrop');
  const metaOpeners = document.querySelectorAll('[data-meta-open]');
  const metaClosers = document.querySelectorAll('[data-meta-close]');

  const navMenu = document.querySelector('.nav-more');
  const languageMenu = document.querySelector('.language-menu');
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const themeColorMeta = document.querySelector('#theme-color');
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');
  const pageShell = [document.querySelector('.utility'), document.querySelector('header'), document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
  const navMenuSummary = navMenu?.querySelector('summary');

  let lastFocus = null;
  let stewardshipLastFocus = null;
  let metaLastFocus = null;

  function savedThemeChoice() {
    try {
      const saved = localStorage.getItem('mol-theme');
      return ['auto','light','dark'].includes(saved) ? saved : 'auto';
    } catch (_) {
      return 'auto';
    }
  }

  function resolvedTheme(choice) {
    if (choice === 'light' || choice === 'dark') return choice;
    return systemDark?.matches ? 'dark' : 'light';
  }

  function applyTheme(choice, { persist = true } = {}) {
    const safeChoice = ['auto','light','dark'].includes(choice) ? choice : 'auto';

    if (safeChoice === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = safeChoice;
    }

    themeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === safeChoice));
    });

    const resolved = resolvedTheme(safeChoice);
    themeColorMeta?.setAttribute('content', resolved === 'dark' ? '#171713' : '#f4f1e8');

    if (persist) {
      try { localStorage.setItem('mol-theme', safeChoice); } catch (_) {}
    }
  }

  themeButtons.forEach(button => {
    button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
  });

  systemDark?.addEventListener?.('change', () => {
    if (savedThemeChoice() === 'auto') applyTheme('auto', { persist: false });
  });

  applyTheme(savedThemeChoice(), { persist: false });

  function setBodyLock() {
    const anyOpen =
      panel.classList.contains('is-open') ||
      stewardshipPanel.classList.contains('is-open') ||
      metaPanel.classList.contains('is-open');

    document.body.classList.toggle('about-open', anyOpen);
    pageShell.forEach(el => { el.inert = anyOpen; });
  }

  function setDialogState(dialog, isOpen) {
    dialog.inert = !isOpen;
    dialog.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function focusableWithin(dialog) {
    return [...dialog.querySelectorAll('a[href], button:not([disabled]), summary, input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.closest('[inert]') && el.getClientRects().length > 0);
  }

  function trapTabKey(event, dialog) {
    if (event.key !== 'Tab' || !dialog?.classList.contains('is-open')) return;
    const items = focusableWithin(dialog);
    if (!items.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openAbout({ focus = true } = {}) {
    if (!panel.classList.contains('is-open')) {
      lastFocus = document.activeElement;
      panel.classList.add('is-open');
      backdrop.classList.add('is-open');
      setDialogState(panel, true);
      backdrop.setAttribute('aria-hidden', 'false');
    }

    setBodyLock();

    if (focus) {
      setTimeout(() => panel.querySelector('.about-close')?.focus(), 50);
    }
  }

  function closeAbout({ restoreFocus = true } = {}) {
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    setDialogState(panel, false);
    backdrop.setAttribute('aria-hidden', 'true');
    setBodyLock();

    if (restoreFocus && lastFocus && document.contains(lastFocus)) {
      lastFocus.focus();
    }
  }

  function openStewardship({ focus = true } = {}) {
    if (!stewardshipPanel.classList.contains('is-open')) {
      stewardshipLastFocus = document.activeElement;
      stewardshipPanel.classList.add('is-open');
      stewardshipBackdrop.classList.add('is-open');
      setDialogState(stewardshipPanel, true);
      stewardshipBackdrop.setAttribute('aria-hidden', 'false');
    }

    setBodyLock();

    if (focus) {
      setTimeout(() => stewardshipPanel.querySelector('.stewardship-close')?.focus(), 50);
    }
  }

  function closeStewardship({ restoreFocus = true } = {}) {
    stewardshipPanel.classList.remove('is-open');
    stewardshipBackdrop.classList.remove('is-open');
    setDialogState(stewardshipPanel, false);
    stewardshipBackdrop.setAttribute('aria-hidden', 'true');
    setBodyLock();

    if (restoreFocus && stewardshipLastFocus && document.contains(stewardshipLastFocus)) {
      stewardshipLastFocus.focus();
    }
  }

  function openMeta({ focus = true } = {}) {
    if (!metaPanel.classList.contains('is-open')) {
      metaLastFocus = document.activeElement;
      metaPanel.classList.add('is-open');
      metaBackdrop.classList.add('is-open');
      setDialogState(metaPanel, true);
      metaBackdrop.setAttribute('aria-hidden', 'false');
    }

    setBodyLock();

    if (focus) {
      setTimeout(() => metaPanel.querySelector('.meta-close')?.focus(), 50);
    }
  }

  function closeMeta({ restoreFocus = true } = {}) {
    metaPanel.classList.remove('is-open');
    metaBackdrop.classList.remove('is-open');
    setDialogState(metaPanel, false);
    metaBackdrop.setAttribute('aria-hidden', 'true');
    setBodyLock();

    if (restoreFocus && metaLastFocus && document.contains(metaLastFocus)) {
      metaLastFocus.focus();
    }
  }

  function clearHash() {
    history.replaceState(null, '', location.pathname + location.search);
  }

  function syncPanelsToHash({ initial = false } = {}) {
    const hash = location.hash.toLowerCase();

    if (hash === '#about') {
      closeMeta({ restoreFocus: false });
      closeStewardship({ restoreFocus: false });
      openAbout({ focus: !initial });
      return;
    }

    if (hash === '#stewardship') {
      closeMeta({ restoreFocus: false });
      closeAbout({ restoreFocus: false });
      openStewardship({ focus: !initial });
      return;
    }

    if (hash === '#context') {
      closeAbout({ restoreFocus: false });
      closeStewardship({ restoreFocus: false });
      openMeta({ focus: !initial });
      return;
    }

    closeMeta({ restoreFocus: false });
    closeStewardship({ restoreFocus: false });
    closeAbout({ restoreFocus: false });
  }

  openers.forEach(el => {
    el.addEventListener('click', e => {
      if (location.hash.toLowerCase() === '#about') {
        e.preventDefault();
        openAbout();
      }
    });
  });

  stewardshipOpeners.forEach(el => {
    el.addEventListener('click', e => {
      if (location.hash.toLowerCase() === '#stewardship') {
        e.preventDefault();
        openStewardship();
      }
    });
  });

  metaOpeners.forEach(el => {
    el.addEventListener('click', e => {
      if (location.hash.toLowerCase() === '#context') {
        e.preventDefault();
        openMeta();
      }
    });
  });

  navMenu?.querySelectorAll('a').forEach(el => {
    el.addEventListener('click', () => {
      navMenu.removeAttribute('open');
    });
  });

  document.addEventListener('click', e => {
    if (navMenu?.hasAttribute('open') && !navMenu.contains(e.target)) {
      navMenu.removeAttribute('open');
    }
    if (languageMenu?.hasAttribute('open') && !languageMenu.contains(e.target)) {
      languageMenu.removeAttribute('open');
    }
  });

  stewardshipClosers.forEach(el => {
    el.addEventListener('click', () => {
      closeStewardship();
      if (location.hash.toLowerCase() === '#stewardship') clearHash();
    });
  });

  closers.forEach(el => {
    el.addEventListener('click', () => {
      closeAbout();
      if (location.hash.toLowerCase() === '#about') clearHash();
    });
  });

  metaClosers.forEach(el => {
    el.addEventListener('click', () => {
      closeMeta();
      if (location.hash.toLowerCase() === '#context') clearHash();
    });
  });

  window.addEventListener('hashchange', () => {
    syncPanelsToHash();
  });

  document.addEventListener('keydown', e => {
    const activeDialog = metaPanel.classList.contains('is-open') ? metaPanel : stewardshipPanel.classList.contains('is-open') ? stewardshipPanel : panel.classList.contains('is-open') ? panel : null;
    if (activeDialog && e.key === 'Tab') {
      trapTabKey(e, activeDialog);
      return;
    }

    if (e.key !== 'Escape') return;

    if (metaPanel.classList.contains('is-open')) {
      closeMeta();
      if (location.hash.toLowerCase() === '#context') clearHash();
      return;
    }

    if (stewardshipPanel.classList.contains('is-open')) {
      closeStewardship();
      if (location.hash.toLowerCase() === '#stewardship') clearHash();
      return;
    }

    if (panel.classList.contains('is-open')) {
      closeAbout();
      if (location.hash.toLowerCase() === '#about') clearHash();
      return;
    }

    if (navMenu?.hasAttribute('open')) {
      navMenu.removeAttribute('open');
      navMenuSummary?.focus();
      return;
    }

    if (languageMenu?.hasAttribute('open')) {
      const summary = languageMenu.querySelector('summary');
      languageMenu.removeAttribute('open');
      summary?.focus();
    }
  });

  // Direct deep links:
  // https://museumofordinarylife.org/#about
  // https://museumofordinarylife.org/#stewardship
  // https://museumofordinarylife.org/#context
  syncPanelsToHash({ initial: true });
})();
