/* Wanju Fire Report V3.9 - AI 없이 선택식 사고개요 자동작성 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state={
    reporter:{name:'',gender:'',birthYear:'',source:'direct'},
    situation:'', anomaly:'', discovery:'', arrival:'',
    actions:[], marks:[],
    discoverPlace:'', investigatePlace:'',
    situationOther:'', anomalyOther:'', discoveryOther:'', arrivalOther:'', markOther:''
  };

  const SINGLE={
    situation:[
      ['home','자택 내 체류','자택 내에 있던 중'],['sleep','취침 중','방에서 취침 중'],['away','외출 후 귀가','외출 후 귀가하여'],['work','작업 중','작업 중'],['cook','조리 중','음식물을 조리하던 중'],['burn','쓰레기 소각 중','쓰레기를 소각하던 중'],['weld','용접·절단 중','용접·절단 작업 중'],['machine','기계 가동 중','기계를 가동하던 중'],['vehicle','차량 운행·정차 중','차량을 운행·정차 중'],['other','기타','']
    ],
    anomaly:[
      ['bang','“펑” 소리','“펑”하는 소리를 듣고'],['puck','“퍽” 소리','“퍽”하는 소리를 듣고'],['smell','타는 냄새','타는 냄새를 맡고'],['smoke','연기','연기가 발생하는 것을 보고'],['flame','화염','화염을 보고'],['spark','불꽃·스파크','불꽃 또는 스파크를 보고'],['blink','등 깜박임·정전','조명 깜박임 또는 정전 현상을 확인하고'],['breaker','차단기 작동','차단기가 작동한 것을 확인하고'],['alarm','경보기','경보기가 작동한 것을 듣고'],['told','주변인 알림','주변인의 화재 알림을 받고'],['other','기타','']
    ],
    discovery:[
      ['fire','화재 발생 목격','화재가 발생한 것을 목격하고'],['flame','화염 발견','화염을 발견하여'],['smoke','연기 발견','연기를 발견하여'],['spark','불꽃 발견','불꽃을 발견하여'],['soot','탄화·그을음 발견','탄화 및 그을음을 발견하여'],['spread','주변으로 연소 확대','주변 가연물로 연소 확대되는 것을 목격하고'],['other','기타','']
    ],
    arrival:[
      ['all','건물 전체 연소','현장 도착한바 건물 전체가 연소 중이었으며'],['part','건물 일부 연소','현장 도착한바 건물 일부가 연소 중이었으며'],['smoke','연기 분출','현장 도착한바 건물에서 다량의 연기가 분출되고 있었으며'],['flame','화염 분출','현장 도착한바 건물에서 화염이 분출되고 있었으며'],['spread','연소 확대 중','현장 도착한바 연소가 주변으로 확대 중이었으며'],['self','자체진화 상태','현장 도착한바 관계인에 의해 자체진화된 상태였으며'],['ember','잔화 상태','현장 도착한바 잔화가 남아 있는 상태였으며'],['post','사후조사','현장 도착한바 화재가 이미 진화된 상태로 사후조사를 실시하였으며'],['none','이상 없음','현장 도착한바 외관상 특이사항은 확인되지 않았으며'],['other','기타','']
    ]
  };
  const MULTI={
    actions:[
      ['119','119 신고','119에 신고'],['self','자체진화','자체진화'],['ext','소화기 사용','소화기를 사용하여 초기진화'],['water','물·호스 사용','물을 사용하여 초기진화'],['power','전원 차단','전원을 차단'],['gas','가스 차단','가스를 차단'],['evac','대피','안전한 장소로 대피'],['notify','주변에 알림','주변에 화재 사실을 전파']
    ],
    marks:[
      ['strong','강한 연소흔','강한 연소흔'],['char','심한 탄화','심한 탄화'],['v','V자형 연소패턴','V자형 연소패턴'],['up','상향 연소패턴','상향 연소패턴'],['short','단락흔','전기적 단락흔'],['melt','용융흔','용융흔'],['wire','전기배선 손상','전기배선의 소손 및 열변색'],['plug','콘센트·플러그 손상','콘센트 및 플러그의 소손'],['fuel','주변 가연물 확대흔','주변 가연물로의 연소확대 흔적'],['focus','집중 소실','특정 부위의 집중적인 소실'],['unknown','발화부 특정 곤란','발화부를 특정하기 곤란한 상태']
    ]
  };
  const CAUSES=[
    '조사 중','부주의(쓰레기 소각) 요인 추정','부주의(화목난로 취급) 요인 추정','부주의(화기취급) 요인 추정','부주의(용접·절단) 요인 추정','전기적(절연열화에 의한 단락) 요인 추정','전기적(접촉불량) 요인 추정','전기적 요인 추정','기계적 요인 추정','미상'
  ];

  function selectedDef(group,key){return (SINGLE[group]||[]).find(x=>x[0]===key)}
  function hasFinal(s){const t=String(s||'').trim();if(!t)return false;const c=t.charCodeAt(t.length-1);if(c>=0xAC00&&c<=0xD7A3)return ((c-0xAC00)%28)!==0;if(/[0-9]$/.test(t))return true;return false}
  function josa(s,a,b){return s+(hasFinal(s)?a:b)}
  function selectedPhrase(group){const d=selectedDef(group,state[group]);if(!d)return '';if(d[0]!=='other')return d[2];const val=state[group+'Other'].trim();return val}
  function relationPerson(role){
    const btn=$('relBtn_'+role),name=$('relName_'+role),birth=$('relBirth_'+role);
    if(!btn?.classList.contains('on')||!name?.value.trim())return null;
    let gender='';['남','여'].forEach(g=>{if($(`relGender_${role}_${g}`)?.classList.contains('on'))gender=g});
    return {name:name.value.trim(),gender,birthYear:birth?.value||''};
  }
  function setReporter(p,source){state.reporter={name:p?.name||'',gender:p?.gender||'',birthYear:p?.birthYear||'',source:source||'direct'};syncReporterUI();renderPreview()}
  function reporterText(){
    const r=state.reporter;if(!r.name.trim())return '';
    const info=[r.gender,r.birthYear?`${r.birthYear}년생`:''].filter(Boolean).join(', ');
    const who=`신고자 ${r.name.trim()}${info?`(${info})`:''}`;
    return josa(who,'은','는');
  }
  function joinActions(){
    const arr=MULTI.actions.filter(x=>state.actions.includes(x[0])).map(x=>x[2]);
    if(!arr.length)return '';
    if(arr.length===1)return `${arr[0]}한 건으로,`;
    return arr.map((x,i)=>i===arr.length-1?`${x}한 건으로,`:`${x}하고`).join(' ');
  }
  function markSentence(){
    let arr=MULTI.marks.filter(x=>state.marks.includes(x[0])).map(x=>x[2]);
    if(state.markOther.trim())arr.push(state.markOther.trim());
    if(!arr.length&&!state.investigatePlace.trim())return '';
    const place=state.investigatePlace.trim()||'화재 현장';
    if(!arr.length)return `현장 조사한바 ${place}를 중심으로 연소상태를 확인하였으며`;
    const marks=arr.join(', ');
    return arr.length>1?`현장 조사한바 ${place}에서 ${marks} 등이 관찰되며`:`현장 조사한바 ${place}에서 ${josa(marks,'이','가')} 관찰되며`;
  }
  function causeSentence(){
    let c=$('cause')?.value.trim()||'';
    if(!c||c==='조사 중')return '화재원인은 현재 조사 중임.';
    if(c==='미상')return '화재원인은 미상임.';
    if(/추정됨|판단됨|확인됨/.test(c))return c.endsWith('.')?c:c+'.';
    let base=c.replace(/\s*요인\s*추정\s*$/,'').replace(/\s*추정\s*$/,'').trim();
    if(base)return `${base} 요인에 의해 화재가 발생한 것으로 추정됨.`;
    return '';
  }
  function buildText(){
    const parts=[];
    const r=reporterText();if(r)parts.push(r);
    const sit=selectedPhrase('situation');if(sit)parts.push(sit);
    const an=selectedPhrase('anomaly');if(an)parts.push(an);
    const dp=state.discoverPlace.trim();if(dp)parts.push(`${josa(dp,'을','를')} 확인한바`);
    const dis=selectedPhrase('discovery');if(dis)parts.push(dis);
    const act=joinActions();if(act)parts.push(act);
    const arr=selectedPhrase('arrival');if(arr)parts.push(arr);
    const mark=markSentence();if(mark)parts.push(mark);
    parts.push(causeSentence());
    let text=parts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
    text=text.replace(/,\s*\./g,'.').replace(/\s+\./g,'.');
    return text;
  }
  function renderPreview(){const e=$('overviewPreview');if(e)e.textContent=buildText()||'선택한 내용으로 사고개요 문장이 여기에 표시됩니다.';updateButtons()}
  function applySummary(){const s=$('summary');if(!s)return;const t=buildText();if(!t)return;s.value=t;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));$('overviewApplyStatus').textContent='✓ 사고개요에 적용됨'}
  function clearBuilder(){
    Object.assign(state,{reporter:{name:'',gender:'',birthYear:'',source:'direct'},situation:'',anomaly:'',discovery:'',arrival:'',actions:[],marks:[],discoverPlace:'',investigatePlace:'',situationOther:'',anomalyOther:'',discoveryOther:'',arrivalOther:'',markOther:''});
    syncInputs();renderPreview();$('overviewApplyStatus').textContent='';
  }

  function makeSingle(group,title,otherLabel){
    return `<div class="ovBlock"><div class="ovLabel">${title}</div><div class="ovChoices">${SINGLE[group].map(x=>`<button type="button" class="ovBtn" data-single="${group}" data-key="${x[0]}">${x[1]}</button>`).join('')}</div><input id="ov_${group}Other" class="ovOther" placeholder="${otherLabel||'기타 내용 직접입력'}"></div>`;
  }
  function makeMulti(group,title){
    return `<div class="ovBlock"><div class="ovLabel">${title}<span class="ovMini">복수 선택 가능</span></div><div class="ovChoices">${MULTI[group].map(x=>`<button type="button" class="ovBtn" data-multi="${group}" data-key="${x[0]}">${x[1]}</button>`).join('')}</div>${group==='marks'?'<input id="ov_markOther" class="ovOther" placeholder="기타 조사흔적 직접입력">':''}</div>`;
  }
  function years(){let out='<option value="">출생연도</option>';for(let y=new Date().getFullYear();y>=1900;y--)out+=`<option>${y}</option>`;return out}
  function style(){
    if($('ovStyle'))return;const s=document.createElement('style');s.id='ovStyle';s.textContent=`
      .ovWrap{margin:10px 0 14px;border:1px solid #d9dde5;border-radius:14px;padding:12px;background:#f8fafc}.ovTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:9px}.ovTitle{font-weight:950;font-size:16px}.ovSub{font-size:12px;color:#667085;line-height:1.45}.ovBlock{padding:10px 0;border-top:1px solid #e5e7eb}.ovBlock:first-of-type{border-top:0}.ovLabel{font-weight:900;font-size:14px;margin-bottom:7px}.ovMini{font-size:11px;color:#667085;font-weight:700;margin-left:7px}.ovChoices{display:flex;flex-wrap:wrap;gap:6px}.ovBtn{min-height:40px;padding:8px 10px;border:1px solid #cfd4dc;background:#fff;border-radius:10px;font-weight:850;font-size:13px;color:#344054}.ovBtn.on{background:#111827;color:#fff;border-color:#111827}.ovBtn.import.on{background:#eef2ff;color:#3730a3;border-color:#4f46e5}.ovOther{margin-top:7px}.ovReporterGrid{display:grid;grid-template-columns:1.3fr .8fr 1fr;gap:7px;margin-top:8px}.ovGender{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ovGender button{height:42px;border:1px solid #cfd4dc;background:#fff;border-radius:9px;font-weight:900}.ovGender button.on{background:#111827;color:#fff}.ovPreview{margin-top:10px;background:#fff;border:2px solid #d1d5db;border-radius:12px;padding:11px;font-size:14px;line-height:1.65;min-height:76px;white-space:pre-wrap}.ovActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.ovActions button{height:44px;border:0;border-radius:10px;font-weight:900}.ovApply{background:#b91c1c;color:#fff}.ovReset{background:#e5e7eb;color:#111827}.ovStatus{font-size:12px;color:#166534;font-weight:800;margin-top:6px}.ovCauseBtns{display:flex;flex-wrap:wrap;gap:6px;margin:7px 0}.ovCauseBtns button{min-height:38px;padding:7px 9px;border:1px solid #cfd4dc;background:#fff;border-radius:9px;font-weight:800;font-size:12px}.ovCauseBtns button.on{background:#eef2ff;color:#3730a3;border-color:#4f46e5}@media(max-width:620px){.ovReporterGrid{grid-template-columns:1fr 1fr}.ovReporterGrid .ovName{grid-column:1/-1}.ovActions{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }
  function html(){
    return `<div id="overviewBuilder" class="ovWrap"><div class="ovTop"><div><div class="ovTitle">사고개요 선택식 자동작성</div><div class="ovSub">AI 미사용 · 필요한 항목만 터치하고 특이사항만 짧게 직접입력</div></div></div>
      <div class="ovBlock"><div class="ovLabel">1. 신고자 인적사항</div><div class="ovChoices"><button type="button" class="ovBtn import" data-import="owner">소유자 불러오기</button><button type="button" class="ovBtn import" data-import="occupant">점유자 불러오기</button><button type="button" class="ovBtn import" data-import="related">관계인 불러오기</button><button type="button" class="ovBtn import" data-import="direct">직접입력</button></div><div class="ovReporterGrid"><label class="ovName">성명<input id="ovReporterName" placeholder="신고자 성명"></label><label>성별<div class="ovGender"><button type="button" id="ovRepM">남</button><button type="button" id="ovRepF">여</button></div></label><label>출생연도<select id="ovReporterBirth">${years()}</select></label></div><div id="ovReporterMsg" class="ovSub" style="margin-top:6px"></div></div>
      ${makeSingle('situation','2. 화재 전 상황','예: 축사 내부에서 사료 배합 작업 중')}
      ${makeSingle('anomaly','3. 최초 이상 발견','예: 보일러실 쪽에서 금속 부딪히는 소리를 듣고')}
      <div class="ovBlock"><div class="ovLabel">4. 발견 위치</div><input id="ovDiscoverPlace" placeholder="자주 쓰는 장소만 짧게 입력 · 예: 보일러실 벽면 콘센트 부근"></div>
      ${makeSingle('discovery','5. 최초 발견 내용','예: 배전반 내부에서 불꽃을 발견하여')}
      ${makeMulti('actions','6. 신고·초기조치')}
      ${makeSingle('arrival','7. 소방대 현장 도착 상황','예: 공장 내부 기계설비 주변에서 연소 중이었으며')}
      <div class="ovBlock"><div class="ovLabel">8. 현장조사 위치</div><input id="ovInvestigatePlace" placeholder="예: 화목난로 장작 투입구 부근 / 보일러 플러그측 전원선"></div>
      ${makeMulti('marks','9. 현장조사 흔적')}
      <div class="ovBlock"><div class="ovLabel">10. 원인 빠른선택</div><div class="ovCauseBtns">${CAUSES.map(c=>`<button type="button" data-cause="${esc(c)}">${c}</button>`).join('')}</div><div class="ovSub">선택하면 아래 기존 원인란에 자동 반영됩니다. 직접 수정도 가능합니다.</div></div>
      <div class="ovBlock"><div class="ovLabel">자동작성 미리보기</div><div id="overviewPreview" class="ovPreview">선택한 내용으로 사고개요 문장이 여기에 표시됩니다.</div><div class="ovActions"><button type="button" id="overviewApply" class="ovApply">사고개요에 적용</button><button type="button" id="overviewReset" class="ovReset">선택 초기화</button></div><div id="overviewApplyStatus" class="ovStatus"></div></div>
    </div>`;
  }

  function updateButtons(){
    document.querySelectorAll('#overviewBuilder [data-single]').forEach(b=>b.classList.toggle('on',state[b.dataset.single]===b.dataset.key));
    document.querySelectorAll('#overviewBuilder [data-multi]').forEach(b=>b.classList.toggle('on',state[b.dataset.multi].includes(b.dataset.key)));
    document.querySelectorAll('#overviewBuilder [data-import]').forEach(b=>b.classList.toggle('on',state.reporter.source===b.dataset.import));
    $('ovRepM')?.classList.toggle('on',state.reporter.gender==='남');$('ovRepF')?.classList.toggle('on',state.reporter.gender==='여');
    document.querySelectorAll('#overviewBuilder [data-cause]').forEach(b=>b.classList.toggle('on',($('cause')?.value||'')===b.dataset.cause));
    ['situation','anomaly','discovery','arrival'].forEach(g=>{const e=$('ov_'+g+'Other');if(e)e.style.display=state[g]==='other'?'block':'none'});
  }
  function syncReporterUI(){if($('ovReporterName'))$('ovReporterName').value=state.reporter.name;if($('ovReporterBirth'))$('ovReporterBirth').value=state.reporter.birthYear;updateButtons()}
  function syncInputs(){
    syncReporterUI();
    $('ovDiscoverPlace').value=state.discoverPlace;$('ovInvestigatePlace').value=state.investigatePlace;$('ov_markOther').value=state.markOther;
    ['situation','anomaly','discovery','arrival'].forEach(g=>{$('ov_'+g+'Other').value=state[g+'Other']});
  }
  function bind(){
    document.querySelectorAll('#overviewBuilder [data-single]').forEach(b=>b.addEventListener('click',()=>{const g=b.dataset.single,k=b.dataset.key;state[g]=state[g]===k?'':k;renderPreview()}));
    document.querySelectorAll('#overviewBuilder [data-multi]').forEach(b=>b.addEventListener('click',()=>{const g=b.dataset.multi,k=b.dataset.key,a=state[g],i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);renderPreview()}));
    document.querySelectorAll('#overviewBuilder [data-import]').forEach(b=>b.addEventListener('click',()=>{
      const src=b.dataset.import;if(src==='direct'){setReporter({name:'',gender:'',birthYear:''},'direct');$('ovReporterMsg').textContent='신고자 정보를 직접 입력하세요.';return}
      const p=relationPerson(src);if(!p){$('ovReporterMsg').textContent='앞의 관계인 등에서 해당 인적사항을 먼저 입력해 주세요.';return}setReporter(p,src);$('ovReporterMsg').textContent='관계인 등에서 신고자 정보를 불러왔습니다.';
    }));
    $('ovReporterName').addEventListener('input',e=>{state.reporter.name=e.target.value;state.reporter.source='direct';renderPreview()});
    $('ovReporterBirth').addEventListener('change',e=>{state.reporter.birthYear=e.target.value;state.reporter.source='direct';renderPreview()});
    $('ovRepM').onclick=()=>{state.reporter.gender=state.reporter.gender==='남'?'':'남';state.reporter.source='direct';syncReporterUI();renderPreview()};
    $('ovRepF').onclick=()=>{state.reporter.gender=state.reporter.gender==='여'?'':'여';state.reporter.source='direct';syncReporterUI();renderPreview()};
    $('ovDiscoverPlace').addEventListener('input',e=>{state.discoverPlace=e.target.value;renderPreview()});
    $('ovInvestigatePlace').addEventListener('input',e=>{state.investigatePlace=e.target.value;renderPreview()});
    $('ov_markOther').addEventListener('input',e=>{state.markOther=e.target.value;renderPreview()});
    ['situation','anomaly','discovery','arrival'].forEach(g=>$('ov_'+g+'Other').addEventListener('input',e=>{state[g+'Other']=e.target.value;renderPreview()}));
    document.querySelectorAll('#overviewBuilder [data-cause]').forEach(b=>b.addEventListener('click',()=>{if($('cause')){$('cause').value=b.dataset.cause;$('cause').dispatchEvent(new Event('input',{bubbles:true}));$('cause').dispatchEvent(new Event('change',{bubbles:true}))}renderPreview()}));
    $('cause')?.addEventListener('input',renderPreview);
    $('overviewApply').onclick=applySummary;$('overviewReset').onclick=clearBuilder;
  }

  function install(){
    style();const summary=$('summary');if(!summary||$('overviewBuilder'))return;
    const label=summary.closest('label');if(!label)return;
    label.insertAdjacentHTML('beforebegin',html());
    const card=summary.closest('.card');const hint=card?.querySelector('.hint');if(hint)hint.textContent='AI 없이 선택한 내용을 자동으로 조합합니다. 특이한 내용만 직접 수정하세요.';
    summary.placeholder='위 선택식 자동작성 결과를 적용한 뒤 필요한 부분만 직접 수정';
    summary.style.minHeight='150px';
    bind();syncInputs();renderPreview();
    const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.9';document.title='완주소방서 화재상황보고 V3.9';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,140));else setTimeout(install,140);
})();
