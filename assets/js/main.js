function show(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.querySelectorAll('.navlink').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('visible');
  el.classList.add('active');
}

function filterDeal(type, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.deal-group').forEach(group => {
    if (type === 'all') {
      group.classList.remove('hidden');
    } else {
      const tags = group.dataset.types || '';
      if (tags.includes(type)) {
        group.classList.remove('hidden');
      } else {
        group.classList.add('hidden');
      }
    }
  });
}

function toggleGroup(el) {
  const articles = el.closest('.deal-group').querySelector('.deal-articles');
  const arrow = el.querySelector('.arrow');
  if (articles.classList.contains('open')) {
    articles.classList.remove('open');
    arrow.textContent = '▸';
  } else {
    articles.classList.add('open');
    arrow.textContent = '▾';
  }
}
