/* Wanju Fire Report V3.12 - 고정문맥 + 핵심 직접입력 + 선택식 사고개요 */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const MODES=[['normal','일반화재'],['self','자체진화'],['post','사후조사']];
  const SIGNALS=[
    ['flame','화염'],['smoke','연기'],['smell','타는 냄새'],['bang','“펑” 소리'],['puck','“퍽” 소리'],['explosion','폭발음'],['spark','불꽃·스파크'],['blink','등 깜박임'],['blackout','정전'],['breaker','차단기 작동'],['alarm','경보기 작동'],['heat','열기'],['soot','그을음'],['spread','연소 확대'],['other','기타']
  ];
  const PERCEPTIONS=[
    ['see','목격'],['find','발견'],['smell','냄새를 맡음'],['hear','소리를 들음'],['abnormal','이상징후 발견'],['told','주변인에게 들음'],['check','확인']
  ];
  const ACTIONS=[
    ['119','119 신고','119에 신고하고','119에 신고한 건으로,'],
    ['self','자체진화','자체진화하고','자체진화한 건으로,'],
    ['ext','소화기 사용','소화기를 사용하여 초기진화하고','소화기를 사용하여 초기진화한 건으로,'],
    ['water','물·호스 사용','물·호스를 사용하여 초기진화하고','물·호스를 사용하여 초기진화한 건으로,'],
    ['power','전원 차단','전원을 차단하고','전원을 차단한 건으로,'],
    ['gas','가스 차단','가스를 차단하고','가스를 차단한 건으로,'],
    ['evac','대피','안전한 장소로 대피하고','안전한 장소로 대피한 건으로,'],
    ['notify','주변에 알림','주변에 화재 사실을 알리고','주변에 화재 사실을 알린 건으로,'],
    ['later','사후 신고','사후 신고하고','사후 신고한 건으로,']
  ];
  const ARRIVAL_STATES=[
    ['burning','연소 중'],['spreading','연소 확대 중'],['partial','일부 연소'],['all','전체 연소'],['flame','화염 분출'],['smoke','다량 연기 분출'],['self','자체진화'],['ember','잔화 상태'],['out','이미 진화'],['other','기타']
  ];
  const EVIDENCE=[
    ['related','관계인 진술'],['reporter','신고자 진술'],['first','최초 목격 위치'],['pattern','연소패턴'],['char','탄화 정도'],['strong','강한 연소흔'],['focus','집중 소실'],['v','V자형 연소패턴'],['up','상향 연소패턴'],['short','단락흔'],['melt','용융흔'],['wire','전기배선 소손'],['plug','콘센트·플러그 소손'],['cctv','CCTV'],['photo','사진·영상'],['exam','감식결과'],['other','기타']
  ];
  const OBSERVATIONS=[
    ['strong','강한 연소흔'],['char','심한 탄화'],['focus','집중적인 소실'],['v','V자형 연소패턴'],['up','상향 연소패턴'],['short','전기적 단락흔'],['melt','용융흔'],['heat','열변색'],['wire','전기배선 소손'],['outlet','콘센트 소손'],['plug','플러그 소손'],['powerline','전원선 소손'],['spread','주변 가연물로의 연소확대 흔적'],['ash','소각 잔재'],['woodstove','화목난로 주변 탄화'],['furnace','아궁이 주변 탄화'],['soot','그을음'],['other','기타']
  ];
  const LEGACY_ACTIVITY={stay:'체류 중',sleep:'취침 중',tv:'TV 시청 중',meal:'식사 중',cook:'음식물 조리 중',work:'작업 중',weld:'용접·절단 작업 중',grind:'그라인더 작업 중',burn:'쓰레기 소각 중',furnace:'아궁이 사용 중',woodstove:'화목난로 사용 중',electric:'전기기기 사용 중',machine:'기계 가동 중',return:'외출 후 귀가',drive:'차량 운행 중',park:'차량 정차 중',clean:'청소 중'};
  const LEGACY_USE={outlet:'노출콘센트 사용',multi:'멀티콘센트 연결 사용',plug:'전원 플러그 연결 사용',wire:'전원선 사용 중',electric:'전기기기 사용 중',machine:'기계·설비 가동 중',woodstove:'화목난로 사용',furnace:'아궁이 사용',burn:'쓰레기·폐지 소각',near:'주변 가연물 근접',weld:'용접·절단 작업'};

  const state={
    schema:312,mode:'normal',reporter:{name:'',gender:'',birthYear:'',source:'direct'},
    whereText:'',activityText:'',signalPlaceText:'',signals:[],signalOther:'',perception:'abnormal',actions:['119'],actionOther:'',
    arrivalOriginText:'',arrivalSpreadText:'',arrivalState:'burning',arrivalStateOther:'',
    evidence:['related','pattern','char'],evidenceOther:'',investOriginText:'',investSpreadText:'',useConnectionText:'',
    observations:[],observationOther:''
  };

  function hasFinal(s){const t=String(s||'').trim();if(!t)return false;const c=t.charCodeAt(t.length-1);if(c>=0xAC00&&c<=0xD7A3)return ((c-0xAC00)%28)!==0;if(/[0-9]$/.test(t))return true;return false}
  function josa(s,a,b){return String(s||'')+(hasFinal(s)?a:b)}
  function label(list,key){const x=list.find(v=>v[0]===key);return x?x[1]:''}
  function joinKorean(arr){arr=arr.filter(Boolean);if(!arr.length)return '';if(arr.length===1)return arr[0];if(arr.length===2)return arr[0]+' 및 '+arr[1];return arr.slice(0,-1).join(', ')+' 및 '+arr[arr.length-1]}
  function cleanEnd(s){return String(s||'').trim().replace(/[,.。]+$/,'')}

  function relationPerson(role){
    const b=$('relBtn_'+role),n=$('relName_'+role),y=$('relBirth_'+role);if(!b?.classList.contains('on')||!n?.value.trim())return null;
    let g='';['남','여'].forEach(x=>{if($(`relGender_${role}_${x}`)?.classList.contains('on'))g=x});
    return {name:n.value.trim(),gender:g,birthYear:y?.value||''};
  }
  function setReporter(p,source){state.reporter={name:p?.name||'',gender:p?.gender||'',birthYear:p?.birthYear||'',source:source||'direct'};syncReporter();render()}
  function reporterText(){const r=state.reporter;if(!r.name.trim())return '신고자';const info=[r.gender,r.birthYear?`${r.birthYear}년생`:''].filter(Boolean).join(', ');return `신고자 ${r.name.trim()}${info?`(${info})`:''}`}

  function signalsText(){let a=SIGNALS.filter(x=>state.signals.includes(x[0])&&x[0]!=='other').map(x=>x[1]);if(state.signalOther.trim())a.push(state.signalOther.trim());return joinKorean(a)}
  function signalPerception(sig){
    if(!sig)return '';
    switch(state.perception){
      case 'see':return `${josa(sig,'을','를')} 목격하고`;
      case 'find':return `${josa(sig,'을','를')} 발견하고`;
      case 'smell':return `${josa(sig,'을','를')} 맡고`;
      case 'hear':return `${josa(sig,'을','를')} 듣고`;
      case 'told':return `${sig} 발생 사실을 주변인에게 전해 듣고`;
      case 'check':return `${josa(sig,'을','를')} 확인하고`;
      default:return `${sig} 등의 이상징후를 발견하고`;
    }
  }
  function actionsPhrase(){
    const chosen=ACTIONS.filter(x=>state.actions.includes(x[0]));
    const other=state.actionOther.trim();
    if(!chosen.length&&!other)return '';
    const parts=[];
    chosen.forEach((x,i)=>{const isLast=i===chosen.length-1&&!other;parts.push(isLast?x[3]:x[2])});
    if(other)parts.push(cleanEnd(other)+'한 건으로,');
    return parts.join(' ');
  }

  function firstSentence(){
    const who=reporterText(),where=state.whereText.trim(),act=state.activityText.trim(),sp=state.signalPlaceText.trim(),sig=signalsText(),ap=actionsPhrase();
    let t=josa(who,'은','는');
    if(where)t+=` ${where}에서`;
    if(act)t+=` ${act}`;
    if(sig){if(sp)t+=` ${sp}에서`;t+=` ${signalPerception(sig)}`}
    else if(sp)t+=` ${sp}에서 이상징후를 발견하고`;
    if(ap)t+=' '+ap;else t+=' 화재를 인지한 건으로,';
    return t.replace(/\s+/g,' ').trim();
  }

  function arrivalStateText(){
    const s=state.arrivalState;
    if(s==='other')return state.arrivalStateOther.trim();
    return label(ARRIVAL_STATES,s);
  }
  function arrivalSentence(){
    const origin=state.arrivalOriginText.trim(),to=state.arrivalSpreadText.trim(),st=arrivalStateText();
    const head=state.mode==='post'?'현장 도착하여 확인한 바':'선착대 현장 도착하여 관찰한 바';
    if(!origin&&!to&&!st)return '';
    if(origin&&to){
      if(state.mode==='post'||state.arrivalState==='out'||state.arrivalState==='self')return `${head} 화재는 ${origin}에서 발생하여 ${josa(to,'으로','로')} 연소 확대된 후 ${st||'이미 진화된 상태였음'}.`;
      if(state.arrivalState==='spreading'||state.arrivalState==='burning')return `${head} 화재는 ${origin}에서 발생하여 ${josa(to,'으로','로')} 연소 확대 중인 상태였음.`;
      return `${head} 화재는 ${origin}에서 발생하여 ${josa(to,'으로','로')} 연소 확대되었고 ${st||'연소 중인 상태였음'}.`;
    }
    if(origin){
      if(state.mode==='post')return `${head} 화재는 ${origin}에서 발생한 후 ${st||'이미 진화된 상태였음'}.`;
      return `${head} 화재는 ${origin}에서 ${st||'연소 중인 상태였음'}.`;
    }
    if(to)return `${head} 화재는 ${josa(to,'으로','로')} 연소 확대 ${st==='연소 확대 중'?'중인 상태였음':st?`후 ${st}`:'중인 상태였음'}.`;
    return `${head} 화재는 ${st}.`;
  }

  function evidenceText(){let a=EVIDENCE.filter(x=>state.evidence.includes(x[0])&&x[0]!=='other').map(x=>x[1]);if(state.evidenceOther.trim())a.push(state.evidenceOther.trim());return joinKorean(a)}
  function obsText(){let a=OBSERVATIONS.filter(x=>state.observations.includes(x[0])&&x[0]!=='other').map(x=>x[1]);if(state.observationOther.trim())a.push(state.observationOther.trim());return joinKorean(a)}
  function causeBase(){let c=$('cause')?.value.trim()||'조사 중';if(c==='조사 중'||c==='미상')return c;return c.replace(/\s*(추정|판단)\s*$/,'').trim()}
  function investigationSentence(){
    const ev=evidenceText(),origin=state.investOriginText.trim(),to=state.investSpreadText.trim(),use=state.useConnectionText.trim(),obs=obsText(),cause=causeBase();
    let first='화재조사한 바';
    if(ev)first+=` ${ev} 등을 종합하여 볼 때`;
    if(origin&&to)first+=` ${origin}에서 발화되어 ${josa(to,'으로','로')} 연소 확대된 것으로 추정되며,`;
    else if(origin)first+=` ${origin}에서 발화된 것으로 추정되며,`;
    else if(to)first+=` ${josa(to,'으로','로')} 연소 확대된 것으로 추정되며,`;
    else first+=',';

    if(cause==='조사 중'){
      const middle=[use?cleanEnd(use):'',obs?`${obs} 등이 관찰됨`:'' ].filter(Boolean).join(', ');
      return `${first}${middle?' '+middle+'.':''} 화재원인은 현재 조사 중임.`.replace(/\s+/g,' ');
    }
    if(cause==='미상'){
      const middle=[use?cleanEnd(use):'',obs?`${obs} 등이 관찰됨`:'' ].filter(Boolean).join(', ');
      return `${first}${middle?' '+middle+'.':''} 화재원인은 미상임.`.replace(/\s+/g,' ');
    }
    if(use&&obs)return `${first} ${cleanEnd(use)}, ${obs} 등이 관찰되는바 ${cause}에 의한 화재로 추정됨.`.replace(/\s+/g,' ');
    if(obs)return `${first} ${obs} 등이 관찰되는바 ${cause}에 의한 화재로 추정됨.`.replace(/\s+/g,' ');
    if(use)return `${first} ${cleanEnd(use)}. 이를 종합하여 ${cause}에 의한 화재로 추정됨.`.replace(/\s+/g,' ');
    return `${first} ${cause}에 의한 화재로 추정됨.`.replace(/\s+/g,' ');
  }
  function buildText(){return [firstSentence(),arrivalSentence(),investigationSentence()].filter(Boolean).join(' ').replace(/\s+/g,' ').replace(/,\s*\./g,'.').trim()}

  function chipList(list,type){return list.map(x=>`<button type="button" class="ov12Chip" data-${type}="${x[0]}">${esc(x[1])}</button>`).join('')}
  function years(){let out='';for(let y=new Date().getFullYear();y>=1900;y--)out+=`<option>${y}</option>`;return out}
  function directField(id,labelText,placeholder,wide=false){return `<label class="ov12Direct ${wide?'wide':''}">${labelText}<input id="${id}" placeholder="${esc(placeholder)}"></label>`}

  function injectStyle(){
    if($('ov12Style'))return;const s=document.createElement('style');s.id='ov12Style';s.textContent=`
      .ov12Wrap{margin:10px 0 14px;padding:12px;border:1px solid #d9dde5;border-radius:14px;background:#f8fafc}.ov12Head{display:flex;justify-content:space-between;gap:8px}.ov12Title{font-size:17px;font-weight:950}.ov12Sub{font-size:12px;color:#667085;line-height:1.5;margin-top:3px}.ov12Badge{font-size:11px;font-weight:900;color:#1d4ed8;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:5px 8px;height:max-content}.ov12Block{padding:12px 0;border-top:1px solid #e5e7eb}.ov12Block:nth-of-type(2){border-top:0}.ov12Label{font-weight:950;margin-bottom:8px}.ov12Small{font-size:12px;font-weight:900;margin:10px 0 6px;color:#344054}.ov12Small span{font-weight:700;color:#667085}.ov12Chips{display:flex;flex-wrap:wrap;gap:6px}.ov12Chip{min-height:39px;padding:8px 10px;border:1px solid #cfd4dc;background:#fff;border-radius:9px;font-weight:850;font-size:13px;color:#344054}.ov12Chip.on{background:#111827;color:#fff;border-color:#111827}.ov12Chip.import.on{background:#eef2ff;color:#3730a3;border-color:#4f46e5}.ov12Grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ov12Direct{margin:0}.ov12Direct.wide{grid-column:1/-1}.ov12Direct input,.ov12Text{margin-top:4px;background:#fff}.ov12Text{width:100%;min-height:66px;padding:10px;border:1px solid #bbb;border-radius:9px;font:inherit}.ov12Reporter{display:grid;grid-template-columns:1.25fr .8fr 1fr;gap:7px;margin-top:8px}.ov12Gender{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ov12Gender button{height:43px;border:1px solid #cfd4dc;background:#fff;border-radius:9px;font-weight:900}.ov12Gender button.on{background:#111827;color:#fff}.ov12PreviewTitle{font-size:13px;font-weight:950;margin:10px 0 6px}.ov12Preview{background:#fff;border:2px solid #d1d5db;border-radius:12px;padding:12px;line-height:1.75;font-size:14px;min-height:100px;white-space:pre-wrap}.ov12Btns{display:grid;grid-template-columns:1fr 1.3fr;gap:8px}.ov12Btns .btn{width:100%;min-height:46px}.ov12Note{margin-top:5px;font-size:11px;color:#667085;line-height:1.45}@media(max-width:620px){.ov12Grid,.ov12Reporter{grid-template-columns:1fr}.ov12Direct.wide{grid-column:auto}.ov12Chip{flex:1 1 calc(50% - 6px)}.ov12Chips .ov12Chip:nth-last-child(1):nth-child(odd){flex-basis:100%}}
    `;document.head.appendChild(s)
  }

  function makeUI(){
    const summary=$('summary');if(!summary||$('overviewBuilderV312'))return;
    document.querySelectorAll('.ovWrap,#overviewBuilderV311').forEach(x=>x.remove());document.getElementById('ov11Style')?.remove();injectStyle();
    const box=document.createElement('div');box.id='overviewBuilderV312';box.className='ov12Wrap';box.innerHTML=`
      <div class="ov12Head"><div><div class="ov12Title">사고개요 간편작성</div><div class="ov12Sub">문맥은 고정하고, 장소·행동·발화지점·연소경로처럼 현장마다 달라지는 부분은 직접 입력합니다.</div></div><span class="ov12Badge">V3.12</span></div>
      <input type="hidden" id="overviewBuilderJson">
      <div class="ov12Block"><div class="ov12Label">문장 유형</div><div class="ov12Chips">${MODES.map(x=>`<button type="button" class="ov12Chip" data-mode="${x[0]}">${x[1]}</button>`).join('')}</div></div>
      <div class="ov12Block"><div class="ov12Label">① 신고자</div><div class="ov12Chips"><button type="button" class="ov12Chip import" data-import="owner">소유자 불러오기</button><button type="button" class="ov12Chip import" data-import="occupant">점유자 불러오기</button><button type="button" class="ov12Chip import" data-import="related">관계인 불러오기</button><button type="button" class="ov12Chip import" data-import="direct">직접입력</button></div><div class="ov12Reporter"><input id="ov12ReporterName" placeholder="신고자 성명"><div class="ov12Gender"><button type="button" data-gender="남">남</button><button type="button" data-gender="여">여</button></div><select id="ov12ReporterBirth"><option value="">출생연도</option>${years()}</select></div></div>
      <div class="ov12Block"><div class="ov12Label">② 신고 전 상황</div><div class="ov12Grid">${directField('ov12WhereText','당시 위치 · 직접입력','예: 자택 거실')}${directField('ov12ActivityText','무엇을 하는 중 · 직접입력','예: TV 시청 중 / 취침 중 / 작업 중')}${directField('ov12SignalPlaceText','이상징후 발견 위치 · 직접입력','예: 보일러실 측 / 주방 / 창고 내부',true)}</div><div class="ov12Small">무엇을 발견했나 <span>복수선택</span></div><div class="ov12Chips">${chipList(SIGNALS,'signal')}</div><input id="ov12SignalOther" placeholder="기타 이상징후 직접입력"><div class="ov12Small">어떻게 인지했나</div><div class="ov12Chips">${chipList(PERCEPTIONS,'perception')}</div><div class="ov12Small">신고·초기조치 <span>복수선택</span></div><div class="ov12Chips">${ACTIONS.map(x=>`<button type="button" class="ov12Chip" data-action="${x[0]}">${x[1]}</button>`).join('')}</div><input id="ov12ActionOther" placeholder="기타 조치 직접입력"></div>
      <div class="ov12Block"><div class="ov12Label">③ 선착대 현장도착 당시</div><div class="ov12Grid">${directField('ov12ArrivalOriginText','화재 발생·연소 위치 · 직접입력','예: 주택 창고 내 아궁이 부근')}${directField('ov12ArrivalSpreadText','연소확대 방향·대상 · 직접입력','예: 주변 볏짚 및 건물 전체')}</div><div class="ov12Small">현장 상태</div><div class="ov12Chips">${chipList(ARRIVAL_STATES,'arrival')}</div><input id="ov12ArrivalStateOther" placeholder="기타 현장상태 직접입력" style="display:none"></div>
      <div class="ov12Block"><div class="ov12Label">④ 화재조사 판단</div><div class="ov12Small">판단 근거 <span>복수선택</span></div><div class="ov12Chips">${chipList(EVIDENCE,'evidence')}</div><input id="ov12EvidenceOther" placeholder="기타 판단근거 직접입력"><div class="ov12Grid" style="margin-top:9px">${directField('ov12InvestOriginText','발화지점 · 직접입력','예: 보일러 플러그측 전원선')}${directField('ov12InvestSpreadText','연소확대 경로·대상 · 직접입력','예: 주변 가연물에서 벽체 및 천장 방향')}</div><div class="ov12Small">사용·연결 상태 · 직접입력</div><textarea id="ov12UseConnectionText" class="ov12Text" placeholder="예: 소유자가 보일러실 벽면 노출콘센트(2구)에 3구 멀티콘센트를 연결 후 보일러 전원 플러그를 연결하여 사용 중이었으며"></textarea><div class="ov12Note">현장마다 연결·사용 상태가 달라 이 항목은 선택식이 아닌 직접입력으로 둡니다.</div><div class="ov12Small">관찰사항 <span>복수선택</span></div><div class="ov12Chips">${chipList(OBSERVATIONS,'observation')}</div><input id="ov12ObservationOther" placeholder="기타 관찰사항 직접입력"></div>
      <div class="ov12PreviewTitle">완성 문장 미리보기</div><div id="ov12Preview" class="ov12Preview"></div><div class="ov12Btns"><button type="button" id="ov12Reset" class="btn gray">입력 초기화</button><button type="button" id="ov12Apply" class="btn red">사고개요에 적용</button></div><div id="ov12Status" class="status"></div>`;
    (summary.closest('label')||summary).insertAdjacentElement('beforebegin',box);bind();restoreState();syncAll();render();
  }

  function bind(){
    const root=$('overviewBuilderV312');
    root.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.mode){state.mode=b.dataset.mode;if(state.mode==='post')state.arrivalState='out';else if(state.mode==='self')state.arrivalState='self';else if(['out','self'].includes(state.arrivalState))state.arrivalState='burning';render();return}
      if(b.dataset.import){const r=b.dataset.import;if(r==='direct'){setReporter({name:'',gender:'',birthYear:''},'direct');return}setReporter(relationPerson(r),r);return}
      if(b.dataset.gender){state.reporter.gender=b.dataset.gender;syncReporter();render();return}
      if(b.dataset.perception){state.perception=b.dataset.perception;render();return}
      if(b.dataset.arrival){state.arrivalState=b.dataset.arrival;render();return}
      const multi=[['signal','signals'],['action','actions'],['evidence','evidence'],['observation','observations']];
      for(const [d,k] of multi)if(b.dataset[d]){const v=b.dataset[d],a=state[k],i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);render();return}
    });
    const fields=[
      ['ov12ReporterName','reporter.name'],['ov12ReporterBirth','reporter.birthYear'],['ov12WhereText','whereText'],['ov12ActivityText','activityText'],['ov12SignalPlaceText','signalPlaceText'],['ov12SignalOther','signalOther'],['ov12ActionOther','actionOther'],['ov12ArrivalOriginText','arrivalOriginText'],['ov12ArrivalSpreadText','arrivalSpreadText'],['ov12ArrivalStateOther','arrivalStateOther'],['ov12EvidenceOther','evidenceOther'],['ov12InvestOriginText','investOriginText'],['ov12InvestSpreadText','investSpreadText'],['ov12UseConnectionText','useConnectionText'],['ov12ObservationOther','observationOther']
    ];
    fields.forEach(([id,path])=>$(id)?.addEventListener(id==='ov12ReporterBirth'?'change':'input',e=>{setPath(path,e.target.value);render()}));
    $('ov12Apply').onclick=()=>{const s=$('summary');s.value=buildText();s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));$('ov12Status').textContent='✓ 사고개요에 적용됨'};
    $('ov12Reset').onclick=reset;$('cause')?.addEventListener('input',render);$('cause')?.addEventListener('change',render);
  }
  function setPath(path,val){if(path.startsWith('reporter.'))state.reporter[path.split('.')[1]]=val;else state[path]=val}
  function syncReporter(){
    if($('ov12ReporterName'))$('ov12ReporterName').value=state.reporter.name||'';if($('ov12ReporterBirth'))$('ov12ReporterBirth').value=state.reporter.birthYear||'';
    document.querySelectorAll('#overviewBuilderV312 [data-gender]').forEach(b=>b.classList.toggle('on',b.dataset.gender===state.reporter.gender));document.querySelectorAll('#overviewBuilderV312 [data-import]').forEach(b=>b.classList.toggle('on',b.dataset.import===state.reporter.source));
  }
  function syncAll(){
    const map={ov12WhereText:'whereText',ov12ActivityText:'activityText',ov12SignalPlaceText:'signalPlaceText',ov12SignalOther:'signalOther',ov12ActionOther:'actionOther',ov12ArrivalOriginText:'arrivalOriginText',ov12ArrivalSpreadText:'arrivalSpreadText',ov12ArrivalStateOther:'arrivalStateOther',ov12EvidenceOther:'evidenceOther',ov12InvestOriginText:'investOriginText',ov12InvestSpreadText:'investSpreadText',ov12UseConnectionText:'useConnectionText',ov12ObservationOther:'observationOther'};
    Object.entries(map).forEach(([id,k])=>{if($(id))$(id).value=state[k]||''});if($('ov12ArrivalStateOther'))$('ov12ArrivalStateOther').style.display=state.arrivalState==='other'?'block':'none';syncReporter();
  }
  function render(){
    document.querySelectorAll('#overviewBuilderV312 [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===state.mode));document.querySelectorAll('#overviewBuilderV312 [data-perception]').forEach(b=>b.classList.toggle('on',b.dataset.perception===state.perception));document.querySelectorAll('#overviewBuilderV312 [data-arrival]').forEach(b=>b.classList.toggle('on',b.dataset.arrival===state.arrivalState));
    [['signal','signals'],['action','actions'],['evidence','evidence'],['observation','observations']].forEach(([d,k])=>document.querySelectorAll(`#overviewBuilderV312 [data-${d}]`).forEach(b=>b.classList.toggle('on',state[k].includes(b.dataset[d]))));
    if($('ov12ArrivalStateOther'))$('ov12ArrivalStateOther').style.display=state.arrivalState==='other'?'block':'none';syncReporter();const p=$('ov12Preview');if(p)p.textContent=buildText();const h=$('overviewBuilderJson');if(h)h.value=JSON.stringify(state);
  }
  function reset(){
    Object.assign(state,{schema:312,mode:'normal',reporter:{name:'',gender:'',birthYear:'',source:'direct'},whereText:'',activityText:'',signalPlaceText:'',signals:[],signalOther:'',perception:'abnormal',actions:['119'],actionOther:'',arrivalOriginText:'',arrivalSpreadText:'',arrivalState:'burning',arrivalStateOther:'',evidence:['related','pattern','char'],evidenceOther:'',investOriginText:'',investSpreadText:'',useConnectionText:'',observations:[],observationOther:''});syncAll();render();$('ov12Status').textContent='';
  }
  function migrateOld(p){
    if(!p||typeof p!=='object')return;
    if(Number(p.schema)===312){Object.assign(state,p);state.reporter={...state.reporter,...(p.reporter||{})};return}
    state.mode=p.mode||state.mode;state.reporter={...state.reporter,...(p.reporter||{})};
    state.whereText=(p.where==='기타'?p.whereOther:p.where)||p.whereText||'';
    state.activityText=p.activityText||p.activityOther||LEGACY_ACTIVITY[p.activity]||'';
    state.signalPlaceText=(p.signalPlace==='기타'?p.signalPlaceOther:p.signalPlace)||p.signalPlaceText||'';
    state.signals=Array.isArray(p.signals)?p.signals:[];state.signalOther=p.signalOther||'';state.perception=p.perception||state.perception;state.actions=Array.isArray(p.actions)?p.actions:['119'];state.actionOther=p.actionOther||'';
    state.arrivalOriginText=(p.arrivalOrigin==='기타'?p.arrivalOriginOther:p.arrivalOrigin)||p.arrivalOriginText||'';state.arrivalSpreadText=(p.arrivalSpread==='기타'?p.arrivalSpreadOther:p.arrivalSpread)||p.arrivalSpreadText||'';state.arrivalState=p.arrivalState||state.arrivalState;state.arrivalStateOther=p.arrivalStateOther||'';
    state.evidence=Array.isArray(p.evidence)?p.evidence:state.evidence;state.evidenceOther=p.evidenceOther||'';state.investOriginText=(p.investOrigin==='기타'?p.investOriginOther:p.investOrigin)||p.investOriginText||'';state.investSpreadText=(p.investSpread==='기타'?p.investSpreadOther:p.investSpread)||p.investSpreadText||'';
    if(p.useConnectionText)state.useConnectionText=p.useConnectionText;else{const a=Array.isArray(p.useState)?p.useState.map(x=>LEGACY_USE[x]).filter(Boolean):[];if(p.useOther)a.push(p.useOther);state.useConnectionText=a.join(', ')}
    state.observations=Array.isArray(p.observations)?p.observations:[];state.observationOther=p.observationOther||'';
  }
  function restoreState(){try{const d=JSON.parse(localStorage.getItem('wanjuFireReportV2')||'{}');if(d.overviewBuilderJson)migrateOld(JSON.parse(d.overviewBuilderJson));else if(d.overviewBuilder)migrateOld(d.overviewBuilder)}catch(e){}}
  function patchCollect(){try{const old=collect;collect=function(){const d=old();d.overviewBuilder={...state,reporter:{...state.reporter}};d.overviewBuilderText=buildText();return d}}catch(e){}}
  function setVersion(){const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.12';document.title='완주소방서 화재상황보고 V3.12'}
  function install(){makeUI();patchCollect();setVersion();setTimeout(setVersion,750)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,140));else setTimeout(install,140);
})();
