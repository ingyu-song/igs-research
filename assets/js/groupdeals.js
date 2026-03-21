document.addEventListener('DOMContentLoaded', function() {
  const list = document.getElementById('deal-list');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.deal-row'));
  if (!rows.length) return;

  // ── 1. 노이즈 필터 ───────────────────────────────────────────────────────
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

  function isNoise(title) {
    for (const kw of NOISE_TITLE_KEYWORDS) {
      if (title.includes(kw)) return true;
    }
    for (const prefix of MEDIA_PREFIXES) {
      if (title.startsWith('[' + prefix) || title.startsWith(prefix)) return true;
    }
    return false;
  }

  // ── 2. 회사명 정규화 ─────────────────────────────────────────────────────
  function normalizeCompany(name) {
    if (!name || name === 'null' || name === 'undefined') return null;
    const cleaned = name
      .replace(/^(주식회사|㈜|유한회사|합자회사)\s*/g, '')
      .replace(/\s*(주식회사|㈜|유한회사)$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || null;
  }

  // ── 3. 그룹핑 키: data-company 만 사용, fallback 없음 ───────────────────
  function resolveGroupKey(row) {
    return normalizeCompany(row.dataset.company) || null;
  }

  // ── 4. 그룹 빌드 ─────────────────────────────────────────────────────────
  const groups = {};
  const order = [];

  rows.forEach(row => {
    const title = row.dataset.title || '';
    if (isNoise(title)) return;
    const key = resolveGroupKey(row);
    if (!key) return;
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(row);
  });

  // 날짜 내림차순
  order.sort((a, b) => {
    const dateA = groups[a][0].dataset.date || '';
    const dateB = groups[b][0].dataset.date || '';
    return dateB.localeCompare(dateA);
  });

  // ── 5. 렌더링 ────────────────────────────────────────────────────────────
  list.innerHTML = '';
  let lastDate = '';

  order.forEach(company => {
    const items = groups[company];
    const types = [...new Set(items.map(r => r.dataset.type))].join(' ');
    const latest = items[0];
    const date = latest.dataset.date || '';
    const ev = latest.dataset.ev && latest.dataset.ev !== 'null' ? latest.dataset.ev : '—';
    const tagsHTML = latest.querySelector('.deal-tags')
      ? latest.querySelector('.deal-tags').innerHTML : '';

    const stage = latest.dataset.dealStage || '';
    const stageLabel = { '소문': 'Rumor', '협상': 'Nego', '계약': 'Signed', '완료': 'Closed' }[stage] || stage;
    const stageBadge = stage
      ? `<span class="stage-badge stage--${stage}"><span class="stage-dot"></span>${stageLabel}</span>` : '';

    const acquirer = latest.dataset.acquirer || '';
    const acquirerText = acquirer
      ? `<span class="deal-acquirer">${acquirer}</span>` : '';

    const hasMultiple = items.length > 1;
    const showDate = date !== lastDate;
    lastDate = date;

    const group = document.createElement('div');
    group.className = 'deal-group';
    group.dataset.types = types;

    group.innerHTML = `
      <div class="deal-group-header" onclick="${hasMultiple
        ? 'toggleGroup(this)'
        : `window.open('${latest.dataset.url}','_blank')`}">
        <div class="deal-date">${showDate ? date : ''}</div>
        <div class="deal-body">
          <div class="deal-title">
            ${company}
            ${stageBadge}
            ${hasMultiple ? `<span class="article-count">${items.length}개 기사</span>` : ''}
          </div>
          <div class="deal-sub">
            ${acquirerText}${acquirerText && latest.dataset.summary ? ' · ' : ''}${latest.dataset.summary || ''}
          </div>
          <div class="deal-tags">${tagsHTML}${stageBadge}</div>
        </div>
        <div class="deal-ev">${ev}${hasMultiple ? ' <span class="arrow">▸</span>' : ''}</div>
      </div>
      ${hasMultiple ? `<div class="deal-articles">${items.map(r => `
        <a class="deal-article-item" href="${r.dataset.url}" target="_blank" rel="noopener">
          <span class="deal-article-title">${r.dataset.title}</span>
          <span class="deal-article-date">${r.dataset.date}</span>
        </a>`).join('')}</div>` : ''}
    `;

    list.appendChild(group);
  });
});

function toggleGroup(el) {
  const articles = el.closest('.deal-group').querySelector('.deal-articles');
  const arrow = el.querySelector('.arrow');
  if (!articles) return;
  if (articles.classList.contains('open')) {
    articles.classList.remove('open');
    if (arrow) arrow.textContent = '▸';
  } else {
    articles.classList.add('open');
    if (arrow) arrow.textContent = '▾';
  }
}