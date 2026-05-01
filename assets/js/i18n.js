/* ===========================================================
   IGS Research — i18n.js
   KO (default) / EN language toggle with localStorage persistence.
   =========================================================== */

(function () {
  'use strict';

  var T = {
    ko: {
      'portfolio.desc':   'Case Competition, Co-curricular, 그리고 이전 업무에서 수행한 작업물입니다. PDF는 바로 브라우저에서 미리 볼 수 있으며, Excel 모델은 다운로드 가능합니다.',
      'portfolio.empty':  '아직 업로드된 항목이 없습니다.',
      'dealnews.desc':    '한국 PE/M&A/딜 관련 기사들을 자동으로 스크래핑하는 뉴스레터를 만들었습니다.',
      'chip.all':         '전체',
      'chip.acq':         '인수',
      'chip.exit':        '엑싯',
      'chip.lbo':         'LBO',
      'chip.sec':         '세컨더리',
      'chip.block':       '블록딜',
      'chip.strategic':   '전략적M&A',
      'sector.desc':      'Korean PE / M&A 딜 및 섹터 분석 리포트입니다. 각 리포트를 클릭하면 상세 분석을 확인할 수 있습니다.',
      'sector.empty':     '리포트가 아직 없습니다.',
      'meta.date':        '보고서 일자',
      'meta.dealsize':    '딜 규모',
      'meta.opinion':     '투자 의견',
      'meta.sector':      '섹터',
      'nav.back':         'Reports',
      'disclaimer':       '본 리서치는 공개된 뉴스 및 시장 정보를 기반으로 작성된 정보 제공 목적의 자료이며, 투자 권유 또는 법적 조언이 아닙니다. 수록된 수치 및 분석은 추정치를 포함하며 실제와 다를 수 있습니다. IGS Research는 본 자료의 활용으로 인한 결과에 대해 책임을 지지 않습니다.'
    },
    en: {
      'portfolio.desc':   'Work from case competitions, co-curricular activities, and previous roles. PDFs can be previewed in-browser; Excel models are available for download.',
      'portfolio.empty':  'No items uploaded yet.',
      'dealnews.desc':    'A curated newsletter that automatically aggregates Korean PE / M&A deal articles.',
      'chip.all':         'All',
      'chip.acq':         'Acquisition',
      'chip.exit':        'Exit',
      'chip.lbo':         'LBO',
      'chip.sec':         'Secondary',
      'chip.block':       'Block Deal',
      'chip.strategic':   'Strategic M&A',
      'sector.desc':      'Korean PE / M&A deal and sector analysis reports. Click each report to view the full analysis.',
      'sector.empty':     'No reports yet.',
      'meta.date':        'Report Date',
      'meta.dealsize':    'Deal Size',
      'meta.opinion':     'Opinion',
      'meta.sector':      'Sector',
      'nav.back':         'Reports',
      'disclaimer':       'This research is prepared solely for informational purposes based on publicly available news and market data, and does not constitute investment advice or legal counsel. Figures and analysis included herein contain estimates and may differ from actual results. IGS Research accepts no liability for any outcomes arising from use of this material.'
    }
  };

  function applyLang(lang) {
    if (!T[lang]) return;
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key  = el.getAttribute('data-i18n');
      var text = T[lang][key];
      if (text !== undefined) el.textContent = text;
    });

    document.querySelectorAll('[data-ko]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text) el.textContent = text;
    });

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('lang-btn--active', btn.getAttribute('data-lang') === lang);
    });

    try { localStorage.setItem('igs-lang', lang); } catch (e) {}
  }

  function init() {
    var saved = 'ko';
    try { saved = localStorage.getItem('igs-lang') || 'ko'; } catch (e) {}
    applyLang(saved);

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLang(this.getAttribute('data-lang'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
