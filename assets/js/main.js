function show(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.querySelectorAll('.navlink').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('visible');
  el.classList.add('active');
}

function filterDeal(type, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.deal-row').forEach(row => {
    if (type === 'all' || row.dataset.type === type) {
      row.classList.remove('hidden');
    } else {
      row.classList.add('hidden');
    }
  });
}
