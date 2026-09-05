function fixedHwpxP(text,id,charPr=0,paraPr=0){if(text==='')return `<hp:p id="${id}" paraPrIDRef="${paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${charPr}"><hp:t/></hp:run></hp:p>`;return `<hp:p id="${id}" paraPrIDRef="${paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${charPr}"><hp:t>${xmlEsc(text)}</hp:t></hp:run></hp:p>`}
function fixedHwpxRichP(parts,id,paraPr=0){return `<hp:p id="${id}" paraPrIDRef="${paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">${parts.map(x=>`<hp:run charPrIDRef="${x.bold?8:0}"><hp:t>${xmlEsc(x.text)}</hp:t></hp:run>`).join('')}</hp:p>`}
function fixedHwpxBorder(header){let blocks=[...header.matchAll(/<hh:borderFill id="(\d+)"[\s\S]*?<\/hh:borderFill>/g)],max=blocks.reduce((a,m)=>Math.max(a,Number(m[1])||0),0),id=String(max+1),block=`<hh:borderFill id="${id}" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0"><hh:slash type="NONE" Crooked="0" isCounter="0"/><hh:backSlash type="NONE" Crooked="0" isCounter="0"/><hh:leftBorder type="SOLID" width="0.12 mm" color="#000000"/><hh:rightBorder type="SOLID" width="0.12 mm" color="#000000"/><hh:topBorder type="SOLID" width="0.12 mm" color="#000000"/><hh:bottomBorder type="SOLID" width="0.12 mm" color="#000000"/><hh:diagonal type="NONE" width="0.1 mm" color="#000000"/><hh:fillBrush><hc:winBrush faceColor="#FFFFFF" hatchColor="#999999" alpha="0"/></hh:fillBrush></hh:borderFill>`;let hit=false;header=header.replace(/<hh:borderFills itemCnt="(\d+)">/,(_,n)=>{hit=true;return `<hh:borderFills itemCnt="${Number(n)+1}">`});if(!hit)throw Error('HWPX 테두리 서식 정보를 찾지 못했습니다.');header=header.replace('</hh:borderFills>',block+'</hh:borderFills>');return{header,id}}
function fixedHwpxCell(content,row,col,width,height,borderId,opt={}){let ps='',pid=opt.pid||2200000000;if(Array.isArray(content)){content.forEach((line,i)=>ps+=Array.isArray(line)?fixedHwpxRichP(line,pid+i,opt.paraPr||0):fixedHwpxP(line,pid+i,opt.bold?8:0,opt.paraPr||0))}else ps=fixedHwpxP(content,pid,opt.bold?8:0,opt.paraPr||0);return `<hp:tc name="" header="${opt.header?1:0}" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="${borderId}"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${ps}</hp:subList><hp:cellAddr colAddr="${col}" rowAddr="${row}"/><hp:cellSpan colSpan="${opt.colSpan||1}" rowSpan="${opt.rowSpan||1}"/><hp:cellSz width="${width}" height="${height}"/><hp:cellMargin left="250" right="250" top="120" bottom="120"/></hp:tc>`}
function fixedHwpxTable(rows,colCnt,width,height,borderId,tableId){let xml=`<hp:p id="${tableId+100}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:tbl id="${tableId}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="0" rowCnt="${rows.length}" colCnt="${colCnt}" cellSpacing="0" borderFillIDRef="${borderId}" noAdjust="0"><hp:sz width="${width}" widthRelTo="ABSOLUTE" height="${height}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="0" right="0" top="0" bottom="0"/>`;rows.forEach(r=>xml+='<hp:tr>'+r.join('')+'</hp:tr>');return xml+'</hp:tbl><hp:t/></hp:run></hp:p>'}
function fixedHwpxBody(borderId){let id=2300000000,out='';out+=fixedHwpxP('대외유출주의',id++,8,0);out+=fixedHwpxP('화재 등 사고상황보고서',id++,7,20);let topH=5600,half=21260,left=[[{text:'수신: ',bold:true},{text:'전북특별도지사'}],[{text:'참조: ',bold:true},{text:'119종합상황실장'}],[{text:'발신: ',bold:true},{text:'완주소방서장'}]],right=[[{text:'보고일시: ',bold:true},{text:reportNow()}],[{text:'작성자: ',bold:true},{text:v('writer')||'-'}],[{text:'보고책임자: ',bold:true},{text:v('boss')||'-'}]];out+=fixedHwpxTable([[fixedHwpxCell(left,0,0,half,topH,borderId,{pid:id}),fixedHwpxCell(right,0,1,half,topH,borderId,{pid:id+10})]],2,42520,topH,borderId,2400000001);id+=20;let w=[4200,10500,5000,8800,5000,9020],r0=[fixedHwpxCell('발신지',0,0,w[0],2800,borderId,{bold:true,pid:id++}),fixedHwpxCell('완주소방서 현장대응단',0,1,w[1],2800,borderId,{pid:id++}),fixedHwpxCell('관할소방서',0,2,w[2],2800,borderId,{bold:true,pid:id++}),fixedHwpxCell('완주소방서',0,3,w[3],2800,borderId,{pid:id++}),fixedHwpxCell('접수시간',0,4,w[4],2800,borderId,{bold:true,pid:id++}),fixedHwpxCell(v('recv')||'-',0,5,w[5],2800,borderId,{pid:id++})],r1=[fixedHwpxCell('제목',1,0,w[0],2800,borderId,{bold:true,pid:id++}),fixedHwpxCell(reportTitleText(),1,1,w.slice(1).reduce((a,b)=>a+b,0),2800,borderId,{colSpan:5,pid:id++})];out+=fixedHwpxTable([r0,r1],6,42520,5600,borderId,2400000002);out+=fixedHwpxP('',id++);let all=reportPlainLines(),idx=all.indexOf('1. 발생개요'),body=idx>=0?all.slice(idx):all;body.forEach(line=>out+=fixedHwpxP(line,id++,/^\d+\.\s/.test(line)?8:0,0));return out}
saveReportHwpx=async function(){try{buildReportPaper();if(!window.JSZip)throw Error('한글 저장 모듈을 불러오지 못했습니다.');$('reportExportStatus').textContent='한글(HWPX) 양식 만드는 중...';let r=await fetch('report-template.hwpx?v=20260903d',{cache:'no-store'});if(!r.ok)throw Error('HWPX 기본양식을 불러오지 못했습니다.');let zip=await JSZip.loadAsync(await r.arrayBuffer()),sf=zip.file('Contents/section0.xml'),hf=zip.file('Contents/header.xml');if(!sf||!hf)throw Error('HWPX 기본 문서 구성파일이 없습니다.');let base=await sf.async('string'),header=await hf.async('string'),end=base.indexOf('</hp:p>');if(end<0)throw Error('HWPX 구역 정보를 확인할 수 없습니다.');let b=fixedHwpxBorder(header);zip.file('Contents/header.xml',b.header);let prefix=base.slice(0,end+'</hp:p>'.length),section=prefix+'\n'+fixedHwpxBody(b.id)+'\n</hs:sec>';zip.file('Contents/section0.xml',section);let lines=reportPlainLines();zip.file('Preview/PrvText.txt',lines.join('\n'));zip.file('mimetype','application/hwp+zip',{compression:'STORE'});let hpf=zip.file('Contents/content.hpf');if(hpf){let txt=await hpf.async('string');txt=txt.replace(/<dc:title>[\s\S]*?<\/dc:title>/,`<dc:title>${xmlEsc(reportTitleText())}</dc:title>`);zip.file('Contents/content.hpf',txt)}let blob=await zip.generateAsync({type:'blob',mimeType:'application/hwp+zip',compression:'DEFLATE',compressionOptions:{level:6}});downloadBlob(blob,reportFileBase()+'.hwpx');$('reportExportStatus').textContent='✓ 한글(HWPX) 양식틀 포함 저장 완료'}catch(e){$('reportExportStatus').textContent='한글 저장 실패: '+e.message}}

// V3.6: saved reports stay in Google Sheet, but every page load starts a new blank report.
window.addEventListener('load',()=>{
  try{
    localStorage.removeItem('wanjuFireReportV1');
    localStorage.removeItem('wanjuFireReportV2');
    localStorage.removeItem('wanjuReportId');

    document.querySelectorAll('input,select,textarea').forEach(e=>{
      if(e.type==='checkbox'||e.type==='radio')e.checked=e.defaultChecked;
      else if(e.tagName==='SELECT')e.selectedIndex=0;
      else e.value=e.defaultValue||'';
    });

    if(typeof actionState!=='undefined')actionState=[];
    if(typeof vehicleCounts!=='undefined')vehicleCounts={};
    if(typeof otherVehicles!=='undefined')otherVehicles=[];

    if($('date'))$('date').value=new Date().toISOString().slice(0,10);
    vset('status','화재완진');
    vset('cause','조사 중');
    vset('human','피해 없음');
    vset('propertyDamage','피해 없음');
    vset('insurance','미가입');
    vset('fireWater','미사용');
    vset('buildingCount','1');
    vset('groundFloors','1');
    vset('underFloors','0');
    vset('structure','');
    vset('vehicleCountsJson','{}');
    vset('otherVehiclesJson','[]');
    vset('actionsJson','[]');
    vset('actions','');

    if(typeof riButtons==='function')riButtons();
    if(typeof renderVehicles==='function')renderVehicles();
    if(typeof renderActionRows==='function')renderActionRows();
    if(typeof setHuman==='function')setHuman(false);
    if(typeof setPropertyDamage==='function')setPropertyDamage(false);
    if(typeof syncDamageCards==='function')syncDamageCards();
    if(typeof updateDamageCalc==='function')updateDamageCalc();
    if(typeof updateReceipt24View==='function')updateReceipt24View();
    if(typeof hideReportOutput==='function')hideReportOutput();

    if($('saveStatus'))$('saveStatus').textContent='새 화재상황보고서 입력 준비';
    if($('reportExportStatus'))$('reportExportStatus').textContent='';
    if($('reportPaper'))$('reportPaper').innerHTML='';
    let h=document.querySelector('header h1');if(h)h.textContent='🔥 완주소방서 화재상황보고 V3.6';
    document.title='완주소방서 화재상황보고 V3.6';
  }catch(e){console.error('새 보고서 초기화 실패',e)}
});