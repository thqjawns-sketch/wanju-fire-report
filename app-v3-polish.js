/* Wanju Fire Report V3.16 - field workflow refinements
 * - 종료시간 입력 제거, 조치사항 완진/자체진화 시간 연동
 * - 재산피해 금액 입력 단위 천원 통일 + 항목 삭제
 * - 주요 선택버튼 재터치 시 선택 취소
 * - 조치사항 시간순 정렬
 * - HWPX 텍스트 수정 후 linesegarray 제거로 손상·변조 경고 방지
 * - 화재원인 조사 중 빠른선택
 * - 특수·사후조사 조치 선택영역 제거
 * - 선착대 도착 차량 선택(펌프/구급 + 직접입력)
 * - 화재조사 판단 불필요 선택항목 정리
 * - 발생개요부터 큰 항목 접기/펼치기
 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const val=id=>$(id)?.value||'';
  const num=id=>Number(val(id)||0);
  const set=(id,x)=>{if($(id))$(id).value=x};

  function timeValue(x){
    const m=String(x||'').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if(!m)return '';
    return String(Math.min(23,Number(m[1]))).padStart(2,'0')+':'+String(Math.min(59,Number(m[2]))).padStart(2,'0');
  }
  function derivedEndTime(){
    if(val('status')==='화재진압 중')return '';
    let list=[];try{list=Array.isArray(actionState)?actionState:[]}catch(e){}
    const wanted=val('status')==='자체진화'?['self','complete']:['complete'];
    for(let i=list.length-1;i>=0;i--){if(wanted.includes(list[i]?.type)&&timeValue(list[i]?.time))return timeValue(list[i].time)}
    return '';
  }
  function derivedEndText(){
    const status=val('status')||'화재완진';
    if(status==='화재진압 중')return '화재진압 중';
    const label=status==='화재완진'?'완진':status;
    return `${derivedEndTime()||'-'}(${label})`;
  }
  function syncDerivedEnd(){set('end',derivedEndTime())}
  function hideEndInput(){
    const e=$('end');if(!e)return;
    const label=e.closest('label');if(label)label.style.display='none';
    const grid=label?.parentElement;if(grid?.classList.contains('grid'))grid.style.gridTemplateColumns='1fr';
    if($('status')&&!$('endAutoHint')){
      const hint=document.createElement('div');hint.id='endAutoHint';hint.className='hint';hint.textContent='종료시간은 조치사항의 완진 또는 자체진화 시간을 자동으로 사용합니다.';
      grid?.insertAdjacentElement('afterend',hint);
    }
    syncDerivedEnd();
  }
  try{window.endText=derivedEndText}catch(e){}
  try{window.exactEndText=derivedEndText}catch(e){}
  try{const oldSync=syncActionsText;syncActionsText=function(){oldSync();syncDerivedEnd()}}catch(e){}
  try{const oldCollect=collect;collect=function(){syncDerivedEnd();const d=oldCollect();d.end=derivedEndTime();d.endStatus=val('status');return d}}catch(e){}

  let firstArrivalPicker=null,firstArrivalSelected=new Set();
  function shortUnitName(name){name=String(name||'').trim();return name?name.replace(/119안전센터$/,''):''}
  function firstArrivalVehicleNames(){
    const select=$('first');
    const units=select?Array.from(select.options).map(o=>o.value||o.textContent).filter(x=>x&&x!=='선택'):[];
    const out=[];units.forEach(u=>{const base=shortUnitName(u);if(base)out.push(base+'펌프',base+'구급')});return [...new Set(out)];
  }
  function ensureFirstArrivalPicker(){
    if(firstArrivalPicker)return;
    const st=document.createElement('style');st.id='firstArrivalPickerStyle';st.textContent=`.faOverlay{position:fixed;inset:0;z-index:100050;background:rgba(0,0,0,.45);display:none;align-items:flex-end;justify-content:center}.faOverlay.show{display:flex}.faSheet{width:min(100%,620px);max-height:85vh;overflow:auto;background:#fff;border-radius:20px 20px 0 0;padding:16px 14px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box}.faTitle{font-size:18px;font-weight:950}.faHint{font-size:12px;color:#667085;line-height:1.45;margin:3px 0 10px}.faGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.faChoice{min-height:44px;border:1px solid #cfd4dc;border-radius:10px;background:#fff;font-weight:900;color:#344054}.faChoice.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff}.faManual{margin-top:12px}.faBtns{display:grid;grid-template-columns:1fr 1.3fr;gap:8px;margin-top:12px}.faBtns button{height:48px;border:0;border-radius:11px;font-weight:950}.faCancel{background:#e5e7eb}.faOk{background:#b91c1c;color:#fff}@media(min-width:700px){.faOverlay{align-items:center;padding:20px}.faSheet{border-radius:20px}}`;document.head.appendChild(st);
    firstArrivalPicker=document.createElement('div');firstArrivalPicker.className='faOverlay';firstArrivalPicker.innerHTML=`<div class="faSheet"><div class="faTitle">선착대 차량 선택</div><div class="faHint">펌프·구급을 복수 선택하거나 외곽서 선착 차량을 직접 입력하세요.</div><div id="faVehicleGrid" class="faGrid"></div><label class="faManual">외곽서·기타 차량 직접입력<input id="faManualInput" placeholder="예: 전주덕진펌프 / 김제구급"></label><div class="faBtns"><button type="button" class="faCancel">취소</button><button type="button" class="faOk">선착대 도착 추가</button></div></div>`;
    document.body.appendChild(firstArrivalPicker);
    firstArrivalPicker.querySelector('.faCancel').onclick=()=>firstArrivalPicker.classList.remove('show');
    firstArrivalPicker.addEventListener('click',e=>{if(e.target===firstArrivalPicker)firstArrivalPicker.classList.remove('show')});
    firstArrivalPicker.querySelector('.faOk').onclick=confirmFirstArrival;
  }
  function renderFirstArrivalChoices(){
    ensureFirstArrivalPicker();const grid=firstArrivalPicker.querySelector('#faVehicleGrid');grid.innerHTML='';
    firstArrivalVehicleNames().forEach(name=>{const b=document.createElement('button');b.type='button';b.className='faChoice';b.textContent=name;b.classList.toggle('on',firstArrivalSelected.has(name));b.onclick=()=>{firstArrivalSelected.has(name)?firstArrivalSelected.delete(name):firstArrivalSelected.add(name);renderFirstArrivalChoices()};grid.appendChild(b)});
  }
  function openFirstArrivalPicker(){ensureFirstArrivalPicker();firstArrivalSelected=new Set();firstArrivalPicker.querySelector('#faManualInput').value='';renderFirstArrivalChoices();firstArrivalPicker.classList.add('show')}
  function confirmFirstArrival(){
    let actions;try{actions=actionState}catch(e){return}
    const manual=firstArrivalPicker.querySelector('#faManualInput').value.trim(),vehicles=[...firstArrivalSelected];if(manual)vehicles.push(manual);
    const text=`선착대 도착${vehicles.length?'('+vehicles.join(', ')+')':''}`;
    actions.push({type:'first',time:previousActionTime(),text});firstArrivalPicker.classList.remove('show');renderActionRows();syncActionsText();
    try{toggleActionPad(actions.length-1)}catch(e){}
  }

  function actionSeconds(t){const m=String(t||'').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);return m?Number(m[1])*3600+Number(m[2])*60+Number(m[3]||0):Infinity}
  window.sortActionsByTime=function(){
    let list;try{list=actionState}catch(e){return}
    const tagged=list.map((a,i)=>({a,i}));tagged.sort((x,y)=>{const ax=actionSeconds(x.a.time),ay=actionSeconds(y.a.time);return ax===ay?x.i-y.i:ax-ay});list.splice(0,list.length,...tagged.map(x=>x.a));
    try{renderActionRows()}catch(e){}try{syncActionsText()}catch(e){}const s=$('actionSortStatus');if(s){s.textContent='✓ 시간순으로 정렬됨';setTimeout(()=>s.textContent='',1400)}
  };
  function addSortButton(){
    const rows=$('actionRows');if(!rows||$('actionSortBtn'))return;const wrap=document.createElement('div');wrap.style.cssText='display:flex;gap:8px;align-items:center;margin:8px 0 10px;flex-wrap:wrap';wrap.innerHTML='<button type="button" id="actionSortBtn" class="btn blue" style="margin:0">↕ 시간순 정렬</button><span id="actionSortStatus" class="status" style="margin:0"></span>';rows.insertAdjacentElement('beforebegin',wrap);$('actionSortBtn').onclick=window.sortActionsByTime;
  }
  try{
    addActionTemplate=function(d){
      if(d.once){const idx=actionState.findIndex(x=>x.type===d.id);if(idx>=0){actionState.splice(idx,1);renderActionRows();syncActionsText();return}}
      if(d.id==='first'){openFirstArrivalPicker();return}
      const baseTime=d.recv?(val('recv')||previousActionTime()):previousActionTime();actionState.push({type:d.id,time:baseTime,text:d.text});renderActionRows();syncActionsText();const i=actionState.length-1;if(!d.recv)toggleActionPad(i);
    };
  }catch(e){}
  function removeSpecialActionQuickSection(){const box=$('actionSpecialButtons');if(!box)return;const heading=box.previousElementSibling;if(heading&&heading.tagName==='H3')heading.remove();box.remove()}

  const MONEY_IDS=['buildingUnit','facilityUnit','structureAssetUnit','businessUnit','householdBuy','fixturesBuy','machineValue','toolsValue','inventoryValue','vehicleValue','otherValue'];
  const UNIT_LABELS={buildingUnit:'신축단가(천원/㎡)',facilityUnit:'단위당 표준단가(천원)',structureAssetUnit:'단위당 표준단가(천원)',businessUnit:'표준단가(천원/㎡)',householdBuy:'재구입비(천원)',fixturesBuy:'재구입비(천원)',machineValue:'현재가액/재구입비(천원)',toolsValue:'현재가액/재구입비(천원)',inventoryValue:'현재가액(천원)',vehicleValue:'시중매매가격/수리비(천원)',otherValue:'현재가/재구입비(천원)'};
  function fmtThousand(x){return Math.round(Math.max(0,Number(x)||0)).toLocaleString('ko-KR')+'천원'}
  function residual2(age,life,dep,floor){age=Number(age||0);life=Number(life||0);if(life<=0)return 1;return Math.min(1,Math.max(floor,1-dep*(age/life)))}
  function calcK(id){
    const L=x=>num(x)/100;let a=0;
    if(id==='building')a=num('buildingUnit')*num('buildingArea')*residual2(num('buildingAge'),num('buildingLife'),.8,.2)*L('buildingLoss');
    if(id==='facility')a=num('facilityUnit')*num('facilityQty')*residual2(num('facilityAge'),num('facilityLife'),.8,.2)*L('facilityLoss');
    if(id==='structureAsset')a=num('structureAssetUnit')*num('structureAssetQty')*residual2(num('structureAssetAge'),num('structureAssetLife'),.8,.2)*L('structureAssetLoss');
    if(id==='business')a=num('businessUnit')*num('businessArea')*residual2(num('businessAge'),num('businessLife'),.9,.1)*L('businessLoss');
    if(id==='household')a=num('householdBuy')*Math.max(1,num('householdQty'))*residual2(num('householdAge'),num('householdLife'),.8,.2)*L('householdLoss');
    if(id==='fixtures')a=num('fixturesBuy')*Math.max(1,num('fixturesQty'))*residual2(num('fixturesAge'),num('fixturesLife'),.9,.1)*L('fixturesLoss');
    if(id==='machine')a=num('machineValue')*residual2(num('machineAge'),num('machineLife'),.9,.1)*L('machineLoss');
    if(id==='tools')a=num('toolsValue')*residual2(num('toolsAge'),num('toolsLife'),.9,.1)*L('toolsLoss');
    if(id==='inventory')a=num('inventoryValue')*L('inventoryLoss');
    if(id==='vehicle')a=num('vehicleValue');if(id==='other')a=num('otherValue')*L('otherLoss');return Math.max(0,a||0);
  }
  function damageTotalsK(){
    let selected;try{selected=selectedDamage()}catch(e){selected=new Set()}
    let realBase=0,moveBase=0,rows=[];try{DAMAGE_META.forEach(m=>{if(!selected.has(m.id))return;const amt=calcK(m.id);if(m.kind==='real')realBase+=amt;else moveBase+=amt;rows.push({m,amt,name:damageItemName(m)})})}catch(e){}
    const rate=$('applyDebris')?.checked?.1:0,real=realBase*(1+rate),move=moveBase*(1+rate);return {realBase,moveBase,debris:(realBase+moveBase)*rate,real,move,total:real+move,rows};
  }
  try{fmtK=fmtThousand}catch(e){}try{calcDamageItem=calcK}catch(e){}try{damageTotals=damageTotalsK}catch(e){}
  try{
    updateDamageCalc=function(){
      if(!$('damageCards'))return;const t=damageTotalsK();t.rows.forEach(r=>{const e=$('result_'+r.m.id);if(e)e.textContent=fmtThousand(r.amt)});set('real',Math.round(t.real));set('move',Math.round(t.move));
      if($('realView'))$('realView').textContent=fmtThousand(t.real);if($('moveView'))$('moveView').textContent=fmtThousand(t.move);if($('damageTotal'))$('damageTotal').textContent=fmtThousand(t.total);if($('debrisView'))$('debrisView').textContent=`잔존물 제거비 ${fmtThousand(t.debris)} ${$('applyDebris')?.checked?'포함':'미적용'}`;
      const realRows=t.rows.filter(r=>r.m.kind==='real'&&r.amt>0),moveRows=t.rows.filter(r=>r.m.kind==='move'&&r.amt>0);set('realDetail',realRows.map(r=>r.name).join(', '));set('moveDetail',moveRows.map(r=>r.name).join(', '));
      const calc=[];if(realRows.length)calc.push('부동산 계산: '+realRows.map(r=>`${r.name} ${fmtThousand(r.amt)}`).join(', '));if(moveRows.length)calc.push('동산 계산: '+moveRows.map(r=>`${r.name} ${fmtThousand(r.amt)}`).join(', '));if($('applyDebris')?.checked&&t.debris>0)calc.push('잔존물 제거비: '+fmtThousand(t.debris));if($('damageAutoDetail'))$('damageAutoDetail').textContent=calc.length?calc.join('\n'):'피해항목을 선택하면 계산내역이 표시됩니다.';
      if(t.total>0&&val('propertyDamage')!=='피해 있음'){set('propertyDamage','피해 있음');$('propertyBox')?.classList.remove('damageHidden');document.querySelectorAll('#propertyMode .choice').forEach((b,i)=>b.classList.toggle('on',i===1))}
    };
  }catch(e){}
  function relabelMoney(){MONEY_IDS.forEach(id=>{const e=$(id);if(!e)return;const label=e.closest('label');if(!label)return;for(const node of label.childNodes){if(node.nodeType===3&&node.nodeValue.trim()){node.nodeValue=UNIT_LABELS[id];break}}})}
  function migrateOldWonInputs(){if(localStorage.getItem('wanjuDamageUnitK_v313'))return;MONEY_IDS.forEach(id=>{const e=$(id);if(!e||!e.value)return;const x=Number(e.value);if(Number.isFinite(x)&&x!==0)e.value=String(Math.round((x/1000)*1000)/1000)});localStorage.setItem('wanjuDamageUnitK_v313','1');try{saveLocal(false)}catch(e){}}
  window.removeDamageItem=function(id){const card=$('card_'+id);if(card){card.querySelectorAll('input,textarea').forEach(e=>{if(e.type==='checkbox')e.checked=false;else e.value=''});card.querySelectorAll('select').forEach(e=>e.value=e.querySelector('option[value="100"]')?'100':(e.options[0]?.value||''))}try{const s=selectedDamage();s.delete(id);set('damageSelected',[...s].join(','));syncDamageCards();updateDamageCalc()}catch(e){}};
  function addDamageDeleteButtons(){
    let metas=[];try{metas=DAMAGE_META}catch(e){}metas.forEach(m=>{const title=$('card_'+m.id)?.querySelector('.calcTitle');if(!title||title.querySelector('.damageDeleteBtn'))return;const b=document.createElement('button');b.type='button';b.className='damageDeleteBtn';b.textContent='삭제';b.onclick=e=>{e.preventDefault();e.stopPropagation();window.removeDamageItem(m.id)};title.appendChild(b)});
    if(!$('polishStyle')){const s=document.createElement('style');s.id='polishStyle';s.textContent='.damageDeleteBtn{margin-left:auto;border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:8px;padding:6px 10px;font-weight:900}.calcTitle{display:flex;align-items:center;gap:8px}.damageUnitHint{font-size:12px;color:#667085;margin:6px 0}';document.head.appendChild(s)}
    const cats=$('damageCats');if(cats&&!$('damageUnitHint')){const h=document.createElement('div');h.id='damageUnitHint';h.className='damageUnitHint';h.textContent='※ 재산피해 금액·단가는 모두 천원 단위로 입력합니다. 예: 250 = 250천원';cats.insertAdjacentElement('beforebegin',h)}
  }

  function patchChoiceContainer(id,target,cb){const box=$(id);if(!box)return;box.querySelectorAll('button').forEach(b=>{b.onclick=()=>{const same=b.classList.contains('on')||val(target)===b.textContent;if(same){set(target,'');box.querySelectorAll('button').forEach(x=>x.classList.remove('on'))}else{set(target,b.textContent);box.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}if(cb)cb()}})}
  try{riButtons=function(){set('ri','');const box=$('riC');if(!box)return;box.innerHTML='';const items=(RI[val('town')]||[]);items.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='choice';b.textContent=x;b.onclick=()=>{const same=b.classList.contains('on')||val('ri')===x;if(same){set('ri','');box.querySelectorAll('button').forEach(z=>z.classList.remove('on'))}else{set('ri',x);box.querySelectorAll('button').forEach(z=>z.classList.toggle('on',z===b))}};box.appendChild(b)});$('riBox')?.classList.toggle('show',!!val('town'))}}catch(e){}
  function patchDamageModeToggle(){const humanBtns=$('humanMode')?.querySelectorAll('button');if(humanBtns?.length>=2){humanBtns[0].onclick=()=>setHuman(false);humanBtns[1].onclick=()=>val('human')==='있음'?setHuman(false):setHuman(true)}const propBtns=$('propertyMode')?.querySelectorAll('button');if(propBtns?.length>=2){propBtns[0].onclick=()=>setPropertyDamage(false);propBtns[1].onclick=()=>val('propertyDamage')==='피해 있음'?setPropertyDamage(false):setPropertyDamage(true)}}

  function syncCauseInvestigatingBtn(){const b=$('nfdsInvestigatingBtn');if(!b)return;const factorSelected=!!document.querySelector('#nfds_factorMain .nfdsBtn.on');b.classList.toggle('on',val('cause').trim()==='조사 중'&&!factorSelected)}
  function addCauseInvestigatingBtn(){
    const root=$('nfdsCause'),title=root?.querySelector('.nfdsTitle');if(!root||!title||$('nfdsInvestigatingBtn'))return;
    const b=document.createElement('button');b.type='button';b.id='nfdsInvestigatingBtn';b.className='nfdsBtn';b.textContent='조사 중';b.style.cssText='margin-left:8px;min-height:34px;padding:5px 10px;vertical-align:middle';title.appendChild(b);
    b.onclick=e=>{e.preventDefault();e.stopPropagation();const wasOn=b.classList.contains('on');if(wasOn){set('cause','');b.classList.remove('on')}else{document.querySelectorAll('#nfds_heatMain .nfdsBtn.on,#nfds_factorMain .nfdsBtn.on,#nfds_firstMain .nfdsBtn.on,.nfdsDecision .nfdsBtn.on').forEach(x=>x.click());set('cause','조사 중');const out=$('nfdsReportCause');if(out)out.textContent='보고서 원인: 조사 중'}$('cause')?.dispatchEvent(new Event('input',{bubbles:true}));$('cause')?.dispatchEvent(new Event('change',{bubbles:true}));syncCauseInvestigatingBtn()};
    root.addEventListener('click',()=>setTimeout(syncCauseInvestigatingBtn,0));$('cause')?.addEventListener('input',syncCauseInvestigatingBtn);syncCauseInvestigatingBtn();
  }

  function removeOverviewOptions(){
    const remove=new Set(['콘센트·플러그 소손','사진·영상','콘센트 소손','플러그 소손','전원선 소손']);
    document.querySelectorAll('#overviewBuilderV312 .ov12Chip').forEach(b=>{const text=(b.textContent||'').trim();if(!remove.has(text))return;if(b.classList.contains('on')){try{b.click()}catch(e){}}b.remove()});
  }

  function installFoldSections(){
    if(!$('wanjuFoldStyle')){const s=document.createElement('style');s.id='wanjuFoldStyle';s.textContent='.wanjuFoldCard>h2.wanjuFoldTitle{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;user-select:none;padding:4px 0}.wanjuFoldArrow{font-size:16px;color:#667085}.wanjuFoldCard.wanjuClosed>:not(h2){display:none!important}.wanjuFoldCard.wanjuClosed>h2{margin-bottom:0}';document.head.appendChild(s)}
    document.querySelectorAll('main > .card').forEach(card=>{const h=Array.from(card.children).find(x=>x.tagName==='H2');if(!h||!/^[1-6]\./.test((h.textContent||'').trim())||h.classList.contains('wanjuFoldTitle'))return;card.classList.add('wanjuFoldCard');h.classList.add('wanjuFoldTitle');h.tabIndex=0;const arrow=document.createElement('span');arrow.className='wanjuFoldArrow';arrow.textContent='▼';h.appendChild(arrow);const toggle=()=>{card.classList.toggle('wanjuClosed');arrow.textContent=card.classList.contains('wanjuClosed')?'▶':'▼'};h.addEventListener('click',toggle);h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}})});
  }

  function sanitizeHwpxSectionXml(xml){let safe=String(xml||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');const doc=new DOMParser().parseFromString(safe,'application/xml');if(doc.getElementsByTagName('parsererror').length)return safe;const ns='http://www.hancom.co.kr/hwpml/2011/paragraph';let nodes=Array.from(doc.getElementsByTagNameNS(ns,'linesegarray'));if(!nodes.length)nodes=Array.from(doc.getElementsByTagName('hp:linesegarray'));nodes.forEach(n=>n.parentNode&&n.parentNode.removeChild(n));return new XMLSerializer().serializeToString(doc)}
  function patchHwpxSecurityWarning(){try{if(typeof exactPatchSection!=='function'||exactPatchSection.__wanjuLineSegFixed)return;const old=exactPatchSection;const wrapped=function(xml){return sanitizeHwpxSectionXml(old(xml))};wrapped.__wanjuLineSegFixed=true;exactPatchSection=wrapped}catch(e){console.warn('HWPX linesegarray 정리 적용 실패',e)}}

  function setVersion(){const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.16';document.title='완주소방서 화재상황보고 V3.16'}
  function install(){
    hideEndInput();addSortButton();removeSpecialActionQuickSection();
    patchChoiceContainer('writerC','writer');patchChoiceContainer('bossC','boss');patchChoiceContainer('structureC','structureType',()=>{try{composeStructure()}catch(e){}});patchChoiceContainer('roofC','roofType',()=>{try{composeStructure()}catch(e){}});patchChoiceContainer('riC','ri');patchDamageModeToggle();
    migrateOldWonInputs();relabelMoney();addDamageDeleteButtons();try{updateDamageCalc()}catch(e){}
    addCauseInvestigatingBtn();removeOverviewOptions();installFoldSections();patchHwpxSecurityWarning();
    $('status')?.addEventListener('change',syncDerivedEnd);syncDerivedEnd();setVersion();setTimeout(()=>{addCauseInvestigatingBtn();removeOverviewOptions();installFoldSections();setVersion()},850);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,240));else setTimeout(install,240);
})();