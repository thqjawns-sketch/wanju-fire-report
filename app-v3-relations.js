/* Wanju Fire Report - 관계인 등 + 연락처 내부저장(보고서 미출력) */
(function(){
  'use strict';
  const ROLES=[{id:'owner',label:'소유자'},{id:'occupant',label:'점유자'},{id:'related',label:'관계인'}];
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state={
    owner:{active:false,name:'',gender:'',birthYear:'',detail:'',phone:''},
    occupant:{active:false,name:'',gender:'',birthYear:'',detail:'',phone:''},
    related:{active:false,name:'',gender:'',birthYear:'',detail:'',phone:''}
  };

  function completed(role){const x=state[role];return !!(x?.active&&x.name.trim()&&x.gender&&x.birthYear)}
  function personText(role){
    const x=state[role];if(!completed(role))return '';
    const d=ROLES.find(r=>r.id===role);let label=d.label;
    if(role==='related'&&x.detail.trim())label+=`(${x.detail.trim()})`;
    return `${label} ${x.name.trim()}(${x.gender}, ${x.birthYear}년생)`;
  }
  function summary(){return ROLES.map(r=>personText(r.id)).filter(Boolean).join(' / ')}
  function contactSummary(){return ROLES.filter(r=>state[r.id].active&&state[r.id].phone.trim()).map(r=>`${r.label} ${state[r.id].name.trim()||'성명미입력'} ${state[r.id].phone.trim()}`).join(' / ')}
  window.relationSummary=summary;

  function formatPhone(v){
    const n=String(v||'').replace(/\D/g,'').slice(0,11);
    if(n.length<=3)return n;
    if(n.startsWith('02')){
      if(n.length<=5)return n.slice(0,2)+'-'+n.slice(2);
      if(n.length<=9)return n.slice(0,2)+'-'+n.slice(2,5)+'-'+n.slice(5);
      return n.slice(0,2)+'-'+n.slice(2,6)+'-'+n.slice(6);
    }
    if(n.length<=7)return n.slice(0,3)+'-'+n.slice(3);
    if(n.length<=10)return n.slice(0,3)+'-'+n.slice(3,6)+'-'+n.slice(6);
    return n.slice(0,3)+'-'+n.slice(3,7)+'-'+n.slice(7);
  }

  function saveState(){
    const h=$('relatedPersonsJson');if(h)h.value=JSON.stringify(state);
    const legacy=$('owner');if(legacy)legacy.value=completed('owner')?`${state.owner.name.trim()}(${state.owner.gender}, ${state.owner.birthYear}년생)`:'';
    const view=$('relationSummaryView');if(view)view.textContent=summary()||'입력 완료된 관계인 없음';
    const cv=$('relationContactView');if(cv)cv.textContent=contactSummary()?`연락처 저장: ${contactSummary()}`:'연락처 입력 없음';
  }
  function toggleRole(role){state[role].active=!state[role].active;render();saveState()}
  function setGender(role,g){state[role].gender=g;render();saveState()}
  function setField(role,key,val){state[role][key]=val;saveState()}
  function setPhone(role,val){state[role].phone=formatPhone(val);const e=$('relPhone_'+role);if(e&&e.value!==state[role].phone)e.value=state[role].phone;saveState()}

  function years(selected){let out='<option value="">출생연도 선택</option>';for(let y=new Date().getFullYear();y>=1900;y--)out+=`<option value="${y}" ${String(y)===String(selected)?'selected':''}>${y}년</option>`;return out}
  function card(r){const x=state[r.id];return `<div id="relCard_${r.id}" class="relCard"><div class="relHead">${r.label}</div><div class="relGrid"><label class="relName">성명<input id="relName_${r.id}" value="${esc(x.name)}" placeholder="성명 직접입력"></label><label>성별<div class="relGender"><button type="button" id="relGender_${r.id}_남">남</button><button type="button" id="relGender_${r.id}_여">여</button></div></label><label>출생연도<select id="relBirth_${r.id}">${years(x.birthYear)}</select></label></div><label class="relPhone">연락처 <span class="relNoReport">상황보고서 미표시</span><input id="relPhone_${r.id}" type="tel" inputmode="tel" autocomplete="tel" value="${esc(x.phone||'')}" placeholder="예: 010-1234-5678"></label>${r.id==='related'?`<label class="relDetail">관계 구분(선택)<input id="relDetail_related" value="${esc(x.detail)}" placeholder="예: 신고자 / 직원 / 가족"></label>`:''}</div>`}

  function style(){if($('relStyle'))return;let s=document.createElement('style');s.id='relStyle';s.textContent=`
    .relWrap{margin:14px 0 6px}.relTitle{font-weight:900;font-size:15px;margin-bottom:7px}.relHint{font-size:12px;color:#667085;margin-bottom:8px}.relBtns{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.relBtn{height:44px;border:1px solid #cfd4dc;border-radius:10px;background:#fff;font-weight:900}.relBtn.on{background:#eef2ff;border-color:#4f46e5;color:#3730a3}.relCards{display:grid;gap:9px;margin-top:9px}.relCard{display:none;border:1px solid #d9dde5;border-radius:12px;background:#f8fafc;padding:11px}.relCard.show{display:block}.relHead{font-weight:900;margin-bottom:9px}.relGrid{display:grid;grid-template-columns:1.25fr .75fr .9fr;gap:8px}.relGrid label{margin:0}.relGender{display:grid;grid-template-columns:1fr 1fr;gap:6px}.relGender button{height:42px;border:1px solid #cfd4dc;border-radius:9px;background:#fff;font-weight:900}.relGender button.on{background:#111827;color:#fff}.relPhone,.relDetail{margin-top:8px}.relNoReport{margin-left:5px;font-size:11px;font-weight:700;color:#667085}.relSummary{margin-top:9px;padding:9px 10px;border-radius:9px;background:#fff7ed;color:#9a3412;font-size:13px;font-weight:800;line-height:1.5}.relContactSummary{margin-top:6px;padding:8px 10px;border-radius:9px;background:#eff6ff;color:#1e40af;font-size:12px;font-weight:800;line-height:1.5}@media(max-width:620px){.relGrid{grid-template-columns:1fr 1fr}.relName{grid-column:1/-1}}
  `;document.head.appendChild(s)}

  function render(){ROLES.forEach(r=>{let x=state[r.id],b=$('relBtn_'+r.id),c=$('relCard_'+r.id);if(b){b.classList.toggle('on',x.active);b.textContent=(x.active?'✓ ':'')+r.label}if(c)c.classList.toggle('show',x.active);['남','여'].forEach(g=>$(`relGender_${r.id}_${g}`)?.classList.toggle('on',x.gender===g));const p=$('relPhone_'+r.id);if(p&&p.value!==x.phone)p.value=x.phone||''});saveState()}
  function bind(){
    ROLES.forEach(r=>{
      $('relBtn_'+r.id).onclick=()=>toggleRole(r.id);
      $('relName_'+r.id).addEventListener('input',e=>setField(r.id,'name',e.target.value));
      $('relBirth_'+r.id).addEventListener('change',e=>setField(r.id,'birthYear',e.target.value));
      $('relPhone_'+r.id).addEventListener('input',e=>setPhone(r.id,e.target.value));
      ['남','여'].forEach(g=>$(`relGender_${r.id}_${g}`).onclick=()=>setGender(r.id,g));
    });
    $('relDetail_related').addEventListener('input',e=>setField('related','detail',e.target.value));
  }

  function restore(){try{let d=JSON.parse(localStorage.getItem('wanjuFireReportV2')||'{}');if(d.relatedPersonsJson){let p=JSON.parse(d.relatedPersonsJson);ROLES.forEach(r=>{if(p?.[r.id])state[r.id]={...state[r.id],...p[r.id],phone:formatPhone(p[r.id].phone||'')}})}else if(d.owner){state.owner.active=true;state.owner.name=String(d.owner).replace(/\([^)]*\)/g,'').trim()}}catch(e){}}
  function installUI(){style();restore();let legacy=$('owner');if(!legacy||$('relationSection'))return;let label=legacy.closest('label');if(label)label.style.display='none';legacy.type='hidden';let hidden=document.createElement('input');hidden.type='hidden';hidden.id='relatedPersonsJson';let sec=document.createElement('div');sec.id='relationSection';sec.className='relWrap';sec.innerHTML=`<div class="relTitle">관계인 등</div><div class="relHint">필요한 항목만 선택하세요. 연락처는 저장용이며 상황보고서·JPG·HWPX에는 표시하지 않습니다.</div><div class="relBtns">${ROLES.map(r=>`<button type="button" id="relBtn_${r.id}" class="relBtn">${r.label}</button>`).join('')}</div><div class="relCards">${ROLES.map(card).join('')}</div><div id="relationSummaryView" class="relSummary">입력 완료된 관계인 없음</div><div id="relationContactView" class="relContactSummary">연락처 입력 없음</div>`;(label||legacy).insertAdjacentElement('afterend',hidden);hidden.insertAdjacentElement('afterend',sec);bind();render()}

  function patch(){
    try{const old=collect;collect=function(){let d=old();let all=ROLES.filter(r=>state[r.id].active).map(r=>({role:r.label,name:state[r.id].name.trim(),gender:state[r.id].gender,birthYear:state[r.id].birthYear,detail:state[r.id].detail||'',phone:state[r.id].phone||''}));let reportList=all.filter(x=>x.name&&x.gender&&x.birthYear);d.relatedPersons=all;d.relatedPersonsText=reportList.map(x=>`${x.role}${x.detail?`(${x.detail})`:''} ${x.name}(${x.gender}, ${x.birthYear}년생)`).join(' / ');d.relatedContactsText=all.filter(x=>x.phone).map(x=>`${x.role} ${x.name||'성명미입력'} ${x.phone}`).join(' / ');return d}}catch(e){}
    try{const old=buildReportPaper;buildReportPaper=function(){let paper=old(),text=summary();paper?.querySelectorAll('.reportLine').forEach(line=>{let t=line.textContent.trim();if(t.startsWith('라. 소 유 자:')||t.startsWith('라. 관계인 등:'))line.innerHTML='라. 관계인 등: '+esc(text||'해당없음')});return paper}}catch(e){}
    try{const old=reportPlainLinesExact;reportPlainLinesExact=function(){let text=summary();return old().map(line=>(line.includes('라. 소 유 자:')||line.includes('라. 관계인 등:'))?`  라. 관계인 등: ${text||'해당없음'}`:line)};reportPlainLines=reportPlainLinesExact}catch(e){}
    try{const old=exactPatchSection;exactPatchSection=function(xml){let out=old(xml),doc=new DOMParser().parseFromString(out,'application/xml'),ps=exactHwpxParas(doc),text=summary();if(ps[24])exactSetWhole(ps[24],`  라. 관계인 등: ${text||'해당없음'}`);return new XMLSerializer().serializeToString(doc)}}catch(e){}
  }

  function install(){installUI();patch()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,80));else setTimeout(install,80);
})();
