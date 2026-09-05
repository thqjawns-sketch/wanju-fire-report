/* Wanju Fire Report V3.10 - NFDS fire cause selector (no AI) */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const state={heatMain:'',heatSub:'',factorMain:'',factorSub:'',decision:'추정',firstMain:'',firstSub:''};

  // 소방청 화재현황조사서 대분류 + 소방청 2024 화재통계 공개 분류 기준.
  const HEAT={
    '작동기기':['전기적 아크(단락)','불꽃, 스파크, 정전기','기기 전도,복사열,기기발열','역화','기타(작동기기)'],
    '담뱃불, 라이터불':['담뱃불','라이터불, 성냥불','촛불','향불','기타(담뱃불,라이터불)'],
    '마찰, 전도, 복사':['마찰열,마찰 스파크','화염 전도,복사열','기타(마찰,전도,복사)'],
    '불꽃, 불티':['용접, 절단, 연마','굴뚝(연통) 아궁이','모닥불, 연탄, 숯','쓰레기, 논밭두렁','비화','기타(불꽃,불티)'],
    '폭발물, 폭죽':['폭탄, 탄약','폭죽'],
    '화학적 발화열':['화학반응열','발효열'],
    '자연적 발화열':['햇볕','낙뢰','돋보기 효과'],
    '기타':['기타'],
    '미상':['미상']
  };

  const FACTOR={
    '전기적 요인':['누전,지락','접촉불량에 의한 단락','절연열화에 의한 단락','과부하/과전류','압착,손상에 의한 단락','층간단락','트래킹에 의한 단락','반단선','미확인단락','기타(전기적요인)'],
    '기계적 요인':['과열, 과부하','정비불량','오일, 연료누설','노후','자동제어 실패','역화','수동제어 실패','기타(기계적요인)'],
    '제품결함':['설계상결함','제조상결함','기타(제품결함)'],
    '화학적 요인':['화학적 폭발','자연발화','금수성물질의 물과 접촉','혼촉발화','화학적 발화(유증기 확산)','기타(화학적요인)'],
    '가스누출(폭발)':['가스누출(폭발)'],
    '교통사고':['교통사고'],
    '부주의':['담배꽁초','빨래삶기','음식물 조리중','가연물 근접방치','불장난','논,임야태우기','용접, 절단, 연마','유류 취급중','불씨,불꽃,화원방치','폭죽놀이','쓰레기 소각','기기(전기,기계등) 사용·설치부주의','기타(부주의)'],
    '자연적인 요인':['자연적 재해','돋보기 효과','기타(자연적인요인)'],
    '방화':['방화','방화의심'],
    '기타':['기타'],
    '미상':['미상']
  };

  const FIRST={
    '가구':['침대, 매트리스','테이블, 의자','옷장, 책장 등','소파','기타(가구)'],
    '침구, 직물류':['이불(베개,시트)','카펫','의류','행주, 기름걸레','부직포','커튼','기타(침구,직물류)'],
    '종이, 목재, 건초 등':['종이','풀, 나뭇잎','잔디','나무','건초','목재, 합판','톱밥','기타(종이,목재,건초등)'],
    '합성수지':['플라스틱, PVC, 비닐, 장판','합성고무(타이어)','발포폴리스티렌','아크릴수지','우레탄','기타(합성수지)'],
    '간판, 차양막 등':['광고판','차양막','플래카드','네온사인','기타(간판,차양막등)'],
    '식품':['음식물','튀김유','기타(식품)'],
    '전기, 전자':['전선피복','전기, 전자기기 절연유','전기, 전자기기 케이스','전기, 전자기기 기판','전자기기 부속품','콘센트, 스위치류','전기, 전자기기 내부배선','작동장치(모터, 히터, 램프 등)','기타(전기,전자)'],
    '위험물 등':['가솔린','등유','경유','기계유','시너','도료류','광택제, 파라핀, 왁스 등','폭발물질','기타 제4류 위험물','기타(위험물등)'],
    '가연성 가스':['프로판가스','부탄가스','아세틸렌가스','메탄가스','수소가스','기타(가연성가스)'],
    '자동차, 철도차량, 선박, 항공기':['전기배선','타이어','좌석시트','카펫(자동차,철도)','범퍼','화물','벨트','배관','방음재','부품','휘발유','경유(자동차,철도)','천연가스(자동차,철도)','프로판가스(자동차,철도)','오일류','기타(자동차,철도차량,선박,항공기)'],
    '쓰레기류':['쓰레기','분진','폐타이어','폐목재','재활용','기타 쓰레기'],
    '기타':['기타'],
    '미상':['미상']
  };

  function injectStyle(){
    if($('nfdsCauseStyle'))return;
    const s=document.createElement('style');s.id='nfdsCauseStyle';s.textContent=`
      .nfdsCause{margin:14px 0;border:1px solid #d8dee8;border-radius:14px;background:#fff;padding:12px}.nfdsHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:8px}.nfdsTitle{font-size:17px;font-weight:950}.nfdsHint{font-size:12px;color:#667085;line-height:1.45}.nfdsTag{white-space:nowrap;font-size:11px;font-weight:900;background:#ecfdf3;color:#027a48;border:1px solid #abefc6;border-radius:999px;padding:5px 8px}.nfdsBlock{padding:12px 0;border-top:1px solid #e5e7eb}.nfdsBlock:first-of-type{border-top:0}.nfdsLabel{font-weight:950;font-size:14px;margin-bottom:7px}.nfdsMain,.nfdsSub,.nfdsDecision{display:flex;flex-wrap:wrap;gap:6px}.nfdsBtn{min-height:40px;padding:8px 10px;border:1px solid #cfd4dc;border-radius:9px;background:#fff;color:#344054;font-size:13px;font-weight:850}.nfdsBtn.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff}.nfdsSubBox{display:none;margin-top:8px;background:#f0f9e8;border-radius:10px;padding:9px}.nfdsSubBox.show{display:block}.nfdsSub .nfdsBtn{background:#fff}.nfdsSub .nfdsBtn.on{background:#166534;border-color:#166534;color:#fff}.nfdsDecision{margin:8px 0 0}.nfdsDecision .nfdsBtn{min-width:76px}.nfdsSummary{margin-top:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;font-size:13px;line-height:1.6}.nfdsSummary b{display:inline-block;min-width:72px}.nfdsCauseText{margin-top:9px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:9px 10px;font-size:13px;font-weight:850;color:#9a3412}.nfdsMini{font-size:11px;color:#667085;margin-top:5px}@media(max-width:520px){.nfdsBtn{flex:1 1 calc(50% - 6px);padding:8px 6px}.nfdsTag{display:none}}
    `;document.head.appendChild(s);
  }

  function buttonHtml(kind,key){return `<button type="button" class="nfdsBtn" data-kind="${kind}" data-value="${key.replace(/"/g,'&quot;')}">${key}</button>`}
  function blockHtml(id,title,data){return `<div class="nfdsBlock" id="nfds_${id}"><div class="nfdsLabel">${title}</div><div class="nfdsMain" id="nfds_${id}Main">${Object.keys(data).map(k=>buttonHtml(id+'Main',k)).join('')}</div><div class="nfdsSubBox" id="nfds_${id}SubBox"><div class="nfdsMini">소분류</div><div class="nfdsSub" id="nfds_${id}Sub"></div></div></div>`}

  function installUI(){
    const cause=$('cause');if(!cause||$('nfdsCause'))return;
    injectStyle();
    const label=cause.closest('label');
    const sec=document.createElement('div');sec.id='nfdsCause';sec.className='nfdsCause';
    sec.innerHTML=`<div class="nfdsHead"><div><div class="nfdsTitle">화재원인 선택</div><div class="nfdsHint">국가화재정보시스템 분류와 같은 방식으로 대분류를 먼저 선택하면 해당 소분류만 표시됩니다.</div></div><span class="nfdsTag">NFDS 기준</span></div>${blockHtml('heat','① 발화열원',HEAT)}${blockHtml('factor','② 발화요인',FACTOR)}<div class="nfdsDecision"><button type="button" class="nfdsBtn" data-decision="판단">판단</button><button type="button" class="nfdsBtn" data-decision="추정">추정</button></div>${blockHtml('first','③ 최초착화물',FIRST)}<input type="hidden" id="nfdsCauseJson"><div class="nfdsSummary" id="nfdsCauseSummary"></div><div class="nfdsCauseText" id="nfdsReportCause">보고서 원인: 조사 중</div>`;
    if(label)label.insertAdjacentElement('beforebegin',sec);else cause.insertAdjacentElement('beforebegin',sec);
    if(label){for(const n of label.childNodes){if(n.nodeType===3&&n.nodeValue.trim()){n.nodeValue='보고서용 원인 문구(자동작성 후 수정 가능)';break}}}
    hideOldOverviewCause();
    bind();restore();renderAll(false);
  }

  function hideOldOverviewCause(){
    document.querySelectorAll('.ovBlock').forEach(b=>{const l=b.querySelector('.ovLabel');if(l&&/원인/.test(l.textContent||''))b.style.display='none'});
  }

  function dataFor(id){return id==='heat'?HEAT:id==='factor'?FACTOR:FIRST}
  function mainKey(id){return id+'Main'}
  function subKey(id){return id+'Sub'}
  function renderGroup(id){
    const main=state[mainKey(id)],sub=state[subKey(id)],data=dataFor(id),box=$(`nfds_${id}SubBox`),subWrap=$(`nfds_${id}Sub`);
    document.querySelectorAll(`#nfds_${id}Main .nfdsBtn`).forEach(b=>b.classList.toggle('on',b.dataset.value===main));
    if(!main||!data[main]){if(box)box.classList.remove('show');if(subWrap)subWrap.innerHTML='';return}
    if(subWrap)subWrap.innerHTML=data[main].map(v=>buttonHtml(id+'Sub',v)).join('');
    if(box)box.classList.add('show');
    if(subWrap)subWrap.querySelectorAll('.nfdsBtn').forEach(b=>b.classList.toggle('on',b.dataset.value===sub));
  }

  function selectMain(id,val){
    state[mainKey(id)]=val;state[subKey(id)]='';
    const list=dataFor(id)[val]||[];if(list.length===1)state[subKey(id)]=list[0];
    renderAll(true);
  }
  function selectSub(id,val){state[subKey(id)]=val;renderAll(true)}

  function bind(){
    $('nfdsCause').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.decision){state.decision=b.dataset.decision;renderAll(true);return}
      const kind=b.dataset.kind,val=b.dataset.value;if(!kind)return;
      const m=kind.match(/^(heat|factor|first)(Main|Sub)$/);if(!m)return;
      m[2]==='Main'?selectMain(m[1],val):selectSub(m[1],val);
    });
  }

  function reportCause(){
    const m=state.factorMain,s=state.factorSub,d=state.decision||'추정';
    if(!m)return '조사 중';
    if(m==='미상')return '미상';
    if(!s)return '조사 중';
    if(m==='전기적 요인')return `전기적(${s}) 요인 ${d}`;
    if(m==='기계적 요인')return `기계적(${s}) 요인 ${d}`;
    if(m==='화학적 요인')return `화학적(${s}) 요인 ${d}`;
    if(m==='자연적인 요인')return `자연적(${s}) 요인 ${d}`;
    if(m==='부주의')return `부주의(${s}) 요인 ${d}`;
    if(m==='제품결함')return `제품결함(${s}) ${d}`;
    if(m==='방화')return s==='방화의심'?`방화의심 ${d}`:`방화 ${d}`;
    if(m==='가스누출(폭발)')return `가스누출(폭발) ${d}`;
    if(m==='교통사고')return `교통사고 ${d}`;
    if(m==='기타')return `기타 ${d}`;
    return `${m}${s?`(${s})`:''} ${d}`;
  }

  function syncCause(){
    const c=$('cause'),text=reportCause();if(!c)return;
    if(state.factorMain){c.value=text;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}))}
    const out=$('nfdsReportCause');if(out)out.textContent='보고서 원인: '+(state.factorMain?text:(c.value||'조사 중'));
  }

  function renderSummary(){
    const e=$('nfdsCauseSummary');if(!e)return;
    const row=(name,a,b)=>`<div><b>${name}</b>${a?`${a}${b?' > '+b:''}`:'미선택'}</div>`;
    e.innerHTML=row('발화열원',state.heatMain,state.heatSub)+row('발화요인',state.factorMain,state.factorSub)+`<div><b>판정구분</b>${state.decision}</div>`+row('최초착화물',state.firstMain,state.firstSub);
  }

  function saveHidden(){const h=$('nfdsCauseJson');if(h)h.value=JSON.stringify(state)}
  function renderAll(updateCause){
    renderGroup('heat');renderGroup('factor');renderGroup('first');
    document.querySelectorAll('[data-decision]').forEach(b=>b.classList.toggle('on',b.dataset.decision===state.decision));
    renderSummary();saveHidden();if(updateCause)syncCause();else{const out=$('nfdsReportCause');if(out)out.textContent='보고서 원인: '+($('cause')?.value||'조사 중')}
  }

  function restore(){
    try{
      const saved=JSON.parse(localStorage.getItem('wanjuFireReportV2')||'{}');
      if(saved.nfdsCauseJson){const p=JSON.parse(saved.nfdsCauseJson);Object.assign(state,p||{})}
      else if(saved.nfdsCause&&typeof saved.nfdsCause==='object')Object.assign(state,saved.nfdsCause);
    }catch(e){}
  }

  function patchCollect(){
    try{
      const old=collect;
      collect=function(){const d=old();d.nfdsCause={...state};d.heatSourceMain=state.heatMain;d.heatSourceSub=state.heatSub;d.causeFactorMain=state.factorMain;d.causeFactorSub=state.factorSub;d.causeDecision=state.decision;d.firstIgnitedMain=state.firstMain;d.firstIgnitedSub=state.firstSub;return d};
    }catch(e){}
  }

  function install(){installUI();patchCollect();const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.10';document.title='완주소방서 화재상황보고 V3.10'}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120));else setTimeout(install,120);
})();
