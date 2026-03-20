document.addEventListener('DOMContentLoaded', function() {
  const list = document.getElementById('deal-list');
  if (!list) return;

  const rows = Array.from(list.querySelectorAll('.deal-row'));
  if (!rows.length) return;

  const groups = {};

  rows.forEach(row => {
    const title = row.dataset.title || '';
    const company = extractCompany(title);
    if (!groups[company]) groups[company] = [];
    groups[company].push(row);
  });

  list.innerHTML = '';

  Object.entries(groups).forEach(([company, items]) => {
    const types = [...new Set(items.map(r => r.dataset.type))].join(' ');
    const latest = items[0];
    const date = latest.dataset.date || '';
    const ev = latest.dataset.ev || '—';
    const tags = latest.querySelector('.deal-tags') ? latest.querySelector('.deal-tags').innerHTML : '';

    const group = document.createElement('div');
    group.className = 'deal-group';
    group.dataset.types = types;

    const summary = items.length > 1
      ? `<span class="article-count">${items.length}개 기사</span>`
      : '';

    group.innerHTML = `
      <div class="deal-group-header" onclick="toggleGroup(this)">
        <div class="deal-date">${date}</div>
        <div class="deal-body">
          <div class="deal-title">${company} ${summary}</div>
          <div class="deal-sub">${latest.dataset.summary || ''}</div>
          <div class="deal-tags">${tags}</div>
        </div>
        <div class="deal-ev">${ev} <span class="arrow">${items.length > 1 ? '▸' : ''}</span></div>
      </div>
      ${items.length > 1 ? `<div class="deal-articles">${items.map(r => `
        <a class="deal-article-item" href="${r.dataset.url}" target="_blank" rel="noopener">
          <span class="deal-article-title">${r.dataset.title}</span>
          <span class="deal-article-date">${r.dataset.date}</span>
        </a>`).join('')}</div>` : `
        <a class="deal-single-link" href="${latest.dataset.url}" target="_blank" rel="noopener" style="display:none"></a>
      `}
    `;

    if (items.length === 1) {
      group.querySelector('.deal-group-header').style.cursor = 'pointer';
      group.querySelector('.deal-group-header').onclick = () => {
        window.open(latest.dataset.url, '_blank');
      };
    }

    list.appendChild(group);
  });
});

function extractCompany(title) {
  const companies = [
    'MBK', '한앤컴퍼니', '한앤코', 'IMM', '어피니티', '스틱', 'VIG', 
    '크레센도', '파라투스', 'H&Q', 'JKL', 'BNW', '케이스톤', '제네시스',
    '고려아연', '한온시스템', '롯데렌탈', 'SK렌터카', 'HPSP', '교보생명',
    '홈플러스', '남양유업', '한진칼', '한국앤컴퍼니', '서울전선',
    '공구우먼', '케이뱅크', 'SK이터닉스', '롯데손보', '에코비트',
    '클래시스', '베인캐피탈', '레뷰', '민팃', '아이티켐'
  ];
  for (const c of companies) {
    if (title.includes(c)) return c;
  }
  const match = title.match(/^[\[〔（(]?([가-힣A-Za-z0-9·&]+)/);
  return match ? match[1].slice(0, 15) : title.slice(0, 20);
}
