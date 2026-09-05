// V3.2 exact HWPX template export: uses the actual Wanju HQ report HWPX frame.
const EXACT_HWPX_TEMPLATE_B64=(window.EXACT_HWPX_CHUNKS||[]).join('');
const HWPX_P_NS='http://www.hancom.co.kr/hwpml/2011/paragraph';
function exactHwpxParas(doc){return Array.from(doc.getElementsByTagNameNS(HWPX_P_NS,'p'))}
function exactHwpxTexts(p){return Array.from(p.getElementsByTagNameNS(HWPX_P_NS,'t'))}
function exactSetWhole(p,text){let ts=exactHwpxTexts(p);if(!ts.length)return;ts[0].textContent=text??'';for(let i=1;i<ts.length;i++)ts[i].textContent=''}
function exactSetLast(p,text){let ts=exactHwpxTexts(p);if(!ts.length)return;ts[ts.length-1].textContent=text??''}
function exactEndText(){if(v('status')==='화재진압 중')return '화재진압 중';let label=v('status')==='화재완진'?'완진':v('status');return `${v('end')||'-'}(${label})`}
endText=exactEndText;
const __collectV31=collect;
collect=function(){let d=__collectV31();d.owner=v('owner');d.fireWater=v('fireWater')||'미사용';return d};
function exactDamageLines(){let total=n('real')+n('move'),out=[];if(v('propertyDamage')!=='피해 있음'){out.push('  나. 재산피해: 피해 없음','','');return out}out.push(`  나. 재산피해: ${total.toLocaleString('ko-KR')}천원(부동산 ${n('real').toLocaleString('ko-KR')}천원, 동산 ${n('move').toLocaleString('ko-KR')}천원)`);out.push(v('realDetail')?`      ○ 부동산: ${v('realDetail')}`:'');out.push(v('moveDetail')?`      ○ 동  산: ${v('moveDetail')}`:'');return out}
function exactPeopleLine(){let people=n('pFire')+n('pPolice')+n('pAgency')+n('pVolunteer')+n('pOtherN');return `  가. 인 원: ${people}명(${peopleDetail()||'해당없음'})`}
function exactVehicleLine(){return `  나. 장 비:  ${n('vehicleN')}대(${v('vehicles')||'해당없음'})`}
function exactInsuranceLine(){return `  ○ 보험: ${v('insurance')}${v('insuranceDetail')?' - '+v('insuranceDetail'):''}`}
function reportPlainLinesExact(){updateDamageCalc();syncActionsText();let damage=exactDamageLines(),acts=timeline();let lines=['대외유출주의','화재 등 사고상황보고서','수신: 전북특별도지사','참조: 119종합상황실장','발신: 완주소방서장',`보 고 일 시: ${reportNow()}`,`작  성  자: ${v('writer')||'-'}`,`보고책임자: ${v('boss')||'-'}`,'발신지: 완주소방서 현장대응단','관할소방서: 완주소방서',`접수시간: ${v('recv')||'-'}`,`제목: ${reportTitleText()}`,'1. 발생개요',`  가. 일    시: ${incidentDateText()} ${v('recv')}(접수) ~ ${exactEndText()}`,`     ※ 선착대 ${v('first')||'-'} ${v('firstKm')||'-'}km, 본서 ${v('hqKm')||'-'}km`,`  나. 장    소: ${address()||'-'}`,`  다. 대    상: ${v('target')||'-'}`,`   ※ ${v('structure')||'-'}`,`  라. 소 유 자: ${v('owner')||''}`,`  마. 원    인: ${v('cause')||'조사 중'}`,`  바. 사고개요: ${v('summary')||'사고개요 입력 없음'}`,'2. 피해상황',`  가. 인명피해: ${v('human')==='있음'?(v('humanDetail')||'있음'):'피해 없음'}`,...damage,'3. 동원상황',exactPeopleLine(),exactVehicleLine(),`  다. 소방용수: ${v('fireWater')||'미사용'}`,'4. 조치사항'];if(acts.length)acts.forEach(a=>lines.push(`  ○ ${(a.time?a.time+' ':'')+a.text}`));else lines.push('  ○ 조치사항 입력 없음');lines.push('5. 그 밖의 사항',exactInsuranceLine());if(v('special'))v('special').split('\n').forEach(x=>lines.push('  ○ '+x));return lines}
reportPlainLines=reportPlainLinesExact;
buildReportPaper=function(){updateDamageCalc();syncActionsText();let people=n('pFire')+n('pPolice')+n('pAgency')+n('pVolunteer')+n('pOtherN');let human=v('human')==='있음'?(v('humanDetail')||'있음'):'피해 없음';let total=n('real')+n('move');let prop=v('propertyDamage')==='피해 있음'?`<div class="reportLine">나. 재산피해: ${total.toLocaleString('ko-KR')}천원(부동산 ${n('real').toLocaleString('ko-KR')}천원, 동산 ${n('move').toLocaleString('ko-KR')}천원)</div>${v('realDetail')?`<div class="reportSub">○ 부동산: ${hEsc(v('realDetail'))}</div>`:''}${v('moveDetail')?`<div class="reportSub">○ 동&nbsp;&nbsp;산: ${hEsc(v('moveDetail'))}</div>`:''}`:'<div class="reportLine">나. 재산피해: 피해 없음</div>';let ins=v('insurance')+(v('insuranceDetail')?' - '+v('insuranceDetail'):'');$('reportPaper').innerHTML=`<div class="reportSecurity">대외유출주의</div><div class="reportDocTitle">화재 등 사고상황보고서</div><table class="reportTop"><tr><td><b>수신:</b> 전북특별도지사<br><b>참조:</b> 119종합상황실장<br><b>발신:</b> 완주소방서장</td><td><b>보 고 일 시:</b> ${hEsc(reportNow())}<br><b>작&nbsp;&nbsp;성&nbsp;&nbsp;자:</b> ${hEsc(v('writer')||'-')}<br><b>보고책임자:</b> ${hEsc(v('boss')||'-')}</td></tr></table><table class="reportMeta"><tr><th>발신지</th><td>완주소방서 현장대응단</td><th>관할소방서</th><td>완주소방서</td><th>접수시간</th><td>${hEsc(v('recv')||'-')}</td></tr><tr><th>제목</th><td colspan="5" class="titleCell">${hEsc(reportTitleText())}</td></tr></table><div class="reportBody"><div class="reportSec">1. 발생개요</div><div class="reportLine">가. 일&nbsp;&nbsp;&nbsp;&nbsp;시: ${hEsc(incidentDateText())} ${hEsc(v('recv'))}(접수) ~ ${hEsc(exactEndText())}</div><div class="reportSub">※ 선착대 ${hEsc(v('first')||'-')} ${hEsc(v('firstKm')||'-')}km, 본서 ${hEsc(v('hqKm')||'-')}km</div><div class="reportLine">나. 장&nbsp;&nbsp;&nbsp;&nbsp;소: ${hEsc(address()||'-')}</div><div class="reportLine">다. 대&nbsp;&nbsp;&nbsp;&nbsp;상: ${hEsc(v('target')||'-')}</div><div class="reportSub">※ ${hEsc(v('structure')||'-')}</div><div class="reportLine">라. 소 유 자: ${hEsc(v('owner')||'')}</div><div class="reportLine">마. 원&nbsp;&nbsp;&nbsp;&nbsp;인: ${hEsc(v('cause')||'조사 중')}</div><div class="reportLine">바. 사고개요: ${hEsc(v('summary')||'사고개요 입력 없음').replace(/\n/g,'<br>')}</div><div class="reportSec">2. 피해상황</div><div class="reportLine">가. 인명피해: ${hEsc(human)}</div>${prop}<div class="reportSec">3. 동원상황</div><div class="reportLine">가. 인 원: ${people}명(${hEsc(peopleDetail()||'해당없음')})</div><div class="reportLine">나. 장 비: ${n('vehicleN')}대(${hEsc(v('vehicles')||'해당없음')})</div><div class="reportLine">다. 소방용수: ${hEsc(v('fireWater')||'미사용')}</div><div class="reportSec">4. 조치사항</div>${actionReportHtml()}<div class="reportSec">5. 그 밖의 사항</div><div class="reportAction">○ 보험: ${hEsc(ins||'미가입')}</div>${v('special')?`<div class="reportAction">○ ${hEsc(v('special')).replace(/\n/g,'<br>')}</div>`:''}</div>`;return $('reportPaper')};
async function exactLoadTemplate(){return JSZip.loadAsync(EXACT_HWPX_TEMPLATE_B64,{base64:true})}
function exactPatchSection(xml){let doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('원본 HWPX 본문을 읽지 못했습니다.');let ps=exactHwpxParas(doc);if(ps.length<49)throw Error('원본 HWPX 양식 구조가 예상과 다릅니다.');exactSetWhole(ps[4],'수신: 전북특별도지사');exactSetWhole(ps[5],'참조: 119종합상황실장');exactSetWhole(ps[6],'발신: 완주소방서장');exactSetLast(ps[7],`: ${reportNow()}`);exactSetWhole(ps[8],`작  성  자: ${v('writer')||'-'}`);exactSetWhole(ps[9],`보고책임자: ${v('boss')||'-'}`);exactSetWhole(ps[15],v('recv')||'-');exactSetWhole(ps[17],` ${reportTitleText()}`);exactSetWhole(ps[19],`  가. 일    시: ${incidentDateText()} ${v('recv')}(접수) ~ ${exactEndText()}`);let t20=exactHwpxTexts(ps[20]);if(t20.length>=3)t20[2].textContent=`선착대 ${v('first')||'-'} ${v('firstKm')||'-'}km, 본서 ${v('hqKm')||'-'}km`;else exactSetWhole(ps[20],`     ※ 선착대 ${v('first')||'-'} ${v('firstKm')||'-'}km, 본서 ${v('hqKm')||'-'}km`);exactSetWhole(ps[21],`  나. 장    소: ${address()||'-'}`);let t22=exactHwpxTexts(ps[22]);if(t22.length>=2)t22[t22.length-1].textContent=` ${v('target')||'-'}`;else exactSetWhole(ps[22],`  다. 대    상: ${v('target')||'-'}`);let t23=exactHwpxTexts(ps[23]);if(t23.length>=2)t23[t23.length-1].textContent=`※ ${v('structure')||'-'}`;else exactSetWhole(ps[23],`   ※ ${v('structure')||'-'}`);exactSetWhole(ps[24],`  라. 소 유 자: ${v('owner')||''}`);exactSetWhole(ps[25],`  마. 원    인: ${v('cause')||'조사 중'}`);let t26=exactHwpxTexts(ps[26]);if(t26.length>=3)t26[t26.length-1].textContent=v('summary')||'사고개요 입력 없음';else exactSetWhole(ps[26],`  바.사고개요:${v('summary')||'사고개요 입력 없음'}`);let damage=exactDamageLines();exactSetWhole(ps[29],`  가. 인명피해: ${v('human')==='있음'?(v('humanDetail')||'있음'):'피해 없음'}`);exactSetWhole(ps[30],damage[0]);exactSetWhole(ps[31],damage[1]);exactSetWhole(ps[32],damage[2]);exactSetWhole(ps[35],exactPeopleLine());exactSetWhole(ps[36],exactVehicleLine());exactSetWhole(ps[37],`  다. 소방용수: ${v('fireWater')||'미사용'}`);let acts=timeline(),baseActions=ps.slice(40,46),section5=ps[47];for(let i=0;i<baseActions.length;i++)exactSetWhole(baseActions[i],acts[i]?`  ○ ${(acts[i].time?acts[i].time+' ':'')+acts[i].text}`:'');if(acts.length>baseActions.length){let parent=section5.parentNode,model=baseActions[baseActions.length-1];for(let i=baseActions.length;i<acts.length;i++){let clone=model.cloneNode(true);exactSetWhole(clone,`  ○ ${(acts[i].time?acts[i].time+' ':'')+acts[i].text}`);parent.insertBefore(clone,section5)}}exactSetWhole(ps[48],exactInsuranceLine());return new XMLSerializer().serializeToString(doc)}
saveReportHwpx=async function(){try{buildReportPaper();if(!window.JSZip)throw Error('한글 저장 모듈을 불러오지 못했습니다.');$('reportExportStatus').textContent='실제 본부 원본양식에 내용 넣는 중...';let zip=await exactLoadTemplate(),sf=zip.file('Contents/section0.xml');if(!sf)throw Error('원본 HWPX 본문이 없습니다.');let section=exactPatchSection(await sf.async('string'));zip.file('Contents/section0.xml',section);let lines=reportPlainLinesExact();zip.file('Preview/PrvText.txt',lines.join('\n'));let hpf=zip.file('Contents/content.hpf');if(hpf){let txt=await hpf.async('string');txt=txt.replace(/<opf:title>[\s\S]*?<\/opf:title>/,`<opf:title>${xmlEsc(reportTitleText())}</opf:title>`).replace(/<dc:title>[\s\S]*?<\/dc:title>/,`<dc:title>${xmlEsc(reportTitleText())}</dc:title>`);zip.file('Contents/content.hpf',txt)}zip.file('mimetype','application/hwp+zip',{compression:'STORE'});let blob=await zip.generateAsync({type:'blob',mimeType:'application/hwp+zip',compression:'DEFLATE',compressionOptions:{level:6}});downloadBlob(blob,reportFileBase()+'.hwpx');$('reportExportStatus').textContent='✓ 실제 원본 양식 그대로 HWPX 저장 완료'}catch(e){console.error(e);$('reportExportStatus').textContent='한글 저장 실패: '+e.message}};

// V3.5 time rules: receipt/dispatch include seconds, all other operational times use HH:MM.
function normalizeSecondTime(x){
  x=String(x||'').trim();
  if(!x)return '';
  let m=x.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if(!m)return x;
  let hh=Math.min(23,Math.max(0,Number(m[1]))),mm=Math.min(59,Math.max(0,Number(m[2]))),ss=Math.min(59,Math.max(0,Number(m[3]||0)));
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}
function normalizeMinuteTime(x){
  x=String(x||'').trim();
  if(!x)return '';
  let m=x.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if(!m)return x;
  let hh=Math.min(23,Math.max(0,Number(m[1]))),mm=Math.min(59,Math.max(0,Number(m[2])));
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function currentSecondTime(){let d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`}
function currentMinuteTime(){let d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
exactEndText=function(){if(v('status')==='화재진압 중')return '화재진압 중';let label=v('status')==='화재완진'?'완진':v('status');return `${normalizeMinuteTime(v('end'))||'-'}(${label})`};
endText=exactEndText;
reportNow=function(){let d=new Date(),w=['일','월','화','수','목','금','토'];return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.(${w[d.getDay()]}) ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
previousActionTime=function(){for(let i=actionState.length-1;i>=0;i--){if(actionState[i].time)return normalizeMinuteTime(actionState[i].time)}return normalizeMinuteTime(v('recv')||'')};
timeline=function(){return actionState.filter(x=>(x.text||'').trim()).map(x=>({time:x.type==='dispatch'?normalizeSecondTime(v('recv')||x.time):normalizeMinuteTime(x.time),text:x.text.trim()}))};
function updateReceipt24View(){let e=$('recv24View');if(e)e.textContent='24시간 표기: '+(normalizeSecondTime(v('recv'))||'00:00:00')}
function syncDispatchFromReceipt(redraw=true){let t=normalizeSecondTime(v('recv'));actionState.forEach(a=>{if(a.type==='dispatch')a.time=t});if(redraw)renderActionRows();else syncActionsText()}
function setReceiptNow(){vset('recv',currentSecondTime());updateReceipt24View();syncDispatchFromReceipt(true)}
renderActionRows=function(){
  let box=$('actionRows');if(!box)return;box.innerHTML='';
  actionState.forEach((a,i)=>{
    let isDispatch=a.type==='dispatch';
    a.time=isDispatch?normalizeSecondTime(v('recv')||a.time):normalizeMinuteTime(a.time);
    let row=document.createElement('div');row.className='actionRow';
    let line=document.createElement('div');line.className='actionLine';
    let tm=document.createElement('input');tm.id='actionTime_'+i;tm.className='actionTime';tm.type='time';tm.lang='en-GB';tm.step=isDispatch?'1':'60';tm.value=a.time||'';
    if(isDispatch){tm.readOnly=true;tm.title='접수시간과 자동으로 동일하게 적용됩니다.';tm.style.background='#f3f4f6';tm.style.fontWeight='800'}
    else{tm.title='모바일 기본 시간 선택기 · 시:분';tm.onchange=e=>{actionState[i].time=normalizeMinuteTime(e.target.value);e.target.value=actionState[i].time;syncActionsText()}}
    let tx=document.createElement('input');tx.id='actionText_'+i;tx.className='actionText';tx.value=a.text||'';tx.placeholder='조치내용';tx.oninput=e=>updateActionText(i,e.target.value);
    let del=document.createElement('button');del.type='button';del.className='actionDel';del.textContent='삭제';del.onclick=()=>deleteAction(i);
    line.append(tm,tx,del);row.append(line);box.appendChild(row);
  });
  updateActionButtonState();syncActionsText();
};
function applyV35TimeRules(){
  let recv=$('recv'),end=$('end');
  if(recv){
    recv.type='time';recv.step='1';recv.lang='en-GB';recv.removeAttribute('readonly');recv.classList.remove('readonly');
    if(recv.value)recv.value=normalizeSecondTime(recv.value);
    recv.addEventListener('focus',()=>{if(!v('recv'))setReceiptNow()});
    recv.addEventListener('change',()=>{if(v('recv'))vset('recv',normalizeSecondTime(v('recv')));updateReceipt24View();syncDispatchFromReceipt(true)});
    if(!$('recvNowBtn')){
      let btn=document.createElement('button');btn.type='button';btn.id='recvNowBtn';btn.textContent='현재시간 입력';btn.className='btn blue';btn.style.marginTop='6px';btn.style.width='100%';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setReceiptNow()});recv.insertAdjacentElement('afterend',btn);
      let view=document.createElement('div');view.id='recv24View';view.className='hint';view.style.marginTop='5px';btn.insertAdjacentElement('afterend',view);
    }
    updateReceipt24View();
  }
  if(end){end.type='time';end.step='60';end.lang='en-GB';end.removeAttribute('readonly');end.classList.remove('readonly');if(end.value)end.value=normalizeMinuteTime(end.value);end.addEventListener('change',()=>{if(v('end'))vset('end',normalizeMinuteTime(v('end')))})}
  let help=document.querySelector('.actionHelp');if(help)help.textContent='접수·출동지령은 초까지(HH:MM:SS), 그 밖의 조치시간은 분까지(HH:MM) 표시합니다.';
  let h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.5';document.title='완주소방서 화재상황보고 V3.5';
  syncDispatchFromReceipt(false);renderActionRows();
}
applyV35TimeRules();