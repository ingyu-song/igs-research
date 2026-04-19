/* ===========================================================
   IGS Research — groupdeals.js
   Based on the proven working version.
   Groups deal-rows by company, renders into deal-group blocks.
   =========================================================== */

document.addEventListener('DOMContentLoaded', function () {
  const list = document.getElementById('deal-list');
  if (!list) return;

  const rows = Array.from(list.querySelectorAll('.deal-row'));
  if (!rows.length) return;

  const NOISE_TITLE_KEYWORDS = [
    '주가', '랠리', '시황', '마감', '주주환원', '자사주', '배당',
    '이사회', '사외이사', 'CFO', '대표이사', '인사', '조직',
    '노조', '파업', '의결권', '총파업', '규탄', '비판', '반발',
    '촉구', '경고', '거버넌스 개혁', '개정상법', '기상도',
    'People', 'Story', '영상', 'Board Change',
    '증권업계', '불꽃', '역설', '오버행', '보호예수', '수급 부담'
  ];

  const MEDIA_PREFIXES = [
    '더벨', '단독', '마켓인', '시그널', '이데일리', 'thebell',
    'note', 'Company Watch', 'PE는 지금', 'GP 블라인드',
    'PE 포트폴리오', '주간사모펀드', 'Who Is', '재계 인사이드',
    '재벌승계', '펫뉴스', '기획', '진단', 'PMI', '동십자각',
    '증권업계', '자사주 점검', 'PEF 줌인'
  ];

  const ALIAS_MAP = {
    '이지스운용':             '이지스자산운용',
    '이지스자산운용㈜':       '이지스자산운용',
    '씨앤디서비스':           '대한항공씨앤디서비스',
    '대한항공 기내식 사업부': '대한항공씨앤디서비스',
    'KC&D':                   '대한항공씨앤디서비스',
    'SK AI데이터센터':        'SK AI 데이터센터'
  };

  function isNoise(title) {
    for (const kw of NOISE_TITLE_KEYWORDS) {
      if (title.includes(kw)) return true;
    }
    for (const prefix of MEDIA_PREFIXES) {
      if (title.startsWith('[' + prefix) || title.startsWith(prefix)) return true;
    }
    return false;
  }

  function normalizeCompany(name) {
    if (!name || name === 'null' || name === 'undefined') return null;
    const cleaned = name
      .replace(/^(주식회사|㈜|유한회사|합자회사)\s*/g, '')
      .replace(/\s*(주식회사|㈜|유한회사)$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return null;
    return ALIAS_MAP[cleaned] || cleaned;
  }

  // 회사별 그룹 수집
  const groups = {};
  const order  = [];

  rows.forEach(row => {
    const title = row.dataset.title || '';
    if (isNoise(title)) return;
    const key = normalizeCompany(row.dataset.company);
    if (!key) return;
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(row);
  });

  // 각 그룹 내 최신순 정렬 + 그룹 간 최신 날짜 기준 정렬
  order.forEach(company => {
    groups[company].sort((a, b) => (b.dataset.date || '').localeCompare(a.dataset.date || ''));
  });
  order.sort((a, b) => {
    const dateA = groups[a][0].dataset.date || '';
    const dateB = groups[b][0].dataset.date || '';
    return dateB.localeCompare(dateA);
  });

  // 렌더링
  list.innerHTML = '';
  let lastDate = '';

  order.forEach(company => {
    const items   = groups[company];
    const latest  = items[0];
    const date    = latest.dataset.date || '';
    const types   = [...new Set(items.map(r => r.dataset.type))].join(' ');
    const ev      = latest.dataset.ev && latest.dataset.ev !== 'null' ? latest.dataset.ev : '';
    const tagsEl  = latest.querySelector('.deal-tags');
    const tagsHTML = tagsEl ? tagsEl.innerHTML : '';

    const stage      = latest.dataset.dealStage || '';
    const stageBadge = stage
      ? `<span class="stage-badge stage--${stage}"><span class="stage-dot"></span>${stage}</span>` : '';

    const acquirer     = latest.dataset.acquirer || '';
    const acquirerText = acquirer ? `<span class="deal-acquirer">${acquirer}</span>` : '';
    const summaryText  = latest.dataset.summary || '';

    const hasMultiple = items.length > 1;

    // 날짜 헤더: 이전과 날짜가 다를 때만 별도로 표시
    if (date !== lastDate) {
      const dateHeader = document.createElement('div');
      dateHeader.className = 'deal-date-header';
      dateHeader.dataset.date = date;
      dateHeader.textContent = date;
      list.appendChild(dateHeader);
      lastDate = date;
    }

    const group = document.createElement('div');
    group.className = 'deal-group';
    group.dataset.types = types;
    group.dataset.date  = date;

    group.innerHTML = `
      <div class="deal-group-header" ${hasMultiple
        ? 'role="button" tabindex="0"'
        : `onclick="window.open('${latest.dataset.url}','_blank')"`}>
        <div class="deal-body">
          <div class="deal-title">
            ${company}
            ${stageBadge}
            ${hasMultiple ? `<span class="article-count">+${items.length - 1}</span>` : ''}
          </div>
          <div class="deal-sub">
            ${acquirerText}${acquirerText && summaryText ? ' · ' : ''}${summaryText}
          </div>
          <div class="deal-tags">${tagsHTML}</div>
        </div>
        <div class="deal-ev">${ev}${hasMultiple ? ' <span class="arrow">▸</span>' : ''}</div>
      </div>
      ${hasMultiple ? `
        <div class="deal-articles">
          ${items.map(r => `
            <a class="deal-article-item" href="${r.dataset.url}" target="_blank" rel="noopener">
              <span class="deal-article-title">${r.dataset.title}</span>
              <span class="deal-article-date">${r.dataset.date}</span>
            </a>
          `).join('')}
        </div>
      ` : ''}
    `;

    // 멀티플 그룹 클릭 시 토글
    if (hasMultiple) {
      const header = group.querySelector('.deal-group-header');
      header.addEventListener('click', function () { toggleGroup(header); });
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleGroup(header);
        }
      });
    }

    list.appendChild(group);
  });
});

function toggleGroup(el) {
  const articles = el.closest('.deal-group').querySelector('.deal-articles');
  const arrow    = el.querySelector('.arrow');
  if (!articles) return;
  if (articles.classList.contains('open')) {
    articles.classList.remove('open');
    if (arrow) arrow.textContent = '▸';
  } else {
    articles.classList.add('open');
    if (arrow) arrow.textContent = '▾';
  }
}

/* Filter 기능 — main.js 대신 여기에 두어 전역 filterDeal이 동작하도록 */
function filterDeal(type, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
  if (el) el.classList.add('chip--active');

  const groups = Array.from(document.querySelectorAll('#deal-list .deal-group'));

  groups.forEach(group => {
    if (type === 'all') {
      group.classList.remove('hidden');
    } else {
      const tags = group.dataset.types || '';
      group.classList.toggle('hidden', !tags.split(/\s+/).includes(type));
    }
  });

  // 날짜 헤더 재계산
  const headers = Array.from(document.querySelectorAll('#deal-list .deal-date-header'));
  headers.forEach(header => {
    let next = header.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains('deal-date-header')) {
      if (next.classList.contains('deal-group') && !next.classList.contains('hidden')) {
        hasVisible = true;
        break;
      }
      next = next.nextElementSibling;
    }
    header.style.display = hasVisible ? '' : 'none';
  });
}
