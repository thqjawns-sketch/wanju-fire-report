/* Wanju Fire Report V3.7 - 관계인 등 복수 입력 */
(function(){
  'use strict';
  const ROLES=[
    {id:'owner',label:'소유자'},
    {id:'occupant',label:'점유자'},
    {id:'related',label:'관계인'}
  ];
  let state={
    owner:{active:false,name:'',gender:'',birthYear:'',detail:''},
    occupant:{active:false,name:'',gender:'',birthYear:'',detail:''},
    related:{active:false,name:'',gender:'',birthYear:'',detail:''}
  };
  const byId=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function injectStyle(){
    if(byId('relationStyle'))return;
    const st=document.createElement('style');st.id='relationStyle';st.textContent=`
      .relationSection{margin:14px 0 6px}.relationTitle{font-weight:900;font-size:15px;margin:0 0 7px}.relationHint{font-size:12px;color:#667085;margin:0 0 8px}
      .relationButtons{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.relationRoleBtn{height:44px;border:1px solid #cfd4dc;border-radius:10px;background:#fff;font-weight:900;font-size:14px;color:#344054}.relationRoleBtn.on{background:#eef2ff;border-color:#4f46e5;color:#3730a3;box-shadow:inset 0 0 0 1px #4f46e5}
      .relationCards{display:grid;gap:9px;margin-top:9px}.relationCard{display:none;border:1px solid #d9dde5;border-radius:12px;background:#f8fafc;padding:11px}.relationCard.show{display:block}.relationCardHead{display:flex;justify-content:space-between;align-items:center;font-weight:900;margin-bottom:9px}.relationGrid{display:grid;grid-template-columns:1.25fr .75fr .9fr;gap:8px}.relationGrid label{margin:0}.relationGender{display:grid;grid-template-columns:1fr 1fr;gap:6px}.relationGender button{height:42px;border:1px solid #cfd4dc;border-radius:9px;background:#fff;font-weight:900}.relationGender button.on{background:#111827;color:#fff;border-color:#111827}.relationDetail{margin-top:8px}.relationSummary{margin-top:9px;padding:9px 10px;border-radius:9px;background:#fff7ed;color:#9a3412;font-size:13px;font-weight:800;line-height:1.5}
      @media(max-width:620px){.relationGrid{grid-template-columns:1fr 1fr}.relationGrid .nameField{grid-column:1/-1}}
    `;document.head.appendChild(st);
  }

  function birthOptions(selected){
    const now=new Date().getFullYear();let out='<option value="">출생연도 선택</option>';
    for(let y=now;y>=1900;y--)out+=`<option value="${y}" ${String(y)===String(selected)?'selected':''}>${y}년</option>`;
    return out;
  }
  function personText(role,includeRole=true){
    const x=state[role];if(!x?.active)return '';
    const def=ROLES.find(r=>r.id===role),roleLabel=role==='related'&&x.detail.trim()?`${def.label}(${x.detail.trim()})`:def.label;
    const info=[x.gender,x.birthYear?`${x.birthYear}년생`:''].filter(Boolean).join(', ');
    const body=[x.name.trim()||'성명 미입력',info?`(${info})`:''].join('');
    return includeRole?`${roleLabel} ${body}`:body;
  }
  function relationSummary(){return ROLES.map(r=>personText(r.id,true)).filter(Boolean).join(' / ')}
  window.relationSummary=relationSummary;

  function syncHidden(){
    const h=byId('relatedPersonsJson');if(h)h.value=JSON.stringify(state);
    const legacy=byId('owner');if(legacy)legacy.value=personText('owner',false).replace('성명 미입력','');
    const s=byId('relationSummaryView');if(s)s.textContent=relationSummary()||'선택된 관계인 없음';
  }
  function updateField(role,key,value){state[role][key]=value;syncHidden()}
  function setGender(role,g){state[role].gender=g;render();syncHidden()}
  function toggleRole(role){state[role].active=!state[role].active;render();syncHidden()}

  function render(){
    ROLES.forEach(r=>{
      const b=byId('relBtn_'+r.id),card=byId('relCard_'+r.id),x=state[r.id];
      if(b){b.classList.toggle('on',x.active);b.textContent=(x.active?'✓ ':'')+(r.id==='related'?'관계인':r.label)}
      if(card)card.classList.toggle('show',x.active);
      ['남','여'].forEach(g=>byId(`relGender_${r.id}_${g}`)?.classList.toggle('on',x.gender===g));
    });
    syncHidden();
  }

  function cardHtml(r){
    const x=state[r.id];return `<div id="relCard_${r.id}" class="relationCard"><div class="relationCardHead"><span>${r.label}</span><span style="font-size:12px;color:#667085">선택 중</span></div><div class="relationGrid"><label class="nameField">성명<input id="relName_${r.id}" value="${esc(x.name)}" placeholder="성명 직접입력"></label><label>성별<div class="relationGender"><button type="button" id="relGender_${r.id}_남">남</button><button type="button" id="relGender_${r.id}_여">여</button></div></label><label>출생연도<select id="relBirth_${r.id}">${birthOptions(x.birthYear)}</select></label></div>${r.id==='related'?`<label class="relationDetail">관계 구분(직접입력)<input id="relDetail_related" value="${esc(x.detail)}" placeholder="예: 신고자 / 직원 / 자녀 / 가족"></label>`:''}</div>`
  }

  function bind(){
    ROLES.forEach(r=>{
      byId('relBtn_'+r.id).onclick=()=>toggleRole(r.id);
      byId('relName_'+r.id).addEventListener('input',e=>updateField(r.id,'name',e.target.value));
      byId('relBirth_'+r.id).addEventListener('change',e=>updateField(r.id,'birthYear',e.target.value));
      ['남','여'].forEach(g=>byId(`relGender_${r.id}_${g}`).onclick=()=>setGender(r.id,g));
    });
    byId('relDetail_related').addEventListener('input',e=>updateField('related','detail',e.target.value));
  }

  function restoreState(){
    try{
      const saved=JSON.parse(localStorage.getItem('wanjuFireReportV2')||'{}');
      if(saved.relatedPersonsJson){const p=JSON.parse(saved.relatedPersonsJson);ROLES.forEach(r=>{if(p?.[r.id])state[r.id]={...state[r.id],...p[r.id]}})}
      else if(saved.owner){state.owner.active=true;state.owner.name=String(saved.owner).replace(/\([^)]*\)/g,'').trim()}
    }catch(e){}
    const legacy=byId('owner');if(legacy?.value&&!state.owner.name){state.owner.active=true;state.owner.name=legacy.value.replace(/\([^)]*\)/g,'').trim()}
  }

  function installUI(){
    injectStyle();restoreState();
    const legacy=byId('owner');if(!legacy||byId('relationSection'))return;
    const label=legacy.closest('label');if(label)label.style.display='none';legacy.type='hidden';
    const hidden=document.createElement('input');hidden.type='hidden';hidden.id='relatedPersonsJson';
    const sec=document.createElement('div');sec.id='relationSection';sec.className='relationSection';sec.innerHTML=`<div class="relationTitle">관계인 등</div><div class="relationHint">소유자·점유자·관계인을 1개, 2개 또는 3개 모두 선택할 수 있습니다.</div><div class="relationButtons">${ROLES.map(r=>`<button type="button" id="relBtn_${r.id}" class="relationRoleBtn">${r.label}</button>`).join('')}</div><div class="relationCards">${ROLES.map(cardHtml).join('')}</div><div id="relationSummaryView" class="relationSummary">선택된 관계인 없음</div>`;
    (label||legacy).insertAdjacentElement('afterend',hidden);hidden.insertAdjacentElement('afterend',sec);bind();render();
  }

  function patchDataAndReports(){
    try{
      const oldCollect=collect;
      collect=function(){const d=oldCollect();d.relatedPersons=ROLES.filter(r=>state[r.id].active).map(r=>({role:r.label,name:state[r.id].name,gender:state[r.id].gender,birthYear:state[r.id].birthYear,detail:state[r.id].detail}));d.relatedPersonsText=relationSummary();return d};
    }catch(e){}
    try{
      const oldBuild=buildReportPaper;
      buildReportPaper=function(){const paper=oldBuild();paper?.querySelectorAll('.reportLine').forEach(line=>{if(line.textContent.trim().startsWith('라. 소 유 자:'))line.innerHTML='라. 관계인 등: '+esc(relationSummary()||'해당없음')});return paper};
    }catch(e){}
    try{
      const oldPlain=reportPlainLinesExact;
      reportPlainLinesExact=function(){return oldPlain().map(line=>line.includes('라. 소 유 자:')?`  라. 관계인 등: ${relationSummary()||'해당없음'}`:line)};
      reportPlainLines=reportPlainLinesExact;
    }catch(e){}
    try{
      const oldPatch=exactPatchSection;
      exactPatchSection=function(xml){const out=oldPatch(xml),doc=new DOMParser().parseFromString(out,'application/xml'),ps=exactHwpxParas(doc);if(ps[24])exactSetWhole(ps[24],`  라. 관계인 등: ${relationSummary()||'해당없음'}`);return new XMLSerializer().serializeToString(doc)};
    }catch(e){}
  }

  function install(){installUI();patchDataAndReports();const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.7';document.title='완주소방서 화재상황보고 V3.7'}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,60));else setTimeout(install,60);
})();
