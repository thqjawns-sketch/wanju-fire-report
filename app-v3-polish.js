/* Wanju Fire Report V3.17 - load V3.16 base and start report sections collapsed */
(function(){
  'use strict';
  function setVersion(){
    const h=document.querySelector('header h1');
    if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.17';
    document.title='완주소방서 화재상황보고 V3.17';
  }
  function closeAllReportSections(){
    document.querySelectorAll('main > .card.wanjuFoldCard').forEach(card=>{
      card.classList.add('wanjuClosed');
      const arrow=card.querySelector(':scope > h2 .wanjuFoldArrow');
      if(arrow)arrow.textContent='▶';
    });
  }
  const s=document.createElement('script');
  s.src='app-v3-polish-v316-base.js?v=20260908d';
  s.defer=true;
  s.onload=()=>{
    setTimeout(()=>{closeAllReportSections();setVersion()},360);
    setTimeout(setVersion,1150);
  };
  document.head.appendChild(s);
})();
