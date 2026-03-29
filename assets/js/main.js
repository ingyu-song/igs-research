let currentRegion = 'korea';

function show(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.querySelectorAll('.navlink').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('visible');
  el.classList.add('active');
}

function switchRegion(region, el) {
  document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentRegion = region;

  const koreaList = document.getElementById('deal-list-korea');
  const worldList = document.getElementById('deal-list-world');
  const label = document.getElementById('flow-label');

  if (region === 'korea') {
    koreaList.style.display = '';
    worldList.style.display = 'none';
    if (label) label.textContent = 'Auto-archived · Korea PE/M&A';
  } else {
    koreaList.style.display = 'none';
    worldList.style.display = '';
    if (label) label.textContent = 'Auto-archived · Global PE/M&A';
  }

  // 필터 초기화
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip').classList.add('active');
}

function filterDeal(type, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  const listId = currentRegion === 'korea' ? 'deal-list-korea' : 'deal-list-world';
  const groups = Array.from(document.querySelectorAll(`#${listId} .deal-group`));

  groups.forEach(group => {
    if (type === 'all') {
      group.classList.remove('hidden');
    } else {
      const tags = group.dataset.types || '';
      group.classList.toggle('hidden', !tags.includes(type));
    }
  });

  // 날짜 재계산
  let lastDate = '';
  groups.forEach(group => {
    if (group.classList.contains('hidden')) return;
    const dateEl = group.querySelector('.deal-date');
    if (!dateEl) return;
    const date = dateEl.dataset.date || dateEl.textContent.trim();
    dateEl.textContent = date && date !== lastDate ? (lastDate = date, date) : (lastDate = lastDate, '');
  });
}

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
