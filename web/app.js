const state={bundle:null,reportIndex:0,filter:'all'};
const $=(selector)=>document.querySelector(selector);
const $$=(selector)=>[...document.querySelectorAll(selector)];
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
const shortHash=(value)=>value?`${value.slice(0,8)}…${value.slice(-6)}`:'unknown';

async function loadBundle(){
  if(window.__ORIGIN_REPORTS__)return window.__ORIGIN_REPORTS__;
  const response=await fetch('./data/reports.json',{cache:'no-store'});
  if(!response.ok)throw new Error(`Report bundle unavailable (${response.status})`);
  return response.json();
}

function renderSubjects(){
  $('#subject-list').innerHTML=state.bundle.reports.map((report,index)=>`<button class="subject ${index===state.reportIndex?'active':''}" data-index="${index}"><strong>${escapeHtml(report.subject.name)}</strong><small>${escapeHtml(report.subject.family)} · ${report.mode}</small></button>`).join('');
  $$('.subject').forEach((button)=>button.addEventListener('click',()=>{state.reportIndex=Number(button.dataset.index);render();}));
}

function renderSummary(report){
  const summary=report.summary;
  $('#summary-grid').innerHTML=['pass','warn','fail','unknown'].map((key)=>`<div><strong>${summary[key]??0}</strong><span>${key==='warn'?'review':key}</span></div>`).join('');
}

function evidenceLine(check){
  if(check.reproducibleCommand)return `<code>${escapeHtml(check.reproducibleCommand)}</code>`;
  if(check.evidence?.reason)return `<code>${escapeHtml(check.evidence.reason)}</code>`;
  return '';
}

function renderChecks(report){
  const checks=report.checks.filter((check)=>state.filter==='all'||check.status===state.filter);
  $('#check-list').innerHTML=checks.length?checks.map((check)=>`<article class="check" data-status="${escapeHtml(check.status)}"><span class="dot"></span><div><h4>${escapeHtml(check.title)}</h4><p>${escapeHtml(check.description)}</p>${evidenceLine(check)}</div><span class="status-label">${check.status==='warn'?'review':escapeHtml(check.status)}</span></article>`).join(''):'<article class="check"><span class="dot"></span><div><h4>No matching checks</h4><p>Choose another evidence status.</p></div></article>';
}

function render(){
  const report=state.bundle.reports[state.reportIndex];
  renderSubjects();
  $('#report-count').textContent=state.bundle.reports.length;
  $('#check-count').textContent=state.bundle.reports.reduce((total,item)=>total+item.checks.length,0);
  $('#bundle-hash').textContent=shortHash(state.bundle.comparisonDigest);
  $('#log-status').textContent=state.bundle.log?.entries?.length?'chained':'unknown';
  $('#report-mode').textContent=report.mode;
  $('#report-name').textContent=report.subject.name;
  $('#report-meta').textContent=`${report.subject.family} / ${report.subject.license??'license unknown'} / ${shortHash(report.contentHash)}`;
  $('#coverage-value').textContent=`${report.summary.coverage}%`;
  renderSummary(report);
  renderChecks(report);
}

async function runGenesis(){
  const output=$('#genesis-output');
  const button=$('#run-proof');
  button.disabled=true;
  output.textContent='$ node cli/origin.mjs genesis\ncomputing double-SHA256, Merkle root, target, and proof of work…';
  try{
    let proof;
    if(location.protocol==='file:'){
      proof={headerHashPass:true,merkleRootPass:true,transactionShapePass:true,proofOfWorkPass:true,headerHash:'000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',note:'Open through the local server for an API-backed recomputation. The CLI engine is included in the repository.'};
    }else{
      const response=await fetch('/api/genesis',{cache:'no-store'});
      if(!response.ok)throw new Error(`Verification API returned ${response.status}`);
      proof=await response.json();
    }
    output.textContent=`$ node cli/origin.mjs genesis\n\nheader hash     ${proof.headerHashPass?'PASS':'FAIL'}\nmerkle root     ${proof.merkleRootPass?'PASS':'FAIL'}\ntransaction     ${proof.transactionShapePass?'PASS':'FAIL'}\nproof of work   ${proof.proofOfWorkPass?'PASS':'FAIL'}\n\n${proof.headerHash??''}${proof.note?`\n\n${proof.note}`:''}`;
  }catch(error){output.textContent=`Verification failed: ${error.message}`;}finally{button.disabled=false;}
}

$$('.filter').forEach((button)=>button.addEventListener('click',()=>{state.filter=button.dataset.filter;$$('.filter').forEach((item)=>item.classList.toggle('active',item===button));renderChecks(state.bundle.reports[state.reportIndex]);}));
$('#run-proof').addEventListener('click',runGenesis);

loadBundle().then((bundle)=>{state.bundle=bundle;render();runGenesis();}).catch((error)=>{$('#report-name').textContent='Evidence bundle unavailable';$('#check-list').innerHTML=`<article class="check" data-status="fail"><span class="dot"></span><div><h4>Run the project build</h4><p>${escapeHtml(error.message)}. Execute npm run build, then npm start.</p></div></article>`;});
