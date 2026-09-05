/* Wanju Fire Report V3.8 - 관계인 등: 입력 완료한 사람만 보고서 출력 */
(function(){
  'use strict';
  const ROLES=[{id:'owner',label:'소유자'},{id:'occupant',label:'점유자'},{id:'related',label:'관계인'}];
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state={owner:{active:false,name:'',gender:'',birthYear:'',detail:''},occupant:{active:false,name:'',gender:'',birthYear:'',detail:''},related:{active:false,name:'',gender:'',birthYear:'',detail:''}};

  function completed(role){const x=state[role];return !!(x?.active&&x.name.trim()&&x.gender&&x.birthYear)}
  function personText(role){
    const x=state[role];if(!completed(role))return '';
    const d=ROLES.find(r=>r.id===role);let label=d.label;
    if(role==='related'&&x.detail.trim())label+=`(${x.detail.trim()})`;
    return `${label} ${x.name.trim()}(${x.gender}, ${x.birthYear}년생)`;
  }
  function summary(){return ROLES.map(r=>personText(r.id)).filter(Boolean).join(' / ')}
  window.relationSummary=summary;

  function saveState(){
    const h=$('relatedPersonsJson');if(h)h.value=JSON.stringify(state);
    const legacy=$('owner');if(legacy)legacy.value=completed('owner')?`${state.owner.name.trim()}(${state.owner.gender}, ${state.owner.birthYear}년생)`:'';
    const view=$('relationSummaryView');if(view)view.textContent=summary()||'입력 완료된 관계인 없음';
  }
  function toggleRole(role){state[role].active=!state[role].active;render();saveState()}
  function setGender(role,g){state[role].gender=g;render();saveState()}
  function setField(role,key,val){state[role][key]=val;saveState()}

  function years(selected){let out='<option value="">출생연도 선택</option>';for(let y=new Date().getFullYear();y>=1900;y--)out+=`<option value="${y}" ${String(y)===String(selected)?'selected':''}>${y}년</option>`;return out}
  function card(r){const x=state[r.id];return `<div id="relCard_${r.id}" class="relCard"><div class="relHead">${r.label}</div><div class="relGrid"><label class="relName">성명<input id="relName_${r.id}" value="${esc(x.name)}" placeholder="성명 직접입력"></label><label>성별<div class="relGender"><button type="button" id="relGender_${r.id}_남">남</button><button type="button" id="relGender_${r.id}_여">여</button></div></label><label>출생연도<select id="relBirth_${r.id}">${years(x.birthYear)}</select></label></div>${r.id==='related'?`<label class="relDetail">관계 구분(선택)<input id="relDetail_related" value="${esc(x.detail)}" placeholder="예: 신고자 / 직원 / 가족"></label>`:''}</div>`}

  function style(){if($('relStyle'))return;let s=document.createElement('style');s.id='relStyle';s.textContent=`
    .relWrap{margin:14px 0 6px}.relTitle{font-weight:900;font-size:15px;margin-bottom:7px}.relHint{font-size:12px;color:#667085;margin-bottom:8px}.relBtns{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.relBtn{height:44px;border:1px solid #cfd4dc;border-radius:10px;background:#fff;font-weight:900}.relBtn.on{background:#eef2ff;border-color:#4f46e5;color:#3730a3}.relCards{display:grid;gap:9px;margin-top:9px}.relCard{display:none;border:1px solid #d9dde5;border-radius:12px;background:#f8fafc;padding:11px}.relCard.show{display:block}.relHead{font-weight:900;margin-bottom:9px}.relGrid{display:grid;grid-template-columns:1.25fr .75fr .9fr;gap:8px}.relGrid label{margin:0}.relGender{display:grid;grid-template-columns:1fr 1fr;gap:6px}.relGender button{height:42px;border:1px solid #cfd4dc;border-radius:9px;background:#fff;font-weight:900}.relGender button.on{background:#111827;color:#fff}.relDetail{margin-top:8px}.relSummary{margin-top:9px;padding:9px 10px;border-radius:9px;background:#fff7ed;color:#9a3412;font-size:13px;font-weight:800;line-height:1.5}@media(max-width:620px){.relGrid{grid-template-columns:1fr 1fr}.relName{grid-column:1/-1}}
  `;document.head.appendChild(s)}

  function render(){ROLES.forEach(r=>{let x=state[r.id],b=$('relBtn_'+r.id),c=$('relCard_'+r.id);if(b){b.classList.toggle('on',x.active);b.textContent=(x.active?'✓ ':'')+r.label}if(c)c.classList.toggle('show',x.active);['남','여'].forEach(g=>$(`relGender_${r.id}_${g}`)?.classList.toggle('on',x.gender===g))});saveState()}
  function bind(){ROLES.forEach(r=>{$('relBtn_'+r.id).onclick=()=>toggleRole(r.id);$('relName_'+r.id).addEventListener('input',e=>setField(r.id,'name',e.target.value));$('relBirth_'+r.id).addEventListener('change',e=>setField(r.id,'birthYear',e.target.value));['남','여'].forEach(g=>$(`relGender_${r.id}_${g}`).onclick=()=>setGender(r.id,g))});$('relDetail_related').addEventListener('input',e=>setField('related','detail',e.target.value))}

  function restore(){try{let d=JSON.parse(localStorage.getItem('wanjuFireReportV2')||'{}');if(d.relatedPersonsJson){let p=JSON.parse(d.relatedPersonsJson);ROLES.forEach(r=>{if(p?.[r.id])state[r.id]={...state[r.id],...p[r.id]}})}else if(d.owner){state.owner.active=true;state.owner.name=String(d.owner).replace(/\([^)]*\)/g,'').trim()}}catch(e){}}
  function installUI(){style();restore();let legacy=$('owner');if(!legacy||$('relationSection'))return;let label=legacy.closest('label');if(label)label.style.display='none';legacy.type='hidden';let hidden=document.createElement('input');hidden.type='hidden';hidden.id='relatedPersonsJson';let sec=document.createElement('div');sec.id='relationSection';sec.className='relWrap';sec.innerHTML=`<div class="relTitle">관계인 등</div><div class="relHint">필요한 항목만 선택하세요. 한글 보고서에는 성명·성별·출생연도까지 입력 완료한 사람만 표시됩니다.</div><div class="relBtns">${ROLES.map(r=>`<button type="button" id="relBtn_${r.id}" class="relBtn">${r.label}</button>`).join('')}</div><div class="relCards">${ROLES.map(card).join('')}</div><div id="relationSummaryView" class="relSummary">입력 완료된 관계인 없음</div>`;(label||legacy).insertAdjacentElement('afterend',hidden);hidden.insertAdjacentElement('afterend',sec);bind();render()}

  function patch(){
    try{const old=collect;collect=function(){let d=old(),list=ROLES.filter(r=>completed(r.id)).map(r=>({role:r.label,name:state[r.id].name.trim(),gender:state[r.id].gender,birthYear:state[r.id].birthYear,detail:state[r.id].detail||''}));d.relatedPersons=list;d.relatedPersonsText=summary();return d}}catch(e){}
    try{const old=buildReportPaper;buildReportPaper=function(){let paper=old(),text=summary();paper?.querySelectorAll('.reportLine').forEach(line=>{let t=line.textContent.trim();if(t.startsWith('라. 소 유 자:')||t.startsWith('라. 관계인 등:'))line.innerHTML='라. 관계인 등: '+esc(text||'해당없음')});return paper}}catch(e){}
    try{const old=reportPlainLinesExact;reportPlainLinesExact=function(){let text=summary();return old().map(line=>(line.includes('라. 소 유 자:')||line.includes('라. 관계인 등:'))?`  라. 관계인 등: ${text||'해당없음'}`:line)};reportPlainLines=reportPlainLinesExact}catch(e){}
    try{const old=exactPatchSection;exactPatchSection=function(xml){let out=old(xml),doc=new DOMParser().parseFromString(out,'application/xml'),ps=exactHwpxParas(doc),text=summary();if(ps[24])exactSetWhole(ps[24],`  라. 관계인 등: ${text||'해당없음'}`);return new XMLSerializer().serializeToString(doc)}}catch(e){}
  }

  function install(){installUI();patch();let h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.8';document.title='완주소방서 화재상황보고 V3.8'}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,80));else setTimeout(install,80);
})();
