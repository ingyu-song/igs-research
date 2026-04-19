/* ===========================================================
   IGS Research — groupdeals.js
   Groups deals by company; collapsed by default; click to expand.
   =========================================================== */

(function () {
  'use strict';

  var ALIAS_MAP = {
    '이지스운용':             '이지스자산운용',
    '이지스자산운용㈜':       '이지스자산운용',
    '씨앤디서비스':           '대한항공씨앤디서비스',
    '대한항공 기내식 사업부': '대한항공씨앤디서비스',
    'KC&D':                   '대한항공씨앤디서비스',
    'SK AI데이터센터':        'SK AI 데이터센터'
  };

  function normalize(name) {
    if (!name) return '';
    var trimmed = String(name).trim();
    return ALIAS_MAP[trimmed] || trimmed;
  }

  // HTML escape (브라우저가 자동으로 이미 디코딩한 상태의 문자열을 받음)
  function esc(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  function render() {
    var container = document.getElementById('deal-list');
    if (!container) {
      console.warn('[groupdeals] #deal-list not found');
      return;
    }

    // placeholder .deal 요소 수집
    var rows = container.querySelectorAll('.deal');
    console.log('[groupdeals] Found', rows.length, 'raw deals');

    if (rows.length === 0) {
      container.innerHTML = '<p class="empty">데이터를 불러오는 중입니다...</p>';
      return;
    }

    // 각 요소의 data-* 속성을 읽어 객체로 변환
    var deals = [];
    rows.forEach(function (el) {
      deals.push({
        type:     el.getAttribute('data-type')     || '',
        company:  normalize(el.getAttribute('data-company')),
        date:     el.getAttribute('data-date')     || '',
        title:    el.getAttribute('data-title')    || '',
        url:      el.getAttribute('data-url')      || '',
        summary:  el.getAttribute('data-summary')  || '',
        acquirer: el.getAttribute('data-acquirer') || '',
        ev:       el.getAttribute('data-ev')       || '',
        stage:    el.getAttribute('data-stage')    || '',
        tags:     (el.getAttribute('data-tags') || '').split(',').filter(Boolean)
      });
    });

    // 날짜 → 회사별 그룹화
    var byDate = {};
    var dateOrder = [];

    deals.forEach(function (d) {
      var dateKey = d.date || '미정';
      if (!byDate[dateKey]) {
        byDate[dateKey] = { companies: {}, order: [] };
        dateOrder.push(dateKey);
      }
      var bucket = byDate[dateKey];
      var compKey = d.company || '_unknown_';
      if (!bucket.companies[compKey]) {
        bucket.companies[compKey] = [];
        bucket.order.push(compKey);
      }
      bucket.companies[compKey].push(d);
    });

    // HTML 생성
    var parts = [];

    dateOrder.forEach(function (date) {
      parts.push('<div class="deal-date" data-date="' + esc(date) + '">' + esc(date) + '</div>');

      var bucket = byDate[date];
      bucket.order.forEach(function (company) {
        var group = bucket.companies[company];
        var lead  = group[0];
        var extras = group.slice(1);

        var allTypes = Array.from(new Set(group.map(function (d) { return d.type; }).filter(Boolean))).join(' ');
        var hasMore = extras.length > 0;

        var block = [];
        block.push('<article class="deal-group" data-types="' + esc(allTypes) + '" data-company="' + esc(company) + '">');
        block.push(  '<div class="deal" data-type="' + esc(lead.type) + '">');
        block.push(    '<div class="deal__head">');
        block.push(      '<h3 class="deal__company">');
        block.push(        esc(company));
        if (lead.stage) {
          block.push(    ' <span class="stage-badge stage--' + esc(lead.stage) + '">');
          block.push(      '<span class="stage-dot"></span>' + esc(lead.stage));
          block.push(    '</span>');
        }
        if (hasMore) {
          block.push(    ' <button class="deal-toggle" type="button" aria-expanded="false">');
          block.push(      '<span class="deal-toggle__arrow">▸</span>');
          block.push(      '<span class="deal-toggle__count">+' + extras.length + '</span>');
          block.push(    '</button>');
        }
        block.push(      '</h3>');
        if (lead.ev) {
          block.push(  '<span class="deal__ev">' + esc(lead.ev) + '</span>');
        }
        block.push(    '</div>');
        if (lead.title) {
          if (lead.url) {
            block.push('<p class="deal__title"><a href="' + esc(lead.url) + '" target="_blank" rel="noopener">' + esc(lead.title) + '</a></p>');
          } else {
            block.push('<p class="deal__title">' + esc(lead.title) + '</p>');
          }
        }
        if (lead.summary) {
          block.push(  '<p class="deal__summary">' + esc(lead.summary) + '</p>');
        }
        if (lead.acquirer || lead.tags.length) {
          block.push(  '<div class="deal__meta">');
          if (lead.acquirer) block.push('<span class="deal__acquirer">' + esc(lead.acquirer) + '</span>');
          lead.tags.forEach(function (t) {
            block.push(  '<span class="deal__tag">' + esc(t) + '</span>');
          });
          block.push(  '</div>');
        }
        block.push(  '</div>');

        if (hasMore) {
          block.push('<ul class="deal-extras" hidden>');
          extras.forEach(function (d) {
            block.push('<li class="deal-extra">');
            if (d.url) {
              block.push(  '<a class="deal-extra__link" href="' + esc(d.url) + '" target="_blank" rel="noopener">');
            } else {
              block.push(  '<div class="deal-extra__link">');
            }
            block.push(    '<span class="deal-extra__title">' + esc(d.title) + '</span>');
            block.push(    '<span class="deal-extra__date">' + esc(d.date) + '</span>');
            block.push(  d.url ? '</a>' : '</div>');
            block.push('</li>');
          });
          block.push('</ul>');
        }

        block.push('</article>');
        parts.push(block.join(''));
      });
    });

    container.innerHTML = parts.join('');
    console.log('[groupdeals] Rendered', dateOrder.length, 'dates');

    // 토글 이벤트 바인딩
    container.querySelectorAll('.deal-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var group = btn.closest('.deal-group');
        if (!group) return;
        var extras = group.querySelector('.deal-extras');
        var arrow  = btn.querySelector('.deal-toggle__arrow');
        if (!extras) return;

        var isOpen = !extras.hasAttribute('hidden');
        if (isOpen) {
          extras.setAttribute('hidden', '');
          btn.setAttribute('aria-expanded', 'false');
          if (arrow) arrow.textContent = '▸';
        } else {
          extras.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
          if (arrow) arrow.textContent = '▾';
        }
      });
    });
  }

  // DOM 준비되면 렌더링
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  window.__dealGroupRender__ = render;
})();
