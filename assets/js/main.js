/* ===========================================================
   IGS Research — main.js
   Tab switching only. (filterDeal is defined in groupdeals.js)
   =========================================================== */

(function () {
  'use strict';

  const tabs   = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  function activateTab(tabId) {
    tabs.forEach(t => {
      const active = t.dataset.tab === tabId;
      t.classList.toggle('tab--active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(p => {
      const active = p.id === tabId;
      p.classList.toggle('panel--active', active);
      if (active) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });

    if (tabId !== 'portfolio') {
      history.replaceState(null, '', '#' + tabId);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  const initialHash = window.location.hash.replace('#', '');
  const validTabs   = ['portfolio', 'dealnews', 'sector'];
  if (initialHash && validTabs.indexOf(initialHash) !== -1) {
    activateTab(initialHash);
  }
})();
