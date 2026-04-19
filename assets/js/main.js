/* ===========================================================
   IGS Research — main.js
   Tab switching + Deal News filtering (group-based)
   =========================================================== */

(function () {
  'use strict';

  /* ---------- Tab switching ---------- */
  var tabs   = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.panel');

  function activateTab(tabId) {
    tabs.forEach(function (t) {
      var active = t.dataset.tab === tabId;
      t.classList.toggle('tab--active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(function (p) {
      var active = p.id === tabId;
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

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activateTab(tab.dataset.tab); });
  });

  var initialHash = window.location.hash.replace('#', '');
  var validTabs   = ['portfolio', 'dealnews', 'sector'];
  if (initialHash && validTabs.indexOf(initialHash) !== -1) {
    activateTab(initialHash);
  }

  /* ---------- Deal News filter chips (group-based) ---------- */
  var chips = document.querySelectorAll('.chip');

  function applyFilter(filter) {
    var groups = document.querySelectorAll('.deal-group');
    groups.forEach(function (g) {
      if (filter === 'all') {
        g.style.display = '';
        return;
      }
      var types = (g.dataset.types || '').split(/\s+/);
      var show  = types.indexOf(filter) !== -1;
      g.style.display = show ? '' : 'none';
    });

    // 날짜 헤더 재계산
    var dateHeaders = document.querySelectorAll('.deal-date');
    dateHeaders.forEach(function (header) {
      var next = header.nextElementSibling;
      var hasVisible = false;
      while (next && !next.classList.contains('deal-date')) {
        if (next.classList.contains('deal-group') && next.style.display !== 'none') {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      header.style.display = hasVisible ? '' : 'none';
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('chip--active'); });
      chip.classList.add('chip--active');
      applyFilter(chip.dataset.filter);
    });
  });
})();
