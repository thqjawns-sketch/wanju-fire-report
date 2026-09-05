/* Wanju Fire Report V3.8 - 한글/미리보기에는 실제 입력 완료한 관계인만 출력 */
(function(){
  'use strict';
  const ROLES=[['owner','소유자'],['occupant','점유자'],['related','관계인']];
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function state(){
    try{return JSON.parse($('relatedPersonsJson')?.value||'{}')||{}}catch(e){return {}}
  }
  function completed(){
    const s=state();
    return ROLES.map(([id,label])=>({id,label,...(s[id]||{})})).filter(x=>x.active&&String(x.name||'').trim()&&x.gender&&x.birthYear);
  }
  function summary(){
    return completed().map(x=>{
      const role=x.id==='related'&&String(x.detail||'').trim()?`${x.label}(${String(x.detail).trim()})`:x.label;
      return `${role} ${String(x.name).trim()}(${x.gender}, ${x.birthYear}년생)`;
    }).join(' / ');
  }
  window.relationSummaryCompleted=summary;

  function refreshView(){
    const v=$('relationSummaryView');
    if(v)v.textContent=summary()||'입력 완료된 관계인 없음';
  }

  function patch(){
    try{
      const oldCollect=collect;
      collect=function(){
        const d=oldCollect(),list=completed();
        d.relatedPersons=list.map(x=>({role:x.label,name:x.name,gender:x.gender,birthYear:x.birthYear,detail:x.detail||''}));
        d.relatedPersonsText=summary();
        return d;
      };
    }catch(e){}

    try{
      const oldBuild=buildReportPaper;
      buildReportPaper=function(){
        const paper=oldBuild(),text=summary();
        paper?.querySelectorAll('.reportLine').forEach(line=>{
          if(line.textContent.trim().startsWith('라. 관계인 등:')||line.textContent.trim().startsWith('라. 소 유 자:')){
            line.innerHTML='라. 관계인 등: '+esc(text||'해당없음');
          }
        });
        return paper;
      };
    }catch(e){}

    try{
      const oldPlain=reportPlainLinesExact;
      reportPlainLinesExact=function(){
        const text=summary();
        return oldPlain().map(line=>(line.includes('라. 관계인 등:')||line.includes('라. 소 유 자:'))?`  라. 관계인 등: ${text||'해당없음'}`:line);
      };
      reportPlainLines=reportPlainLinesExact;
    }catch(e){}

    try{
      const oldPatch=exactPatchSection;
      exactPatchSection=function(xml){
        const out=oldPatch(xml),doc=new DOMParser().parseFromString(out,'application/xml'),ps=exactHwpxParas(doc),text=summary();
        if(ps[24])exactSetWhole(ps[24],`  라. 관계인 등: ${text||'해당없음'}`);
        return new XMLSerializer().serializeToString(doc);
      };
    }catch(e){}

    document.addEventListener('input',()=>setTimeout(refreshView,0));
    document.addEventListener('change',()=>setTimeout(refreshView,0));
    document.addEventListener('click',()=>setTimeout(refreshView,0));
    refreshView();
    const h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.8';
    document.title='완주소방서 화재상황보고 V3.8';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,150));else setTimeout(patch,150);
})();
