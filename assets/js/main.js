/* ===========================================================
   IGS Research — main.js
   Tab switching + Deal News filtering
   Default tab: Portfolio
   =========================================================== */

(function () {
  'use strict';

  /* ---------- Tab switching ---------- */
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

    // URL 해시 업데이트 (브라우저 뒤로가기 지원)
    if (tabId !== 'portfolio') {
      history.replaceState(null, '', '#' + tabId);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  // URL 해시로 들어온 경우 해당 탭 활성화 (없으면 Portfolio 기본)
  const initialHash = window.location.hash.replace('#', '');
  const validTabs   = ['portfolio', 'dealnews', 'sector'];
  if (initialHash && validTabs.indexOf(initialHash) !== -1) {
    activateTab(initialHash);
  }
  // 그 외는 HTML에 설정된 기본값(Portfolio) 유지

  /* ---------- Deal News filter chips ---------- */
  const chips = document.querySelectorAll('.chip');
  const deals = document.querySelectorAll('.deal');

  function filterDeal(filter) {
    // 모든 딜 표시/숨김 처리
    deals.forEach(deal => {
      const type = deal.dataset.type;
      const show = filter === 'all' || type === filter;
      deal.style.display = show ? '' : 'none';
    });

    // 날짜 헤더 재계산: 보이는 딜이 있는 날짜만 표시
    const dateHeaders = document.querySelectorAll('.deal-date');
    dateHeaders.forEach(header => {
      let next = header.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('deal-date')) {
        if (next.classList.contains('deal') && next.style.display !== 'none') {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      header.style.display = hasVisible ? '' : 'none';
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      filterDeal(chip.dataset.filter);
    });
  });
})();
