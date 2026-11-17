const CATS = Engine.CATS;
const SUBCAT = "Consortium/Contractual (Subawards)";
const ROLES = ["PI", "Co-Investigator", "MPI", "Administrator", "Financial officer", "Coordinator", "Programmer", "Data Manager", "Intervention Coordinator", "Recruitment/Data Collection", "Research Assistant", "Administrator Assistant", "Statistician", "Data Analyst", "Communications Specialist", "Communication Manager", "Project Manager", "Other staff"];
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = n => USD.format(Math.round((Number(n) || 0) * 100) / 100);
const mi = m => { const [y, mo] = m.split("-").map(Number); return y * 12 + mo - 1; };
const mfrom = i => `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, "0")}`;
const mlabel = m => new Date(m + "-01T12:00").toLocaleString("en", { month: "short", year: "2-digit" });
let S, tab = "summary", chart, aiState = {}, saveT;

function sample() { return JSON.parse(JSON.stringify(APRIL_MOCK)); }
let committed=null, baseline=null, undoState=null, localError='', activeScenario='Working budget', validationMessage='';
const STORE='uab-grant-private-v10';
const previewParams=new URLSearchParams(location.search),isReview=previewParams.get('review')==='1';
function save(){
 if(isReview){const errors=Engine.validate(S).filter(x=>x.level==='error');if(errors.length){validationMessage=errors[0].message;if(committed)S=JSON.parse(committed);return false;}validationMessage='';committed=JSON.stringify(S);return true;}
 const errors=Engine.validate(S).filter(x=>x.level==='error');
 if(errors.length){validationMessage=errors[0].message;toast(errors[0].message);if(committed)S=JSON.parse(committed);return false;}
 validationMessage='';try{undoState=committed;S.audit=S.audit||[];S.audit.push({at:new Date().toISOString(),action:'Saved budget edit',scenario:activeScenario}); if(S.audit.length>300)S.audit.shift();S.grant.reconciled=false;const json=JSON.stringify(S);localStorage.setItem(STORE,json);localStorage.setItem(STORE+'-scenario',activeScenario);committed=json;localError='';document.querySelector('#save-state').textContent='Saved on this browser';return true}
 catch(e){localError='Not saved. Download a backup before leaving.';document.querySelector('#save-state').textContent=localError;toast(localError);return false;}
}
function samePerson(e,p){return e.cat==='Personnel' && e.personId===p.id;}
function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("show"); setTimeout(() => e.classList.remove("show"), 1800); }

// ---------- model ----------
const yearOf = m => Math.floor((mi(m) - mi(S.grant.start)) / 12);
const onYear = (p, y) => !p.years || p.years[y] !== false;
function effortFor(p,m){return Engine.effort(S,p,m);}
function personMonth(p,m){return Engine.person(S,p,m).cost;}
function compute(){return Engine.calculate(S);}

// ---------- views ----------
const vSetup = () => {
  const g = S.grant, c = compute();
  S.planned[SUBCAT] = S.planned[SUBCAT] || [];
  const yr = k => [...Array(c.nY)].map((_, i) => k ? Number(S.planned[k]?.[i]) || 0 : [...CATS, SUBCAT].reduce((t, x) => t + (Number(S.planned[x]?.[i]) || 0), 0));
  return `<div class="card"><h2>Grant</h2><div class="form">
    <label>Title<input data-p="grant.title" value="${esc(g.title)}"></label>
    <label>Start month<input type="month" data-p="grant.start" value="${g.start}"></label>
    <label>End month<input type="month" data-p="grant.end" value="${g.end}"></label>
    <label>Spending known through<input type="month" data-p="grant.asOf" value="${g.asOf}"></label>
    <label>Indirect rate %<input type="number" step="0.1" data-n data-p="grant.indirect" value="${g.indirect}"></label></div></div>
  <div class="card"><h2>Planned budget by year (direct costs, USD)</h2><div class="scroll"><table><tr><th>Category</th>${[...Array(c.nY)].map((_, i) => `<th>Year ${i + 1}</th>`).join("")}<th>Total</th></tr>
  ${[...CATS, SUBCAT].map(k => `<tr><td>${k === SUBCAT ? "Direct Consortium/Contractual Costs (subawards)" : k}</td>${[...Array(c.nY)].map((_, i) => `<td><input type="number" data-n data-p="planned.${k}.${i}" value="${S.planned[k]?.[i] || 0}"></td>`).join("")}<td>${money(yr(k).reduce((a, b) => a + b, 0))}</td></tr>`).join("")}
  <tr class="grp"><td>Total direct costs</td>${[...Array(c.nY)].map((_, i) => `<td>${money(yr(null)[i])}</td>`).join("")}<td>${money(yr(null).reduce((a, b) => a + b, 0))}</td></tr></table></div>
  <p class="muted">Consortium/Contractual = direct dollars awarded to subawards (currently ${money(S.subawards.reduce((t, x) => t + Number(x.total), 0))} awarded on the Subawards tab). Total direct costs adds all categories. Summary tab shows the same categories, with indirect calculated from the IDC base for each year.</p></div>
  <div class="card"><h2>Projection assumptions</h2><p class="muted">Monthly spend for future months. Leave blank to use the average of spending so far.</p><div class="form">
    ${["Travel", "Other"].map(k => `<label>${k} per month ($)<input type="number" data-nn data-p="assume.${k}" value="${S.assume[k] ?? ""}" placeholder="${Math.round(c.cats.find(x => x.c === k).actual / c.elapsed)} (avg)"></label>`).join("")}</div>
    <p style="margin-top:12px"><button class="btn" id="reset">Reset to sample grant</button></p></div>`;
};

function vSummary() {
  const c = compute(), t = c.total, end = t.plan - t.proj;
  const pctSpent = t.plan ? t.actual / t.plan * 100 : 0, pctTime = c.elapsed / c.months.length * 100;
   const rows = [...c.cats, t].map(x => `<tr class="${/^Total|^Indirect/.test(x.c) ? "grp" : ""}"><td>${x.c}</td><td>${money(x.plan)}</td><td>${money(x.actual)}</td><td>${money(x.proj)}</td><td class="${x.variance < 0 ? "neg" : "pos"}">${money(x.variance)}</td></tr>`).join("");
  return `<div class="kpis">
    <div class="kpi"><span>Total budget</span><b>${money(t.plan)}</b></div>
    <div class="kpi"><span>Spend to date</span><b>${money(t.actual)}</b><div class="bar"><i style="width:${Math.min(100, pctSpent)}%"></i></div><span>${pctSpent.toFixed(0)}% spent · ${pctTime.toFixed(0)}% of time</span></div>
    <div class="kpi"><span>Monthly pace</span><b>${c.burn==null?"Not available":money(c.burn)}</b><span>${c.left} months left</span></div>
    <div class="kpi"><span>Projected end balance</span><b class="${end < 0 ? "neg" : "pos"}">${money(end)}</b><span>${end < 0 ? "projected overspend" : "projected remaining"}</span></div></div>
  <div class="card"><h2>Planned vs actual vs projected</h2><div class="scroll"><table><tr><th>Category</th><th>Planned</th><th>Actual to date</th><th>Projected total</th><th>Variance*</th></tr>${rows}</table></div><p class="muted">*Planned minus projected total; negative means projected overspend. F&A estimates use the selected base and cumulative subaward eligibility. Reported F&A may differ; reconcile against the source statement.</p></div>
  <div class="card"><h2>Spending over time (cumulative)</h2><div class="legend"><span>▬ Planned</span><span style="color:#0f766e">▬ Actual</span><span style="color:#0369a1">┅ Projected</span></div><div style="height:260px"><canvas id="ch"></canvas></div></div>
  ${end < 0 ? `<div class="card"><p><b>Balance is projected to go negative.</b></p><button class="btn" id="ai-fix">${aiState.loading === "x" ? "Thinking…" : "Review forecast drivers"}</button><div>${aiState.fix || ""}</div></div>` : ""}`;
}
function drawChart(){const el=document.querySelector('#ch');if(!el)return;const c=compute(),w=480,h=300,pad=48;const max=Math.max(1,...c.curve.plan,...c.curve.projected);const X=i=>pad+i*(w-pad-16)/Math.max(1,c.months.length-1),Y=v=>h-pad-v/max*(h-pad-20);const path=arr=>arr.map((v,i)=>v==null?'':`${i===0||arr[i-1]==null?'M':'L'}${X(i).toFixed(2)},${Y(v).toFixed(2)}`).join(' ');let ticks='';for(let i=0;i<=4;i++){const v=max*i/4;ticks+=`<line x1="${pad}" x2="${w-16}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d9e2de"/><text x="${pad-5}" y="${Y(v)+4}" text-anchor="end" font-size="14">${Math.round(v/1000)}k</text>`;}const as=Math.max(0,Math.min(c.months.length-1,c.elapsed-1));el.outerHTML=`<svg id="ch" viewBox="0 0 ${w} ${h}" role="img" aria-label="Cumulative budget, reported actuals and forecast in US dollars"><title>Budget and forecast over time</title>${ticks}<path d="${path(c.curve.plan)}" fill="none" stroke="#87958e" stroke-width="2"/><path d="${path(c.curve.projected)}" fill="none" stroke="#20669a" stroke-width="3" stroke-dasharray="6 4"/><path d="${path(c.curve.actual)}" fill="none" stroke="#006341" stroke-width="3"/><line x1="${X(as)}" x2="${X(as)}" y1="20" y2="${h-pad}" stroke="#7d8a83" stroke-dasharray="2 4"/><text x="${pad}" y="${h-14}" font-size="14">${mlabel(c.months[0])}</text><text x="${w-16}" y="${h-14}" text-anchor="end" font-size="14">${mlabel(c.months.at(-1))}</text></svg>`;}

function grid(label, rows, months, asOf, variance) {
  return `<div class="scroll"><table><tr><th>${label}</th>${months.map(m => `<th>${mlabel(m)}</th>`).join("")}<th>Total</th>${variance ? "<th>Variance</th>" : ""}</tr>${rows}</table></div>`;
}
function vLedger() {
  const c = compute();
  const sum = o => c.months.reduce((t, m) => t + (o[m] || 0), 0);
  const rows = CATS.map(k => {
    const cost = sum(c.proj[k]), planned = sum(c.plan[k]), v = planned - cost;
    return `<tr><td>${k}</td>${c.months.map(m => `<td>${money(c.proj[k][m] || 0)}</td>`).join("")}<td>${money(cost)}</td><td class="${v < 0 ? "neg" : ""}">${money(v)}</td></tr>`;
  }).join("");
  const ents = [...S.ledger].filter(e=>!ledgerSearch||`${e.note||""} ${e.person||""} ${e.reference||""} ${e.cat}`.toLowerCase().includes(ledgerSearch.toLowerCase())).sort((a,b)=>b.month.localeCompare(a.month)||b.id-a.id);
  return `<div class="card"><h2>Add an expenditure</h2><div class="form">
    <label>Category<select id="l-cat">${CATS.map(k => `<option>${k}</option>`).join("")}</select></label>
    <label>Month<input type="month" id="l-month" value="${S.grant.asOf}"></label>
    <label>Amount ($)<input type="number" id="l-amt"></label>
    <label>Note<input id="l-note" placeholder="optional"></label><label>Person<select id="l-person"><option value="">Not payroll</option>${S.people.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label><label>Source reference<input id="l-ref"></label>
    <button class="btn primary" id="l-add">Add</button></div></div>
  <div class="card"><h2>Month by month</h2><p class="muted">Actual to date plus projected for future months. Variance = planned − total; red if over plan.</p>${grid("Category", rows, c.months, c.asOf, true)}</div>
  <div class="card"><h2>Entries</h2><label class="search-label">Find an entry<input id="ledger-search" value="${esc(ledgerSearch)}" placeholder="Person, note, category or reference"></label><div class="scroll"><table><tr><th>Month</th><th>Category</th><th>Amount</th><th>Note</th><th></th></tr>
  ${ents.map(e => `<tr><td>${mlabel(e.month)}</td><td>${esc(e.cat)}</td><td>${money(e.amount)}</td><td style="text-align:left">${esc(e.person ? e.person + " · " : "")}${esc(e.note)}</td><td><button class="btn sm" data-del="${e.id}">✕</button></td></tr>`).join("") || `<tr><td colspan="5"><div class="empty"><svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="9" width="44" height="60" rx="3" fill="#edf4ef" stroke="#006341" stroke-width="2"/><path d="M28 25h24M28 36h24M28 47h12" stroke="#669480" stroke-width="3"/><circle cx="55" cy="57" r="12" fill="white" stroke="#006341" stroke-width="2"/><path d="m63 66 9 9" stroke="#006341" stroke-width="3"/></svg><strong>${ledgerSearch?'No matching entries':'No expenditures recorded'}</strong>${ledgerSearch?'Try another name, category or reference.':'Add an expenditure above or import a statement from More.'}</div></td></tr>`}</table></div></div>`;
}

function vPeople() {
  const c = compute(), g = S.grant;
  const names = S.people.map(p => p.name);
  const rows = S.people.map((p, i) => {
    const pl = c.months.reduce((t, m) => t + Engine.person(S,{...p,raiseDate:"",changes:[]},m).cost, 0);
    const ac = S.ledger.filter(e => samePerson(e,p) && e.month>=S.grant.start && mi(e.month)<=c.asOf && e.month<=S.grant.end).reduce((t, e) => t + Number(e.amount), 0);
    const pj = c.months.reduce((t, m) => t + (mi(m) <= c.asOf ? (S.ledger.filter(e => samePerson(e,p) && e.month === m).reduce((x, e) => x + Number(e.amount), 0)) : personMonth(p, m)), 0);
    return `<tr><td><input class="txt" data-p="people.${i}.name" value="${esc(p.name)}"></td>
    <td><select data-p="people.${i}.role">${ROLES.map(r => `<option ${r === p.role ? "selected" : ""}>${r}</option>`).join("")}</select></td>
    <td><input type="number" data-n data-p="people.${i}.salary" value="${p.salary}"></td>
    <td><input type="number" data-n data-p="people.${i}.effort" value="${p.effort}" style="width:60px"></td>
    <td><input type="number" data-n data-p="people.${i}.fringe" value="${p.fringe}" style="width:60px"></td>
    <td><input type="month" data-p="people.${i}.raiseDate" value="${p.raiseDate || ""}"></td>
    <td><input type="number" step="0.1" data-n data-p="people.${i}.raisePct" value="${p.raisePct || 0}" style="width:60px"></td>
    <td class="yrs">${[...Array(c.nY)].map((_, y) => `<label><input type="checkbox" data-yr="${i}|${y}" ${onYear(p, y) ? "checked" : ""}>Y${y + 1}</label>`).join(" ")}</td>
    <td>${money(pl)}</td><td>${money(ac)}</td><td class="${pj > pl * 1.001 ? "neg" : ""}">${money(pj)}</td><td><button class="btn sm" data-rmp="${i}">✕</button></td></tr>`;
  }).join("");
  const mrows = S.people.map(p => {
    const cells = c.months.map(m => {
      const a = S.ledger.filter(e => samePerson(e,p) && e.month === m).reduce((t, e) => t + Number(e.amount), 0);
      return mi(m) <= c.asOf ? `<td>${money(a)}</td>` : `<td class="proj">${money(personMonth(p, m))}</td>`;
    }).join("");
    return `<tr><td>${esc(p.name)}</td>${cells}</tr>`;
  }).join("");
  return `<div class="card"><h2>Team</h2><p class="muted">Change salary, effort or raises and the projections update. Tick the budget periods (years) each person works on; monthly effort is adjusted on the Effort tab. Plan is the current capped staffing estimate without raises; it does not replace the category budget.</p><div class="scroll"><table>
    <tr><th>Name</th><th>Role</th><th>Salary ($)</th><th>Effort %</th><th>Fringe %</th><th>Raise date</th><th>Raise %</th><th>Budget periods</th><th>Planned</th><th>Actual</th><th>Projected</th><th></th></tr>${rows}</table></div>
    <p><button class="btn primary" id="add-person">+ Add person</button></p></div>
  <div class="card"><h2>Cost by month (actual, then <span style="color:#0369a1">projected</span>)</h2>${grid("Person", mrows, c.months)}</div>`;
}

function vEffort() {
  const c = compute(), nY = c.nY;
  if (!(S.effYear >= 0 && S.effYear < nY)) S.effYear = Math.min(nY - 1, Math.max(0, yearOf(S.grant.asOf)));
  const y = S.effYear, ms = c.months.slice(y * 12, y * 12 + 12);
  const staff = S.people.map((p, i) => ({ p, i })).filter(x => onYear(x.p, y));
  const rows = staff.map(({ p, i }) => {
    const cells = ms.map(m => `<td><input type="number" min="0" max="100" step="1" class="eff${p.eff && p.eff[m] != null ? " ovr" : ""}" data-eff="${i}|${m}" value="${p.eff && p.eff[m] != null ? p.eff[m] : ""}" placeholder="${p.effort}"></td>`).join("");
    const avg = ms.reduce((t, m) => t + effortFor(p, m), 0) / ms.length;
    const cost = ms.reduce((t, m) => t + personMonth(p, m), 0);
    return `<tr><td style="text-align:left">${esc(p.name)}<br><span class="muted">${esc(p.role)}</span></td>${cells}<td>${avg.toFixed(1)}%</td><td>${money(cost)}</td><td><button class="btn sm" data-effreset="${i}|${y}">Reset</button></td></tr>`;
  }).join("");
  const tot = ms.map(m => staff.reduce((t, x) => t + effortFor(x.p, m), 0));
  const off = S.people.filter(p => !onYear(p, y)).map(p => esc(p.name));
  return `<div class="card"><h2>Personnel effort allocation</h2>
    <p class="muted">Staff come from the Personnel tab (only people ticked for this budget period). Type a % in any month to override that month; blank months use the person's default effort (shown in grey). Projected costs update at once.</p>
    <div class="form"><label>Budget period<select id="eff-year">${[...Array(nY)].map((_, k) => `<option value="${k}" ${k === y ? "selected" : ""}>Year ${k + 1} (${mlabel(c.months[k * 12])} – ${mlabel(c.months[Math.min(c.months.length - 1, k * 12 + 11)])})</option>`).join("")}</select></label></div>
    <div class="scroll"><table><tr><th>Person</th>${ms.map(m => `<th>${mlabel(m)}</th>`).join("")}<th>Avg %</th><th>Cost (w/ fringe)</th><th></th></tr>${rows || `<tr><td colspan="${ms.length + 4}">No one is assigned to this budget period.</td></tr>`}
    <tr class="grp"><td>Total effort (% FTE)</td>${tot.map(v => `<td>${v}</td>`).join("")}<td></td><td>${money(staff.reduce((t, x) => t + ms.reduce((a, m) => a + personMonth(x.p, m), 0), 0))}</td><td></td></tr></table></div>
    ${off.length ? `<p class="muted">Not on this period: ${off.join(", ")}.</p>` : ""}
    <p class="muted">Past months (through ${mlabel(S.grant.asOf)}) show actual payroll on the Personnel tab; effort edits there affect planned figures only.</p></div>`;
}

function vSupplies() {
  const c = compute();
  const base = S.supplies.reduce((t, x) => t + x.qty * x.unit, 0), adj = S.supplies.reduce((t, x) => t + x.qty * (1 + S.scenario.qty / 100) * x.unit * (1 + S.scenario.cost / 100), 0);
  const end = c.total.plan - c.total.proj;
  const rows = S.supplies.map((x, i) => `<tr><td><input class="txt" data-p="supplies.${i}.name" value="${esc(x.name)}"></td>
    <td><input type="number" data-n data-p="supplies.${i}.qty" value="${x.qty}" style="width:70px"></td>
    <td><input type="number" step="0.01" data-n data-p="supplies.${i}.unit" value="${x.unit}" style="width:80px"></td>
    <td><input type="month" data-p="supplies.${i}.month" value="${x.month}"></td>
    <td>${money(x.qty * x.unit)}</td><td>${money(x.qty * (1 + S.scenario.qty / 100) * x.unit * (1 + S.scenario.cost / 100))}</td><td><button class="btn sm" data-rms="${i}">✕</button></td></tr>`).join("");
  return `<div class="card"><h2>Intervention supplies</h2><p class="muted">Quantity × unit cost, bought in the month you choose. Purchases dated after the “known through” month feed the projection.</p><div class="scroll"><table>
    <tr><th>Item</th><th>Qty</th><th>Unit cost ($)</th><th>Buy in</th><th>Base</th><th>Scenario</th><th></th></tr>${rows}
    <tr class="grp"><td>Total</td><td></td><td></td><td></td><td>${money(base)}</td><td>${money(adj)}</td><td></td></tr></table></div>
    <p><button class="btn primary" id="add-supply">+ Add item</button></p></div>
  <div class="card"><h2>What if…?</h2><div class="form">
    <label>Quantity change: <b>${S.scenario.qty > 0 ? "+" : ""}${S.scenario.qty}%</b><input type="range" min="-50" max="50" step="5" data-n data-p="scenario.qty" value="${S.scenario.qty}"></label>
    <label>Unit cost change: <b>${S.scenario.cost > 0 ? "+" : ""}${S.scenario.cost}%</b><input type="range" min="-30" max="50" step="5" data-n data-p="scenario.cost" value="${S.scenario.cost}"></label></div>
    <p>Projected end balance: <b class="${end < 0 ? "neg" : "pos"}">${money(end)}</b></p>
    ${S.scenario.qty || S.scenario.cost ? `<button class="btn" id="reset-sc">Reset scenario</button>` : ""}</div>`;
}

function subStats(sa) {
  const cutoff=S.grant.mode==='proposal'?mi(S.grant.start)-1:mi(S.grant.asOf);
  const paid = S.subPays.filter(x => x.sub == sa.id && x.month>=S.grant.start && mi(x.month)<=cutoff && x.month<=S.grant.end).reduce((t, x) => t + Number(x.amount), 0);
  const subj = Math.min(Number(S.grant.base==='TDC'?sa.total:sa.subj ?? sa.total) || 0, Number(sa.total) || 0), idc = Engine.usd(Engine.cents(subj * S.grant.indirect / 100));
  return { subj, notSubj: sa.total - subj, idc, paid, left: sa.total - paid, pct: sa.total ? paid / sa.total * 100 : 0 };
}
function vSubs() {
  const sel = S.subSel && S.subawards.some(x => x.id == S.subSel) ? S.subSel : "";
  const tot = S.subawards.reduce((t, x) => t + Number(x.total), 0), paid = S.subawards.reduce((t, x) => t + subStats(x).paid, 0);
  const idcBase = S.subawards.reduce((t, x) => t + subStats(x).subj, 0);
  const rows = S.subawards.map((x, i) => { const st = subStats(x); return `<tr class="${sel == x.id ? "grp" : ""}">
    <td><input class="txt" data-p="subawards.${i}.name" value="${esc(x.name)}"></td>
    <td><input class="txt" data-p="subawards.${i}.pi" value="${esc(x.pi)}"></td>
    <td><input type="month" data-p="subawards.${i}.start" value="${x.start || ""}"></td>
    <td><input type="month" data-p="subawards.${i}.end" value="${x.end || ""}"></td>
    <td><input type="number" step="0.01" data-n data-p="subawards.${i}.total" value="${x.total}" style="width:100px"></td>
    <td><input type="number" step="0.01" data-n data-p="subawards.${i}.subj" value="${x.subj ?? x.total}" style="width:100px"></td>
    <td>${money(st.notSubj)}</td><td>${money(st.idc)}</td>
    <td>${money(st.paid)}</td><td class="${st.left < 0 ? "neg" : ""}">${money(st.left)}</td>
    <td><div class="bar"><i style="width:${Math.min(100, st.pct)}%"></i></div>${st.pct.toFixed(0)}%</td>
    <td><button class="btn sm" data-subsel="${x.id}">Ledger</button> <button class="btn sm" data-rmsub="${x.id}">✕</button></td></tr>`; }).join("");
  const pays = S.subPays.filter(x => !sel || x.sub == sel).sort((a, b) => b.month.localeCompare(a.month) || b.id - a.id);
  const nm = id => esc(S.subawards.find(x => x.id == id)?.name || "(removed)");
  const run = {}, acc = {}; [...S.subPays].sort((a, b) => a.month.localeCompare(b.month) || a.id - b.id).forEach(x => { acc[x.sub] = (acc[x.sub] || 0) + Number(x.amount); run[x.id] = acc[x.sub]; });
  return `<div class="kpis">
    <div class="kpi"><span>Total subawards</span><b>${money(tot)}</b></div>
    <div class="kpi"><span>Paid to date</span><b>${money(paid)}</b></div>
    <div class="kpi"><span>Remaining committed</span><b class="${tot - paid < 0 ? "neg" : "pos"}">${money(tot - paid)}</b></div>
    <div class="kpi"><span>IDC base (subject to IDC)</span><b>${money(idcBase)}</b></div>
    <div class="kpi"><span>Indirect @ ${S.grant.indirect}%</span><b>${money(Engine.usd(Engine.cents(idcBase * S.grant.indirect / 100)))}</b></div>
    <div class="kpi"><span>Subawardees</span><b>${S.subawards.length}</b></div></div>
  <div class="card"><h2>Subaward summary</h2><div class="scroll"><table><tr><th>Awardee</th><th>Contact / PI</th><th>Start</th><th>End</th><th>Award total ($)</th><th>Subject to IDC ($)</th><th>Not subject to IDC</th><th>IDC @ rate</th><th>Paid</th><th>Remaining</th><th>% paid</th><th></th></tr>${rows}</table></div>
    <p class="muted">Only the part of each subaward marked “Subject to IDC” counts toward the IDC base. Indirect = IDC base × the grant’s indirect rate (${S.grant.indirect}%, set in Setup). </p>
    <p><button class="btn primary" id="add-sub">+ Add subaward</button></p></div>
  <div class="card"><h2>Add a payment</h2>${S.subawards.length ? `<div class="form">
    <label>Awardee<select id="sp-sub">${S.subawards.map(x => `<option value="${x.id}" ${sel == x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
    <label>Month paid<input type="month" id="sp-month" value="${S.grant.asOf}"></label>
    <label>Amount ($)<input type="number" step="0.01" id="sp-amt"></label>
    <label>Invoice #<input id="sp-inv" placeholder="optional"></label>
    <label>Note<input id="sp-note" placeholder="optional"></label>
    <button class="btn primary" id="sp-add">Add payment</button></div>` : `<p class="muted">Add a subaward first.</p>`}</div>
  <div class="card"><h2>Payment ledger${sel ? ": " + nm(sel) : " (all awardees)"}</h2>${sel ? `<p><button class="btn sm" data-subsel="">Show all awardees</button></p>` : ""}
    <div class="scroll"><table><tr><th>Month</th><th>Awardee</th><th>Invoice</th><th>Amount</th><th>Cumulative paid</th><th>Note</th><th></th></tr>
    ${pays.map(x => `<tr><td>${mlabel(x.month)}</td><td style="text-align:left">${nm(x.sub)}</td><td>${esc(x.inv)}</td><td>${money(x.amount)}</td><td>${money(run[x.id])}</td><td style="text-align:left">${esc(x.note)}</td><td><button class="btn sm" data-delsp="${x.id}">✕</button></td></tr>`).join("") || `<tr><td colspan="7">No payments yet.</td></tr>`}</table></div>
    <p class="muted">Subaward payments are tracked here separately; payments feed the Direct Consortium row on the Summary. Cumulative paid is per awardee.</p></div>`;
}

let ledgerSearch="";
function render() {
  const g = S.grant; $("#title").textContent = g.title; $("#subtitle").textContent = `${mlabel(g.start)} – ${mlabel(g.end)} · ${S.grant.mode==="proposal"?"Proposal plan":"Reported through "+mlabel(S.grant.asOf)}`;
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  $("#view").innerHTML = { summary: vSummary, ledger: vLedger, people: vPeople, effort: vEffort, supplies: vSupplies, subs: vSubs, setup: vSetup }[tab]();
  enhance(); if (tab === "summary") drawChart();
}

// Keep keyboard position when a committed edit replaces the working view.
function focusIdentity(el){return el?.id?{id:el.id}:el?.dataset?Object.fromEntries(Object.entries(el.dataset)):null;}
function restoreControl(key){if(!key)return;const el=key.id?document.getElementById(key.id):[...document.querySelectorAll('#view input,#view select,#view button,#view textarea')].find(e=>Object.keys(key).length&&Object.entries(key).every(([k,v])=>e.dataset[k]===v));el?.focus({preventScroll:true});}
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!e.target.closest?.('#view'))return;const controls=[...document.querySelectorAll('input,select,button,textarea,a[href],summary')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);const next=controls[controls.indexOf(e.target)+(e.shiftKey?-1:1)];const key=focusIdentity(next);setTimeout(()=>restoreControl(key),0);});

// ---------- events ----------
document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; render(); scrollTo(0, 0); return; }
  if (t.id === "export") return exportXlsx();
  if (t.id === "l-add") { const amt = Number($("#l-amt").value); if (!amt) return toast("Enter an amount"); S.ledger.push({ id: S.nextId++, cat: $("#l-cat").value, month: $("#l-month").value, amount: amt, note: $("#l-note").value, personId:$("#l-person").value||undefined, person:S.people.find(p=>p.id===$("#l-person").value)?.name, reference:$("#l-ref").value }); if(!save())return render(); render(); toast("Added"); }
  else if (t.dataset.del) { S.ledger = S.ledger.filter(x => x.id != t.dataset.del); if(!save())return render(); render(); }
  else if (t.id === "add-person") { S.people.push({ id: crypto.randomUUID(), appointment:12, name: "New person", role: "Other staff", salary: 60000, effort: 10, fringe: 30, raiseDate: "", raisePct: 3 }); if(!save())return render(); render(); }
  else if (t.dataset.rmp) { if(S.ledger.some(e=>e.personId===S.people[t.dataset.rmp].id)){toast("This person has payroll history. Set their future effort to zero instead.");return;} S.people.splice(t.dataset.rmp, 1); if(!save())return render(); render(); }
  else if (t.id === "add-supply") { S.supplies.push({ name: "New item", qty: 10, unit: 10, month: S.grant.asOf }); if(!save())return render(); render(); }
  else if (t.dataset.rms) { S.supplies.splice(t.dataset.rms, 1); if(!save())return render(); render(); }
  else if (t.id === "add-sub") { S.subawards.push({ id: S.subNext++, name: "New awardee", pi: "", start: S.grant.start, end: S.grant.end, total: 0, subj: 0, note: "" }); if(!save())return render(); render(); }
  else if (t.dataset.rmsub) { if (confirm("Remove this subaward and its payments?")) { S.subawards = S.subawards.filter(x => x.id != t.dataset.rmsub); S.subPays = S.subPays.filter(x => x.sub != t.dataset.rmsub); if(!save())return render(); render(); } }
  else if (t.dataset.subsel !== undefined) { S.subSel = t.dataset.subsel; render(); }
  else if (t.id === "sp-add") { const amt = Number($("#sp-amt").value); if (!amt) return toast("Enter an amount"); S.subPays.push({ id: S.subNext++, sub: Number($("#sp-sub").value), month: $("#sp-month").value, amount: amt, inv: $("#sp-inv").value, note: $("#sp-note").value }); if(!save())return render(); render(); toast("Payment added"); }
  else if (t.dataset.delsp) { S.subPays = S.subPays.filter(x => x.id != t.dataset.delsp); if(!save())return render(); render(); }
  else if (t.id === "reset-sc") { S.scenario = { qty: 0, cost: 0 }; if(!save())return render(); render(); }
  else if (t.id === "reset") { if (confirm("Replace everything with the sample grant?")) { S = sample(); if(!save())return render(); render(); } }
  else if (t.dataset.effreset) { const [i, y] = t.dataset.effreset.split("|").map(Number), p = S.people[i]; Object.keys(p.eff || {}).forEach(m => { if (yearOf(m) === y) delete p.eff[m]; }); if(!save())return render(); render(); }
  else if (t.id === "ai-fix") ai("x");
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.id === "eff-year") { S.effYear = Number(el.value); if(!save())return render(); return render(); }
  if (el.dataset.yr) { const [i, y] = el.dataset.yr.split("|").map(Number), p = S.people[i]; p.years = p.years || []; for (let k = 0; k < y; k++) if (p.years[k] === undefined) p.years[k] = true; p.years[y] = el.checked; if(!save())return render(); return render(); }
  if (el.dataset.eff) { const [i, m] = el.dataset.eff.split("|"), p = S.people[i]; p.eff = p.eff || {}; if (el.value === "") delete p.eff[m]; else p.eff[m] = Math.max(0, Math.min(100, Number(el.value) || 0)); if(!save())return render(); return render(); }
  const p = el.dataset.p; if (!p) return;
  const parts = p.split("."); let o = S;
  parts.slice(0, -1).forEach(k => o = o[k]);
  const last = parts.at(-1);
  o[last] = "n" in el.dataset ? Number(el.value) || 0 : "nn" in el.dataset ? (el.value === "" ? null : Number(el.value)) : el.value;
  if(!save())return render(); render();
});
document.addEventListener("input", e => { if (e.target.type === "range") { const l = e.target.closest("label").querySelector("b"); l.textContent = (e.target.value > 0 ? "+" : "") + e.target.value + "%"; } });

function ai(){const c=compute();aiState.fix=c.cats.filter(x=>x.variance<0&&!/^Total|^Indirect/.test(x.c)).map(x=>`<div class="flag"><b>${esc(x.c)}: ${money(-x.variance)} above budget</b><p>Review the monthly inputs and timing in ${x.c==='Personnel'?'Personnel and Effort':x.c==='Supplies'?'Supplies':'Setup'}. Actuals and the approved plan have not been changed.</p></div>`).join('');render();}

async function exportXlsx() {
  const c = compute(), r = v => Math.round(v * 100) / 100;
  const sum = [["Grant", S.grant.title], ["Period", `${S.grant.start} to ${S.grant.end}`], ["Known through", S.grant.asOf], [], ["Category", "Planned", "Actual to date", "Projected total", "Variance (planned - projected)"], ...[...c.cats, c.total].map(x => [x.c, r(x.plan), r(x.actual), r(x.proj), r(x.variance)])];
  const led = [["Category", "Type", ...c.months, "Total"]];
  [...CATS,SUBCAT].forEach(k => [["Planned", c.plan[k]], ["Actual", c.act[k]], ["Projected", c.proj[k]]].forEach(([n, o]) => led.push([k, n, ...c.months.map(m => r(o[m] || 0)), r(c.months.reduce((t, m) => t + (o[m] || 0), 0))])));
  for(const [label,key] of [['Planned','plan'],['Actual','actual'],['Projected','proj']])led.push(['F&A',label,...c.months.map(m=>c.fa[key][m]),Engine.usd(c.months.reduce((t,m)=>t+Engine.cents(c.fa[key][m]),0))]);
  const ent = [["Month", "Category", "Person", "Amount", "Note"], ...S.ledger.map(e => [e.month, e.cat, e.person || "", Number(e.amount), e.note || ""])];
  const per = [["Name", "Role", "Salary", "Effort %", "Fringe %", "Raise date", "Raise %", ...c.months]];
  S.people.forEach(p => per.push([p.name, p.role, p.salary, p.effort, p.fringe, p.raiseDate, p.raisePct, ...c.months.map(m => mi(m) <= c.asOf ? S.ledger.filter(e => samePerson(e,p) && e.month === m).reduce((t, e) => t + Number(e.amount), 0) : r(personMonth(p, m)))]));
  const eff = [["Name", "Role", "Default effort %", ...c.months]];
  S.people.forEach(p => eff.push([p.name, p.role, p.effort, ...c.months.map(m => effortFor(p, m))]));
  const sup = [["Item", "Qty", "Unit cost (USD)", "Buy in", "Base total", "Scenario qty %", "Scenario cost %", "Scenario total"], ...S.supplies.map(x => [x.name, x.qty, x.unit, x.month, r(x.qty * x.unit),S.scenario.qty,S.scenario.cost,r(x.qty*x.unit*(1+S.scenario.qty/100)*(1+S.scenario.cost/100))])];
  const subS = [["Awardee", "Contact / PI", "Start", "End", "Award total", "Subject to IDC", "Not subject to IDC", "IDC", "Paid to date", "Remaining"], ...S.subawards.map(x => { const st = subStats(x); return [x.name, x.pi, x.start, x.end, r(x.total), r(st.subj), r(st.notSubj), r(st.idc), r(st.paid), r(st.left)]; })];
  const subP = [["Month", "Awardee", "Invoice", "Amount", "Note"], ...[...S.subPays].sort((a, b) => a.month.localeCompare(b.month)).map(x => [x.month, S.subawards.find(y => y.id == x.sub)?.name || "", x.inv || "", r(Number(x.amount)), x.note || ""])];
  const sheets=[{name:'Summary',rows:sum},{name:'Ledger',rows:led},{name:'Entries',rows:ent},{name:'Personnel',rows:per},{name:'Effort',rows:eff},{name:'Supplies',rows:sup},{name:'Subaward summary',rows:subS},{name:'Subaward payments',rows:subP},{name:'Assumptions',rows:[['Field','Value'],...Object.entries(S.grant),['Scenario',activeScenario],['Quantity change %',S.scenario.qty],['Cost change %',S.scenario.cost],['Data status','Synthetic; not an official ledger']]},{name:'Audit',rows:[['UTC time','Action','Scenario'],...(S.audit||[]).map(x=>[x.at,x.action,x.scenario])]}];
  downloadBlob(makeXlsx(sheets),'grant-budget.xlsx');toast('Excel workbook created');
}


function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function init(){try{const raw=isReview?(previewParams.get('state')==='recovery'?'{}':null):localStorage.getItem(STORE);S=raw?JSON.parse(raw):sample();if(!S.grant||S.schema!==1)throw Error('Unsupported saved format');const errs=Engine.validate(S).filter(x=>x.level==='error');if(errs.length)throw Error(errs[0].message);committed=JSON.stringify(S);baseline=isReview?JSON.parse(committed):JSON.parse(localStorage.getItem(STORE+'-baseline')||committed);activeScenario=isReview?'Visual review':localStorage.getItem(STORE+'-scenario')||'Working budget';if(isReview){activeScenario='Visual review';const v=previewParams.get('view');if(['summary','ledger','people','effort','supplies','subs','setup'].includes(v))tab=v;const state=previewParams.get('state');if(state==='empty'){S.ledger=[];S.subPays=[];}if(state==='validation')validationMessage='Effort must be between 0% and 100%.';}render();}catch(e){document.querySelector('#view').innerHTML='<h2>Saved project could not be opened</h2><p>Your saved data has not been changed. Download it before resetting this browser.</p><button id="recover-raw">Download saved data</button>';document.querySelector('#recover-raw').onclick=()=>downloadBlob(new Blob([isReview?'{}':localStorage.getItem(STORE)||''],{type:'application/json'}),'recovery.json');}}
init();
