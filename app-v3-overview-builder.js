/* Wanju Fire Report V3.11 - 2025 보고서 문맥 기반 선택식 사고개요 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const MODES=[
    ['normal','일반화재'],['self','자체진화'],['post','사후조사']
  ];
  const PLACES=[
    '자택 내','방','거실','주방','보일러실','창고','공장 내부','작업장','사무실','축사','차량 내부','건물 외부','마당','옥상','지붕','천장','벽면','보일러실 벽면','노출콘센트 부근','벽면 콘센트 부근','전원 플러그 부근','전원선 부근','배전반 부근','화목난로 부근','화목난로 장작 투입구 부근','아궁이 부근','기계·설비 부근','차량 엔진룸','적재함','기타'
  ];
  const SPREADS=[
    '주변 가연물','인접 가연물','거실','방','주방','천장','지붕','벽체','외벽','상층','인접실','건물 전체','창고 전체','공장 전체','인접 건물','건물 외부','볏짚','목재','합성수지','적재물','기타'
  ];
  const ACTIVITIES=[
    ['stay','체류 중'],['sleep','취침 중'],['tv','TV 시청 중'],['meal','식사 중'],['cook','음식물 조리 중'],['work','작업 중'],['weld','용접·절단 작업 중'],['grind','그라인더 작업 중'],['burn','쓰레기 소각 중'],['furnace','아궁이 사용 중'],['woodstove','화목난로 사용 중'],['electric','전기기기 사용 중'],['machine','기계 가동 중'],['return','외출 후 귀가'],['drive','차량 운행 중'],['park','차량 정차 중'],['clean','청소 중'],['other','기타']
  ];
  const SIGNALS=[
    ['flame','화염'],['smoke','연기'],['smell','타는 냄새'],['bang','“펑” 소리'],['puck','“퍽” 소리'],['explosion','폭발음'],['spark','불꽃·스파크'],['blink','등 깜박임'],['blackout','정전'],['breaker','차단기 작동'],['alarm','경보기 작동'],['heat','열기'],['soot','그을음'],['spread','연소 확대'],['other','기타']
  ];
  const PERCEPTIONS=[
    ['see','목격하고'],['find','발견하고'],['smell','냄새를 맡고'],['hear','소리를 듣고'],['abnormal','이상징후를 발견하고'],['told','주변인에게 전해 듣고'],['check','확인하고']
  ];
  const ACTIONS=[
    ['119','119에 신고'],['self','자체진화'],['ext','소화기를 사용하여 초기진화'],['water','물·호스를 사용하여 초기진화'],['power','전원을 차단'],['gas','가스를 차단'],['evac','안전한 장소로 대피'],['notify','주변에 화재 사실을 알림'],['later','사후 신고'],['other','기타 조치']
  ];
  const ARRIVAL_STATES=[
    ['burning','연소 중인 상태였음'],['spreading','주변으로 연소 확대 중인 상태였음'],['partial','일부가 연소된 상태였음'],['all','전체가 연소된 상태였음'],['flame','화염이 분출 중인 상태였음'],['smoke','다량의 연기가 분출 중인 상태였음'],['self','관계인에 의해 자체진화된 상태였음'],['ember','잔화가 남아 있는 상태였음'],['out','이미 진화된 상태였음'],['other','기타']
  ];
  const EVIDENCE=[
    ['related','관계인 진술'],['reporter','신고자 진술'],['first','최초 목격 위치'],['pattern','연소패턴'],['char','탄화 정도'],['strong','강한 연소흔'],['focus','집중 소실'],['v','V자형 연소패턴'],['up','상향 연소패턴'],['short','단락흔'],['melt','용융흔'],['wire','전기배선 소손'],['plug','콘센트·플러그 소손'],['cctv','CCTV'],['photo','사진·영상'],['exam','감식결과'],['other','기타']
  ];
  const USE_STATE=[
    ['outlet','노출콘센트 사용'],['multi','멀티콘센트 연결 사용'],['plug','전원 플러그 연결 사용'],['wire','전원선 사용 중'],['electric','전기기기 사용 중'],['machine','기계·설비 가동 중'],['woodstove','화목난로 사용'],['furnace','아궁이 사용'],['burn','쓰레기·폐지 소각'],['near','주변 가연물 근접'],['weld','용접·절단 작업'],['other','기타']
  ];
  const OBSERVATIONS=[
    ['strong','강한 연소흔'],['char','심한 탄화'],['focus','집중적인 소실'],['v','V자형 연소패턴'],['up','상향 연소패턴'],['short','전기적 단락흔'],['melt','용융흔'],['heat','열변색'],['wire','전기배선 소손'],['outlet','콘센트 소손'],['plug','플러그 소손'],['powerline','전원선 소손'],['spread','주변 가연물로의 연소확대 흔적'],['ash','소각 잔재'],['woodstove','화목난로 주변 탄화'],['furnace','아궁이 주변 탄화'],['soot','그을음'],['other','기타']
  ];

  const state={
    mode:'normal',reporter:{name:'',gender:'',birthYear:'',source:'direct'},
    where:'',whereOther:'',activity:'',activityOther:'',signalPlace:'',signalPlaceOther:'',signals:[],signalOther:'',perception:'abnormal',actions:['119'],actionOther:'',
    arrivalOrigin:'',arrivalOriginOther:'',arrivalSpread:'',arrivalSpreadOther:'',arrivalState:'burning',arrivalStateOther:'',
    evidence:['related','pattern','char'],evidenceOther:'',investOrigin:'',investOriginOther:'',investSpread:'',investSpreadOther:'',
    useState:[],useOther:'',observations:[],observationOther:''
  };

  function hasFinal(s){const t=String(s||'').trim();if(!t)return false;const c=t.charCodeAt(t.length-1);if(c>=0xAC00&&c<=0xD7A3)return ((c-0xAC00)%28)!==0;if(/[0-9]$/.test(t))return true;return false}
  function josa(s,a,b){return String(s||'')+(hasFinal(s)?a:b)}
  function optionHtml(list,selected,placeholder){return `<option value="">${placeholder||'선택'}</option>`+list.map(x=>{const v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return `<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(l)}</option>`}).join('')}
  function arrLabel(list,key){const x=list.find(v=>(Array.isArray(v)?v[0]:v)===key);return x?(Array.isArray(x)?x[1]:x):''}
  function selectedValue(selectId,otherId){const v=$(selectId)?.value||'';if(v==='기타'||v==='other')return ($(otherId)?.value||'').trim();return arrLabel(PLACES,v)||arrLabel(SPREADS,v)||v}
  function joinKorean(arr){arr=arr.filter(Boolean);if(!arr.length)return '';if(arr.length===1)return arr[0];if(arr.length===2)return arr[0]+'와 '+arr[1];return arr.slice(0,-1).join(', ')+' 및 '+arr[arr.length-1]}
  function relationPerson(role){
    const b=$('relBtn_'+role),n=$('relName_'+role),y=$('relBirth_'+role);if(!b?.classList.contains('on')||!n?.value.trim())return null;
    let g='';['남','여'].forEach(x=>{if($(`relGender_${role}_${x}`)?.classList.contains('on'))g=x});return {name:n.value.trim(),gender:g,birthYear:y?.value||''};
  }
  function setReporter(p,source){state.reporter={name:p?.name||'',gender:p?.gender||'',birthYear:p?.birthYear||'',source:source||'direct'};syncReporter();render()}
  function reporterText(){const r=state.reporter;if(!r.name.trim())return '신고자';const info=[r.gender,r.birthYear?`${r.birthYear}년생`:''].filter(Boolean).join(', ');return `신고자 ${r.name.trim()}${info?`(${info})`:''}`}
  function whereActivity(){
    const w=valueOf('where','ov11_whereOther'),a=state.activity,ao=state.activityOther.trim();
    if(!w&&!a&&!ao)return '';
    if(a==='stay')return w?`${w}에 있던 중`:'있던 중';
    if(a==='return')return w?`${w}에 외출 후 귀가하여`:'외출 후 귀가하여';
    const label=a==='other'?ao:arrLabel(ACTIVITIES,a);return [w?`${w}에서`:'',label].filter(Boolean).join(' ');
  }
  function valueOf(key,otherId){const v=state[key];if(v==='기타')return ($(otherId)?.value||'').trim();return v}
  function signalsText(){let a=SIGNALS.filter(x=>state.signals.includes(x[0])).map(x=>x[1]);if(state.signalOther.trim())a.push(state.signalOther.trim());return joinKorean(a)}
  function perceptionPhrase(){return arrLabel(PERCEPTIONS,state.perception)||'이상징후를 발견하고'}
  function actionsPhrase(){
    let a=ACTIONS.filter(x=>state.actions.includes(x[0])).map(x=>x[1]);if(state.actionOther.trim())a.push(state.actionOther.trim());
    if(!a.length)return '';
    if(a.length===1)return a[0];
    return a.map((x,i)=>i===a.length-1?x:(x.endsWith('신고')?x+'하고':x+'하고')).join(' ');
  }
  function arrivalSentence(){
    const origin=valueOf('arrivalOrigin','ov11_arrivalOriginOther'),to=valueOf('arrivalSpread','ov11_arrivalSpreadOther');
    let st=state.arrivalState==='other'?state.arrivalStateOther.trim():arrLabel(ARRIVAL_STATES,state.arrivalState);
    if(state.mode==='post'){
      if(origin&&to)return `현장 도착하여 확인한 바 화재는 ${origin}에서 발생하여 ${to}${josa(to,'으로','로').slice(to.length)} 연소 확대된 후 이미 진화된 상태였음.`;
      return '현장 도착하여 확인한 바 화재는 이미 진화된 상태였음.';
    }
    if(origin&&to)return `선착대 현장 도착하여 관찰한 바 화재는 ${origin}에서 발생하여 ${josa(to,'으로','로')} 연소 확대 ${st||'중인 상태였음'}.`;
    if(origin)return `선착대 현장 도착하여 관찰한 바 ${origin} 부근이 ${st||'연소 중인 상태였음'}.`;
    return st?`선착대 현장 도착하여 관찰한 바 화재는 ${st}.`:'';
  }
  function evidenceText(){let a=EVIDENCE.filter(x=>state.evidence.includes(x[0])).map(x=>x[1]);if(state.evidenceOther.trim())a.push(state.evidenceOther.trim());return joinKorean(a)}
  function useText(){let a=USE_STATE.filter(x=>state.useState.includes(x[0])).map(x=>x[1]);if(state.useOther.trim())a.push(state.useOther.trim());return joinKorean(a)}
  function obsText(){let a=OBSERVATIONS.filter(x=>state.observations.includes(x[0])).map(x=>x[1]);if(state.observationOther.trim())a.push(state.observationOther.trim());return joinKorean(a)}
  function causeBase(){
    let c=$('cause')?.value.trim()||'조사 중';
    if(c==='조사 중'||c==='미상')return c;
    return c.replace(/\s*(요인\s*)?(추정|판단)\s*$/,'').trim()+(c.includes('요인')?'':' 요인');
  }
  function investigationSentence(){
    const ev=evidenceText(),origin=valueOf('investOrigin','ov11_investOriginOther'),to=valueOf('investSpread','ov11_investSpreadOther'),use=useText(),obs=obsText(),cause=causeBase();
    let first='화재조사한 바';
    if(ev)first+=` ${ev} 등을 종합하여 볼 때`;
    if(origin)first+=` ${origin}에서 발화된 것으로 추정되며`;
    if(to)first+=` ${josa(to,'으로','로')} 연소 확대된 것으로 추정됨.`;
    else if(origin)first+='.';
    else first+='.';
    const details=[use,obs].filter(Boolean);
    if(cause==='조사 중')return first+' 화재원인은 현재 조사 중임.';
    if(cause==='미상')return first+' 화재원인은 미상임.';
    if(details.length)return `${first} ${joinKorean(details)} 등이 관찰되는바 ${cause}에 의한 화재로 추정됨.`;
    return `${first} ${cause}에 의한 화재로 추정됨.`;
  }
  function buildText(){
    const who=reporterText(),wa=whereActivity(),sp=valueOf('signalPlace','ov11_signalPlaceOther'),sig=signalsText(),per=perceptionPhrase(),act=actionsPhrase();
    let first=josa(who,'은','는');
    if(wa)first+=' '+wa;
    if(sp&&sig)first+=` ${sp}에서 ${josa(sig,'을','를')} ${per}`;
    else if(sig)first+=` ${josa(sig,'을','를')} ${per}`;
    else if(sp)first+=` ${sp}에서 이상징후를 ${per}`;
    if(act)first+=' '+act;
    first+='한 건으로,';
    return [first,arrivalSentence(),investigationSentence()].filter(Boolean).join(' ').replace(/\s+/g,' ').replace(/\.\s*\./g,'.').trim();
  }

  function chipList(list,type){return list.map(x=>`<button type="button" class="ov11Chip" data-${type}="${x[0]}">${x[1]}</button>`).join('')}
  function selectOther(id,label,list,otherId,placeholder){return `<div class="ov11Field"><label>${label}<select id="${id}">${optionHtml(list,'',placeholder||'선택')}</select></label><input id="${otherId}" class="ov11Other" placeholder="직접입력" style="display:none"></div>`}
  function makeUI(){
    const summary=$('summary');if(!summary||$('overviewBuilderV311'))return;
    document.querySelectorAll('.ovWrap').forEach(x=>x.remove());
    injectStyle();
    const box=document.createElement('div');box.id='overviewBuilderV311';box.className='ov11Wrap';box.innerHTML=`
      <div class="ov11Head"><div><div class="ov11Title">사고개요 선택작성</div><div class="ov11Sub">고정 문맥은 앱이 만들고, 현장에서는 필요한 부분만 선택합니다. 2025년 보고서 표현을 반영했습니다.</div></div><span class="ov11Badge">V3.11</span></div>
      <input type="hidden" id="overviewBuilderJson">
      <div class="ov11Block"><div class="ov11Label">문장 유형</div><div class="ov11Chips" id="ov11Modes">${MODES.map(x=>`<button type="button" class="ov11Chip" data-mode="${x[0]}">${x[1]}</button>`).join('')}</div></div>
      <div class="ov11Block"><div class="ov11Label">① 신고자</div><div class="ov11Chips"><button type="button" class="ov11Chip import" data-import="owner">소유자 불러오기</button><button type="button" class="ov11Chip import" data-import="occupant">점유자 불러오기</button><button type="button" class="ov11Chip import" data-import="related">관계인 불러오기</button><button type="button" class="ov11Chip import" data-import="direct">직접입력</button></div><div class="ov11Reporter"><input id="ov11ReporterName" placeholder="신고자 성명"><div class="ov11Gender"><button type="button" data-gender="남">남</button><button type="button" data-gender="여">여</button></div><select id="ov11ReporterBirth"><option value="">출생연도</option>${Array.from({length:new Date().getFullYear()-1899},(_,i)=>new Date().getFullYear()-i).map(y=>`<option>${y}</option>`).join('')}</select></div></div>
      <div class="ov11Block"><div class="ov11Label">② 신고 전 상황</div><div class="ov11Grid">${selectOther('ov11Where','당시 위치',PLACES,'ov11_whereOther','어디에 있었나')}${selectOther('ov11SignalPlace','이상징후 발견 위치',PLACES,'ov11_signalPlaceOther','어디서 발견했나')}</div><div class="ov11Small">무엇을 하는 중</div><div class="ov11Chips">${chipList(ACTIVITIES,'activity')}</div><input id="ov11ActivityOther" class="ov11Other" placeholder="기타 행동 직접입력" style="display:none"><div class="ov11Small">무엇을 발견했나 <span>복수선택</span></div><div class="ov11Chips">${chipList(SIGNALS,'signal')}</div><input id="ov11SignalOther" class="ov11Other" placeholder="기타 이상징후 직접입력"><div class="ov11Small">어떻게 인지했나</div><div class="ov11Chips">${chipList(PERCEPTIONS,'perception')}</div><div class="ov11Small">신고·초기조치 <span>복수선택</span></div><div class="ov11Chips">${chipList(ACTIONS,'action')}</div><input id="ov11ActionOther" class="ov11Other" placeholder="기타 조치 직접입력"></div>
      <div class="ov11Block"><div class="ov11Label">③ 선착대 현장도착 당시</div><div class="ov11Grid">${selectOther('ov11ArrivalOrigin','화재가 발생·연소 중인 위치',PLACES,'ov11_arrivalOriginOther','어디서')}${selectOther('ov11ArrivalSpread','연소 확대 방향·대상',SPREADS,'ov11_arrivalSpreadOther','어디로')}</div><div class="ov11Small">현장 상태</div><div class="ov11Chips">${chipList(ARRIVAL_STATES,'arrival')}</div><input id="ov11ArrivalStateOther" class="ov11Other" placeholder="기타 현장상태 직접입력" style="display:none"></div>
      <div class="ov11Block"><div class="ov11Label">④ 화재조사 판단</div><div class="ov11Small">판단 근거 <span>복수선택</span></div><div class="ov11Chips">${chipList(EVIDENCE,'evidence')}</div><input id="ov11EvidenceOther" class="ov11Other" placeholder="기타 판단근거 직접입력"><div class="ov11Grid">${selectOther('ov11InvestOrigin','발화지점',PLACES,'ov11_investOriginOther','어디서 발화')}${selectOther('ov11InvestSpread','연소확대 경로·대상',SPREADS,'ov11_investSpreadOther','어디로 확대')}</div><div class="ov11Small">사용·연결 상태 <span>복수선택 · 2025 자료 반영</span></div><div class="ov11Chips">${chipList(USE_STATE,'use')}</div><input id="ov11UseOther" class="ov11Other" placeholder="예: 노출콘센트(2구)에 3구 멀티콘센트를 연결 후 보일러 전원 플러그 사용"><div class="ov11Small">관찰사항 <span>복수선택</span></div><div class="ov11Chips">${chipList(OBSERVATIONS,'observation')}</div><input id="ov11ObservationOther" class="ov11Other" placeholder="기타 관찰사항 직접입력"></div>
      <div class="ov11PreviewTitle">완성 문장 미리보기</div><div id="ov11Preview" class="ov11Preview"></div><div class="ov11Btns"><button type="button" id="ov11Reset" class="btn gray">선택 초기화</button><button type="button" id="ov11Apply" class="btn red">사고개요에 적용</button></div><div id="ov11Status" class="status"></div>`;
    const label=summary.closest('label');(label||summary).insertAdjacentElement('beforebegin',box);
    bind();restoreState();syncAll();render();
  }

  function injectStyle(){if($('ov11Style'))return;const s=document.createElement('style');s.id='ov11Style';s.textContent=`
    .ov11Wrap{margin:10px 0 14px;padding:12px;border:1px solid #d9dde5;border-radius:14px;background:#f8fafc}.ov11Head{display:flex;justify-content:space-between;gap:8px}.ov11Title{font-size:17px;font-weight:950}.ov11Sub{font-size:12px;color:#667085;line-height:1.5;margin-top:3px}.ov11Badge{font-size:11px;font-weight:900;color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:5px 8px;height:max-content}.ov11Block{padding:12px 0;border-top:1px solid #e5e7eb}.ov11Block:nth-of-type(2){border-top:0}.ov11Label{font-weight:950;margin-bottom:8px}.ov11Small{font-size:12px;font-weight:900;margin:10px 0 6px;color:#344054}.ov11Small span{font-weight:700;color:#667085}.ov11Chips{display:flex;flex-wrap:wrap;gap:6px}.ov11Chip{min-height:39px;padding:8px 10px;border:1px solid #cfd4dc;background:#fff;border-radius:9px;font-weight:850;font-size:13px;color:#344054}.ov11Chip.on{background:#111827;color:#fff;border-color:#111827}.ov11Chip.import.on{background:#eef2ff;color:#3730a3;border-color:#4f46e5}.ov11Grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ov11Field label{margin:0}.ov11Other{margin-top:7px}.ov11Reporter{display:grid;grid-template-columns:1.25fr .8fr 1fr;gap:7px;margin-top:8px}.ov11Gender{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ov11Gender button{height:43px;border:1px solid #cfd4dc;background:#fff;border-radius:9px;font-weight:900}.ov11Gender button.on{background:#111827;color:#fff}.ov11PreviewTitle{font-size:13px;font-weight:950;margin:10px 0 6px}.ov11Preview{background:#fff;border:2px solid #d1d5db;border-radius:12px;padding:12px;line-height:1.75;font-size:14px;min-height:90px;white-space:pre-wrap}.ov11Btns{display:grid;grid-template-columns:1fr 1.3fr;gap:8px}.ov11Btns .btn{width:100%;min-height:46px}@media(max-width:620px){.ov11Grid,.ov11Reporter{grid-template-columns:1fr}.ov11Chip{flex:1 1 calc(50% - 6px)}.ov11Chips .ov11Chip:nth-last-child(1):nth-child(odd){flex-basis:100%}}
  `;document.head.appendChild(s)}

  function bind(){
    const root=$('overviewBuilderV311');
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.mode){state.mode=b.dataset.mode;render();return}
      if(b.dataset.import){const r=b.dataset.import;if(r==='direct'){setReporter({name:'',gender:'',birthYear:''},'direct');return}setReporter(relationPerson(r),r);return}
      if(b.dataset.gender){state.reporter.gender=b.dataset.gender;syncReporter();render();return}
      const single=[['activity','activity'],['perception','perception'],['arrival','arrivalState']];
      for(const [d,k] of single)if(b.dataset[d]){state[k]=b.dataset[d];render();return}
      const multi=[['signal','signals'],['action','actions'],['evidence','evidence'],['use','useState'],['observation','observations']];
      for(const [d,k] of multi)if(b.dataset[d]){const v=b.dataset[d],a=state[k],i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);render();return}
    });
    const map=[
      ['ov11Where','where','ov11_whereOther'],['ov11SignalPlace','signalPlace','ov11_signalPlaceOther'],['ov11ArrivalOrigin','arrivalOrigin','ov11_arrivalOriginOther'],['ov11ArrivalSpread','arrivalSpread','ov11_arrivalSpreadOther'],['ov11InvestOrigin','investOrigin','ov11_investOriginOther'],['ov11InvestSpread','investSpread','ov11_investSpreadOther']
    ];
    map.forEach(([id,key,oid])=>$(id).addEventListener('change',e=>{state[key]=e.target.value;$(oid).style.display=e.target.value==='기타'?'block':'none';render()}));
    const inputs=[['ov11ReporterName','reporter.name'],['ov11ReporterBirth','reporter.birthYear'],['ov11ActivityOther','activityOther'],['ov11SignalOther','signalOther'],['ov11ActionOther','actionOther'],['ov11ArrivalStateOther','arrivalStateOther'],['ov11EvidenceOther','evidenceOther'],['ov11UseOther','useOther'],['ov11ObservationOther','observationOther'],['ov11_whereOther','whereOther'],['ov11_signalPlaceOther','signalPlaceOther'],['ov11_arrivalOriginOther','arrivalOriginOther'],['ov11_arrivalSpreadOther','arrivalSpreadOther'],['ov11_investOriginOther','investOriginOther'],['ov11_investSpreadOther','investSpreadOther']];
    inputs.forEach(([id,path])=>$(id)?.addEventListener(id==='ov11ReporterBirth'?'change':'input',e=>{setPath(path,e.target.value);render()}));
    $('ov11Apply').onclick=()=>{const s=$('summary');s.value=buildText();s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));$('ov11Status').textContent='✓ 사고개요에 적용됨'};
    $('ov11Reset').onclick=reset;
    $('cause')?.addEventListener('input',render);$('cause')?.addEventListener('change',render);
  }
  function setPath(path,val){if(path.startsWith('reporter.'))state.reporter[path.split('.')[1]]=val;else state[path]=val}
  function syncReporter(){$('ov11ReporterName').value=state.reporter.name||'';$('ov11ReporterBirth').value=state.reporter.birthYear||'';document.querySelectorAll('[data-gender]').forEach(b=>b.classList.toggle('on',b.dataset.gender===state.reporter.gender));document.querySelectorAll('[data-import]').forEach(b=>b.classList.toggle('on',b.dataset.import===state.reporter.source))}
  function syncAll(){
    const selects=[['ov11Where','where','ov11_whereOther','whereOther'],['ov11SignalPlace','signalPlace','ov11_signalPlaceOther','signalPlaceOther'],['ov11ArrivalOrigin','arrivalOrigin','ov11_arrivalOriginOther','arrivalOriginOther'],['ov11ArrivalSpread','arrivalSpread','ov11_arrivalSpreadOther','arrivalSpreadOther'],['ov11InvestOrigin','investOrigin','ov11_investOriginOther','investOriginOther'],['ov11InvestSpread','investSpread','ov11_investSpreadOther','investSpreadOther']];
    selects.forEach(([id,k,oid,ok])=>{if($(id))$(id).value=state[k]||'';if($(oid)){$(oid).value=state[ok]||'';$(oid).style.display=state[k]==='기타'?'block':'none'}});
    $('ov11ActivityOther').value=state.activityOther||'';$('ov11ActivityOther').style.display=state.activity==='other'?'block':'none';$('ov11SignalOther').value=state.signalOther||'';$('ov11ActionOther').value=state.actionOther||'';$('ov11ArrivalStateOther').value=state.arrivalStateOther||'';$('ov11ArrivalStateOther').style.display=state.arrivalState==='other'?'block':'none';$('ov11EvidenceOther').value=state.evidenceOther||'';$('ov11UseOther').value=state.useOther||'';$('ov11ObservationOther').value=state.observationOther||'';syncReporter()
  }
  function render(){
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===state.mode));
    document.querySelectorAll('[data-activity]').forEach(b=>b.classList.toggle('on',b.dataset.activity===state.activity));
    document.querySelectorAll('[data-perception]').forEach(b=>b.classList.toggle('on',b.dataset.perception===state.perception));
    document.querySelectorAll('[data-arrival]').forEach(b=>b.classList.toggle('on',b.dataset.arrival===state.arrivalState));
    [['signal','signals'],['action','actions'],['evidence','evidence'],['use','useState'],['observation','observations']].forEach(([d,k])=>document.querySelectorAll(`[data-${d}]`).forEach(b=>b.classList.toggle('on',state[k].includes(b.dataset[d]))));
    if($('ov11ActivityOther'))$('ov11ActivityOther').style.display=state.activity==='other'?'block':'none';if($('ov11ArrivalStateOther'))$('ov11ArrivalStateOther').style.display=state.arrivalState==='other'?'block':'none';
    syncReporter();const p=$('ov11Preview');if(p)p.textContent=buildText();const h=$('overviewBuilderJson');if(h)h.value=JSON.stringify(state)
  }
  function reset(){Object.assign(state,{mode:'normal',reporter:{name:'',gender:'',birthYear:'',source:'direct'},where:'',whereOther:'',activity:'',activityOther:'',signalPlace:'',signalPlaceOther:'',signals:[],signalOther:'',perception:'abnormal',actions:['119'],actionOther:'',arrivalOrigin:'',arrivalOriginOther:'',arrivalSpread:'',arrivalSpreadOther:'',arrivalState:'burning',arrivalStateOther:'',evidence:['related','pattern','char'],evidenceOther:'',investOrigin:'',investOriginOther:'',investSpread:'',investSpreadOther:'',useState:[],useOther:'',observations:[],observationOther:''});syncAll();render();$('ov11Status').textContent=''}
  function restoreState(){try{const d=JSON.parse(localStorage.getItem('wanjuFireReportV2')||'{}');if(d.overviewBuilderJson){Object.assign(state,JSON.parse(d.overviewBuilderJson));if(d.overviewBuilderJson&&typeof state.reporter!=='object')state.reporter={name:'',gender:'',birthYear:'',source:'direct'}}}catch(e){}}
  function patchCollect(){try{const old=collect;collect=function(){const d=old();d.overviewBuilder={...state,reporter:{...state.reporter}};d.overviewBuilderText=buildText();return d}}catch(e){}}
  function setVersion(){const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.11';document.title='완주소방서 화재상황보고 V3.11'}
  function install(){makeUI();patchCollect();setVersion();setTimeout(setVersion,700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,140));else setTimeout(install,140);
})();
