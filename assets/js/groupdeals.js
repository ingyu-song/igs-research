document.addEventListener('DOMContentLoaded', function() {
  const list = document.getElementById('deal-list');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.deal-row'));
  if (!rows.length) return;

  const NOISE_TITLE_KEYWORDS = [
    '주가', '랠리', '시황', '마감', '주주환원', '자사주', '배당',
    '이사회', '사외이사', 'CFO', '대표이사', '인사', '조직',
    '노조', '파업', '의결권', '총파업', '규탄', '비판', '반발',
    '촉구', '경고', '거버넌스 개혁', '개정상법', '기상도',
    'People', 'Story', '영상', 'Board Change', '이충희',
    '증권업계', '불꽃', '역설'
  ];

  const PE_FIRMS = [
    'MBK', '한앤컴퍼니', '한앤코', 'IMM', '어피니티', '스틱', 'VIG',
    '크레센도', '파라투스', 'H&Q', 'JKL', 'BNW', '케이스톤', '제네시스',
    'KKR', '베인캐피탈', '블랙스톤', 'TPG', '칼라일', '어펄마',
    'E&F', 'JC파트너스', '유진프라이빗', '우리프라이빗', '티앤케이',
    '폴캐피탈', '씨씨지', '한투파', '키움PE', '오케스트라PE',
    '스톤브릿지', 'EQT', '신한투자', '하나증권'
  ];

  const MEDIA_PREFIXES = [
    '더벨', '단독', '마켓인', '시그널', '이데일리', 'thebell',
    'note', 'Company Watch', 'PE는 지금', 'GP 블라인드',
    'PE 포트폴리오', '주간사모펀드', 'Who Is', '재계 인사이드',
    '재벌승계', '펫뉴스', '기획', '진단', 'PMI', '동십자각',
    '증권업계', '자사주 점검', 'PEF 줌인', 'GP 블라인드'
  ];

  const DEAL_COMPANIES = [
    '고려아연', '한온시스템', '롯데렌탈', 'SK렌터카', 'HPSP', '교보생명',
    '홈플러스', '남양유업', '한진칼', '한국앤컴퍼니', '서울전선',
    '공구우먼', '케이뱅크', 'SK이터닉스', '롯데손보', '에코비트',
    '클래시스', '레뷰', '민팃', '아이티켐', '수양켐텍', '크린토피아',
    '네파', '본촌치킨', 'SBI저축은행', 'SK울산', '하나투어',
    '대한항공', '씨앤디서비스', '영풍', '호반건설', '현대카드',
    '현대커머셜', '락앤락', '한샘', 'HMM', '영실업', '장금상선',
    '장금마리타임', 'SK그룹 AI', '롯데', '두산밥캣', '쌍용',
    '동원', '교원', '웅진', '아워홈', '버거킹', '맥도날드',
    '스타벅스', '이마트', '홈플러스', '메가MGC커피'
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

  function extractCompany(title) {
    const cleaned = title.replace(/^\[[^\]]+\]/g, '').trim();

    // 알려진 딜 대상 회사 먼저 매칭
    for (const c of DEAL_COMPANIES) {
      if (cleaned.includes(c)) return c;
    }

    // PE 펀드명만 있는 경우 — 딜 대상 회사 아니면 null
    for (const pe of PE_FIRMS) {
      if (cleaned.startsWith(pe)) return null;
    }

    // 첫 번째 명사 추출 (한글 2글자 이상)
    const match = cleaned.match(/^([가-힣]{2,}(?:\s?[가-힣A-Za-z0-9]+)?)/);
    if (match) {
      const candidate = match[1].trim();
      // PE 펀드명이면 제외
      if (PE_FIRMS.some(pe => candidate.includes(pe))) return null;
      // 너무 일반적인 단어 제외
      const GENERIC = ['토종', '국내', '외국', '글로벌', '한국', '신약', '거버넌스', '증권업계'];
      if (GENERIC.some(g => candidate.startsWith(g))) return null;
      return candidate.slice(0, 15);
    }
    return null;
  }

  const groups = {};
  const order = [];

  rows.forEach(row => {
    const title = row.dataset.title || '';
    if (isNoise(title)) return;
    const company = extractCompany(title);
    if (!company) return;

    if (!groups[company]) {
      groups[company] = [];
      order.push(company);
    }
    groups[company].push(row);
  });

  list.innerHTML = '';

  order.forEach(company => {
    const items = groups[company];
    const types = [...new Set(items.map(r => r.dataset.type))].join(' ');
    const latest = items[0];
    const date = latest.dataset.date || '';
    const ev = latest.dataset.ev && latest.dataset.ev !== 'null' ? latest.dataset.ev : '—';
    const tagsHTML = latest.querySelector('.deal-tags') ? latest.querySelector('.deal-tags').innerHTML : '';
    const hasMultiple = items.length > 1;

    const group = document.createElement('div');
    group.className = 'deal-group';
    group.dataset.types = types;

    group.innerHTML = `
      <div class="deal-group-header" onclick="${hasMultiple ? 'toggleGroup(this)' : `window.open('${latest.dataset.url}','_blank')`}">
        <div class="deal-date">${date}</div>
        <div class="deal-body">
          <div class="deal-title">${company}${hasMultiple ? `<span class="article-count">${items.length}개 기사</span>` : ''}</div>
          <div class="deal-sub">${latest.dataset.summary || ''}</div>
          <div class="deal-tags">${tagsHTML}</div>
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
