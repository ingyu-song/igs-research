/* ===========================================================
   IGS Research — groupdeals.js
   Groups deals by company; collapsed by default; click to expand.
   Reads raw data from [data-source="raw"] and re-renders.
   =========================================================== */

(function () {
  'use strict';

  // 회사명 통합 (alias) — 같은 회사의 다른 표기를 하나로
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
    var trimmed = name.trim();
    return ALIAS_MAP[trimmed] || trimmed;
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function render() {
    var container = document.getElementById('deal-list');
    if (!container) return;

    // 원본 데이터 수집
    var rawRows = Array.from(container.querySelectorAll('.deal[data-source-row], .deal'));
    // 첫 렌더 시점에는 placeholder .deal만 있음 — 그걸 원본으로 사용
    var rows = Array.from(container.children).filter(function (el) {
      return el.classList && el.classList.contains('deal');
    });

    // 원본 데이터를 객체 배열로 추출
    var deals = rows.map(function (el) {
      return {
        type:     el.dataset.type     || '',
        company:  normalize(el.dataset.company),
        date:     el.dataset.date     || '',
        title:    el.dataset.title    || '',
        url:      el.dataset.url      || '',
        summary:  el.dataset.summary  || '',
        acquirer: el.dataset.acquirer || '',
        ev:       el.dataset.ev       || '',
        stage:    el.dataset.stage    || '',
        tags:     (el.dataset.tags || '').split(',').filter(Boolean)
      };
    });

    // 날짜 → 회사별로 그룹화
    // 구조: { date: { company: [deal, deal, ...] } }
    var byDate = {};
    var dateOrder = [];

    deals.forEach(function (d) {
      if (!byDate[d.date]) {
        byDate[d.date] = { companies: {}, order: [] };
        dateOrder.push(d.date);
      }
      var bucket = byDate[d.date];
      var key = d.company || '_unknown_';
      if (!bucket.companies[key]) {
        bucket.companies[key] = [];
        bucket.order.push(key);
      }
      bucket.companies[key].push(d);
    });

    // HTML 생성
    var html = '';

    dateOrder.forEach(function (date) {
      html += '<div class="deal-date" data-date="' + esc(date) + '">' + esc(date) + '</div>';

      var bucket = byDate[date];
      bucket.order.forEach(function (company) {
        var group = bucket.companies[company];
        var lead  = group[0]; // 대표 기사
        var extras = group.slice(1);

        // 그룹 types 집합 (필터링용)
        var allTypes = Array.from(new Set(group.map(function (d) { return d.type; }))).join(' ');
        var hasMore = extras.length > 0;

        html += '<article class="deal-group" data-types="' + esc(allTypes) + '" data-company="' + esc(company) + '">';
        html +=   '<div class="deal" data-type="' + esc(lead.type) + '">';
        html +=     '<div class="deal__head">';
        html +=       '<h3 class="deal__company">';
        html +=         esc(company);
        if (lead.stage) {
          html +=     ' <span class="stage-badge stage--' + esc(lead.stage) + '">';
          html +=       '<span class="stage-dot"></span>' + esc(lead.stage);
          html +=     '</span>';
        }
        if (hasMore) {
          html +=     ' <button class="deal-toggle" type="button" aria-expanded="false">';
          html +=       '<span class="deal-toggle__arrow">▸</span>';
          html +=       '<span class="deal-toggle__count">+' + extras.length + '</span>';
          html +=     '</button>';
        }
        html +=       '</h3>';
        if (lead.ev) {
          html +=   '<span class="deal__ev">' + esc(lead.ev) + '</span>';
        }
        html +=     '</div>';
        html +=     '<p class="deal__title"><a href="' + esc(lead.url) + '" target="_blank" rel="noopener">' + esc(lead.title) + '</a></p>';
        html +=     '<p class="deal__summary">' + esc(lead.summary) + '</p>';
        html +=     '<div class="deal__meta">';
        if (lead.acquirer) html += '<span class="deal__acquirer">' + esc(lead.acquirer) + '</span>';
        lead.tags.forEach(function (t) {
          html +=     '<span class="deal__tag">' + esc(t) + '</span>';
        });
        html +=     '</div>';
        html +=   '</div>';

        // 확장 영역: 나머지 기사들
        if (hasMore) {
          html += '<ul class="deal-extras" hidden>';
          extras.forEach(function (d) {
            html += '<li class="deal-extra">';
            html +=   '<a class="deal-extra__link" href="' + esc(d.url) + '" target="_blank" rel="noopener">';
            html +=     '<span class="deal-extra__title">' + esc(d.title) + '</span>';
            html +=     '<span class="deal-extra__date">' + esc(d.date) + '</span>';
            html +=   '</a>';
            html += '</li>';
          });
          html += '</ul>';
        }

        html += '</article>';
      });
    });

    container.innerHTML = html;

    // 토글 이벤트
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

  // DOM 준비 후 렌더링
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  // 필터 재호출을 위해 전역 노출 (main.js에서 사용)
  window.__dealGroupRender__ = render;
})();
