/* Wanju Fire Report V3.6 - universal 24-hour time wheel
 * Receipt time: HH:MM:SS
 * End time / all action times: HH:MM
 */
(function(){
  'use strict';
  const TWO=n=>String(n).padStart(2,'0');
  const ROW=48;
  let overlay=null, active=null, state={h:0,m:0,s:0}, scrollTimers={};

  function getActions(){try{return Array.isArray(actionState)?actionState:null}catch(e){return null}}
  function prevTime(){try{return typeof previousActionTime==='function'?previousActionTime():''}catch(e){return ''}}
  function syncActions(){try{if(typeof syncActionsText==='function')syncActionsText()}catch(e){}}
  function nowParts(){const d=new Date();return {h:d.getHours(),m:d.getMinutes(),s:d.getSeconds()}}
  function minuteOnly(x){
    const m=String(x||'').trim().match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
    if(!m)return '';
    const h=Math.min(23,Math.max(0,Number(m[1]||0))),mm=Math.min(59,Math.max(0,Number(m[2]||0)));
    return `${TWO(h)}:${TWO(mm)}`;
  }
  function secondTime(x,fallbackNow=true){
    const m=String(x||'').trim().match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
    if(!m){const n=nowParts();return fallbackNow?`${TWO(n.h)}:${TWO(n.m)}:${TWO(n.s)}`:''}
    const h=Math.min(23,Math.max(0,Number(m[1]||0))),mm=Math.min(59,Math.max(0,Number(m[2]||0))),ss=Math.min(59,Math.max(0,Number(m[3]||0)));
    return `${TWO(h)}:${TWO(mm)}:${TWO(ss)}`;
  }
  function parts(value,withSeconds){
    const x=(withSeconds?secondTime(value,true):(minuteOnly(value)||minuteOnly(`${nowParts().h}:${nowParts().m}`))).split(':').map(Number);
    return {h:x[0]||0,m:x[1]||0,s:withSeconds?(x[2]||0):0};
  }
  function outValue(){return active?.withSeconds?`${TWO(state.h)}:${TWO(state.m)}:${TWO(state.s)}`:`${TWO(state.h)}:${TWO(state.m)}`}

  function injectStyle(){
    if(document.getElementById('wanjuTimeWheelStyle'))return;
    const st=document.createElement('style');st.id='wanjuTimeWheelStyle';st.textContent=`
      .timeWheelInput,.actionTime{font-variant-numeric:tabular-nums;letter-spacing:.04em;cursor:pointer;background:#fff!important;font-weight:800}
      .twOverlay{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:99999;display:none;align-items:flex-end;justify-content:center;padding:0}
      .twOverlay.show{display:flex}.twSheet{width:min(100%,560px);background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -10px 35px rgba(0,0,0,.22);padding:14px 14px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box}
      .twTitle{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 4px 10px;font-weight:900;font-size:16px}.twValue{font-size:22px;font-variant-numeric:tabular-nums;color:#111827;letter-spacing:.06em}
      .twWheels{display:grid;align-items:center;position:relative;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:0 8px;overflow:hidden}.twWheels.seconds{grid-template-columns:1fr 22px 1fr 22px 1fr}.twWheels.minutes{grid-template-columns:1fr 22px 1fr}
      .twColon{text-align:center;font-size:24px;font-weight:900;color:#374151}.twCol{height:240px;overflow-y:auto;overscroll-behavior:contain;scroll-snap-type:y mandatory;scrollbar-width:none;position:relative;-webkit-overflow-scrolling:touch}.twCol::-webkit-scrollbar{display:none}
      .twSpacer{height:96px;flex:0 0 96px}.twItem{height:48px;display:flex;align-items:center;justify-content:center;scroll-snap-align:center;font-size:20px;font-weight:700;color:#374151;border:0;background:transparent;width:100%;padding:0}.twItem.selected{background:#d1d5db;color:#111827;font-weight:950;border-radius:4px}
      .twBtns{display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:8px;margin-top:12px}.twBtns button{height:48px;border:0;border-radius:11px;font-size:15px;font-weight:900}.twCancel{background:#e5e7eb;color:#111827}.twNow{background:#eef2ff;color:#3730a3}.twOk{background:#b91c1c;color:#fff}
      body.twLocked{overflow:hidden}
      @media(min-width:700px){.twOverlay{align-items:center;padding:20px}.twSheet{border-radius:20px}}
    `;document.head.appendChild(st);
  }

  function makeCol(kind,max){
    const col=document.createElement('div');col.className='twCol';col.dataset.kind=kind;
    const top=document.createElement('div');top.className='twSpacer';col.appendChild(top);
    for(let i=0;i<=max;i++){
      const b=document.createElement('button');b.type='button';b.className='twItem';b.dataset.value=String(i);b.textContent=TWO(i);
      b.addEventListener('click',()=>col.scrollTo({top:i*ROW,behavior:'smooth'}));col.appendChild(b);
    }
    const bot=document.createElement('div');bot.className='twSpacer';col.appendChild(bot);
    col.addEventListener('scroll',()=>{
      clearTimeout(scrollTimers[kind]);
      const update=()=>{const v=Math.max(0,Math.min(max,Math.round(col.scrollTop/ROW)));state[kind]=v;paint()};
      update();scrollTimers[kind]=setTimeout(()=>{const v=Math.max(0,Math.min(max,Math.round(col.scrollTop/ROW)));col.scrollTo({top:v*ROW,behavior:'smooth'});state[kind]=v;paint()},90);
    },{passive:true});
    return col;
  }

  function buildWheels(){
    const wheels=overlay.querySelector('#twWheels');wheels.innerHTML='';wheels.className='twWheels '+(active?.withSeconds?'seconds':'minutes');
    wheels.append(makeCol('h',23));let c=document.createElement('div');c.className='twColon';c.textContent=':';wheels.append(c);wheels.append(makeCol('m',59));
    if(active?.withSeconds){c=document.createElement('div');c.className='twColon';c.textContent=':';wheels.append(c);wheels.append(makeCol('s',59))}
  }
  function ensure(){
    injectStyle();if(overlay)return;
    overlay=document.createElement('div');overlay.className='twOverlay';overlay.innerHTML=`<div class="twSheet" role="dialog" aria-modal="true" aria-label="24시간제 시간 선택"><div class="twTitle"><span id="twLabel">시간 선택</span><strong class="twValue" id="twValue">00:00</strong></div><div class="twWheels minutes" id="twWheels"></div><div class="twBtns"><button type="button" class="twCancel">취소</button><button type="button" class="twNow">현재시간</button><button type="button" class="twOk">입력완료</button></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.twCancel').onclick=close;
    overlay.querySelector('.twNow').onclick=()=>{state=nowParts();if(!active?.withSeconds)state.s=0;position(false);paint()};
    overlay.querySelector('.twOk').onclick=()=>{const x=outValue(),cb=active&&active.onConfirm;close();if(cb)cb(x)};
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  }
  function paint(){if(!overlay)return;overlay.querySelector('#twValue').textContent=outValue();overlay.querySelectorAll('.twCol').forEach(col=>{const k=col.dataset.kind,sel=state[k];col.querySelectorAll('.twItem').forEach(x=>x.classList.toggle('selected',Number(x.dataset.value)===sel))})}
  function position(smooth=false){if(!overlay)return;overlay.querySelectorAll('.twCol').forEach(col=>{const k=col.dataset.kind;col.scrollTo({top:state[k]*ROW,behavior:smooth?'smooth':'auto'})})}
  function openTimeWheel(opts){ensure();active=opts||{};active.withSeconds=!!active.withSeconds;state=parts(active.value||'',active.withSeconds);buildWheels();overlay.querySelector('#twLabel').textContent=active.title||'시간 선택';overlay.classList.add('show');document.body.classList.add('twLocked');requestAnimationFrame(()=>{position(false);paint()})}
  function close(){if(!overlay)return;overlay.classList.remove('show');document.body.classList.remove('twLocked');active=null}

  function setStatic(id,title,withSeconds){
    const el=document.getElementById(id);if(!el)return;try{el.type='text'}catch(e){}el.readOnly=true;el.inputMode='none';el.autocomplete='off';el.classList.add('timeWheelInput');el.placeholder=withSeconds?'00:00:00':'00:00';
    if(el.value)el.value=withSeconds?secondTime(el.value,false):minuteOnly(el.value);
    el.onclick=e=>{e.preventDefault();openTimeWheel({title,value:el.value,withSeconds,onConfirm:x=>{el.value=x;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));syncLinked(id,x)}})};
  }
  function syncLinked(id,x){
    const actions=getActions();if(!actions)return;
    if(id==='recv'){
      const i=actions.findIndex(a=>a.type==='dispatch');if(i>=0){actions[i].time=minuteOnly(x);redrawRowsMinute()}
    }
    if(id==='end'){
      const i=actions.findIndex(a=>a.type==='complete'||a.type==='self');if(i>=0){actions[i].time=minuteOnly(x);redrawRowsMinute()}
    }
  }
  function openAction(i){
    const actions=getActions();if(!actions||!actions[i])return;
    document.querySelectorAll('.actionPad.show').forEach(x=>x.classList.remove('show'));
    const base=minuteOnly(actions[i].time)||minuteOnly(prevTime())||minuteOnly(document.getElementById('recv')?.value)||'';
    openTimeWheel({title:'조치시간',value:base,withSeconds:false,onConfirm:x=>{actions[i].time=minuteOnly(x);redrawRowsMinute()}});
  }

  let baseRender=null;
  function redrawRowsMinute(){
    const actions=getActions();if(actions)actions.forEach(a=>{a.time=minuteOnly(a.time||(a.type==='dispatch'?document.getElementById('recv')?.value:''))});
    try{if(baseRender)baseRender()}catch(e){}
    if(actions){actions.forEach((a,i)=>{a.time=minuteOnly(a.time||(a.type==='dispatch'?document.getElementById('recv')?.value:''));const e=document.getElementById('actionTime_'+i);if(e){e.value=a.time;e.placeholder='00:00';e.readOnly=true;e.inputMode='none';e.classList.add('timeWheelInput')}})}
    syncActions();
  }

  function install(){
    document.getElementById('recvNowBtn')?.remove();document.getElementById('recv24View')?.remove();
    setStatic('recv','접수시간',true);setStatic('end','종료시간',false);

    try{
      baseRender=renderActionRows;
      renderActionRows=function(){redrawRowsMinute()};
    }catch(e){}
    const actions=getActions();if(actions)actions.forEach(a=>{a.time=minuteOnly(a.time||(a.type==='dispatch'?document.getElementById('recv')?.value:''))});
    redrawRowsMinute();

    try{toggleActionPad=function(i){openAction(i)}}catch(e){}
    try{addCustomAction=function(){const a=getActions();if(!a)return;a.push({type:'custom',time:minuteOnly(prevTime()),text:''});redrawRowsMinute();syncActions();openAction(a.length-1)}}catch(e){}
    try{timeline=function(){const a=getActions()||[];return a.filter(x=>(x.text||'').trim()).map(x=>({time:minuteOnly(x.time||(x.type==='dispatch'?document.getElementById('recv')?.value:'')),text:x.text.trim()}))}}catch(e){}

    document.addEventListener('click',e=>{
      const t=e.target;if(!(t instanceof Element)||!t.classList.contains('actionTime'))return;
      const m=(t.id||'').match(/^actionTime_(\d+)$/);if(!m)return;e.preventDefault();e.stopImmediatePropagation();openAction(Number(m[1]));
    },true);
    const help=document.querySelector('.actionHelp');if(help)help.textContent='조치시간은 24시간제 시·분(HH:MM)으로 입력합니다.';
    const h1=document.querySelector('header h1');if(h1)h1.textContent='🔥 완주소방서 화재상황보고 V3.6';document.title='완주소방서 화재상황보고 V3.6';
  }

  window.openWanjuTimeWheel=openTimeWheel;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
(function(){
  function loadCause(){
    if(document.getElementById('wanjuFireCauseScript'))return;
    const c=document.createElement('script');c.id='wanjuFireCauseScript';c.src='app-v3-fire-cause.js?v=20260905e';c.defer=true;document.head.appendChild(c);
  }
  function loadOverview(){
    if(document.getElementById('wanjuOverviewBuilderScript')){setTimeout(loadCause,80);return}
    const o=document.createElement('script');o.id='wanjuOverviewBuilderScript';o.src='app-v3-overview-builder.js?v=20260905d';o.defer=true;o.onload=loadCause;document.head.appendChild(o);setTimeout(loadCause,550);
  }
  const existing=document.getElementById('wanjuRelationsScript');
  if(existing){existing.addEventListener('load',loadOverview,{once:true});setTimeout(loadOverview,350);return}
  const s=document.createElement('script');s.id='wanjuRelationsScript';s.src='app-v3-relations.js?v=20260905c';s.defer=true;s.onload=loadOverview;document.head.appendChild(s);
})();
