/* ---------- UI strings live in locales/en.js ---------- */
const LOC={};const LANG='en';
const tr=(k,p)=>{const v=(LOC[LANG]&&LOC[LANG][k])??(LOC.en&&LOC.en[k]);if(typeof v!=='string')return k;return p?v.replace(/\{(\w+)\}/g,(_,n)=>p[n]??''):v};
const trl=k=>{const v=(LOC[LANG]&&LOC[LANG][k])||(LOC.en&&LOC.en[k]);return Array.isArray(v)?v:[]};
// Data is loaded with script tags (not fetch) so the page also works when opened from disk.
const loadScript=src=>new Promise(res=>{const el=document.createElement('script');el.src=src;el.onload=()=>res(true);el.onerror=()=>{el.remove();res(false)};document.head.appendChild(el)});
async function loadLocales(){
  if(await loadScript('locales/en.js'))LOC.en=window.__LOCALE_EN__;
  STOP=new Set(((LOC.en&&LOC.en.stopwords)||'').split(/\s+/).filter(Boolean));
}
function applyStatic(){
  document.documentElement.lang=LANG;
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=tr(el.dataset.i18n)});
  document.querySelectorAll('[data-i18n-attr]').forEach(el=>el.dataset.i18nAttr.split(';').forEach(p=>{const [a,k]=p.split(':');el.setAttribute(a,tr(k))}));
  const d=GENERATED?new Date(GENERATED).toLocaleDateString('en-GB'):'';
  $('#footNote').textContent=DEMO?tr('foot.demo'):tr('foot.built',{d});
  applyTheme(theme);
}
let REPO='free3et/dev-digest-ai-marketplace', MKT='dev-digest-ai-marketplace', DEMO=false, READY=false;
const TYPE_IDS=['plugin','skill','agent','command','hook','mcp'];
const TYPES=new Proxy({},{get:(_,id)=>typeof id==='string'?tr('type.'+id):undefined});
const PL=new Proxy({},{get:(_,id)=>typeof id==='string'?tr('typePl.'+id):undefined});
const TCOL=t=>`var(--t-${t})`;

/* ---------- data (data/catalog.js is generated at deploy by scripts/build-site.mjs) ---------- */
let PLUGINS=[],A=[],byId={},RELEASES=[],GENERATED=null;
const daysSince=d=>Math.max(0,Math.floor((Date.now()-new Date(d).getTime())/864e5));
const toDays=x=>typeof x==='number'?x:daysSince(x);
async function loadCatalog(){
  let data=null;
  if(await loadScript('data/catalog.js'))data=window.__CATALOG__;
  if(!data||!Array.isArray(data.plugins)||!data.plugins.length){
    if(!await loadScript('data/catalog.sample.js'))throw new Error('no catalog data');
    data=window.__CATALOG__;
  }
  const m=data.meta||{};
  REPO=m.repo||REPO;MKT=m.marketplace||MKT;DEMO=!!m.demo;GENERATED=m.generatedAt||null;
  PLUGINS=data.plugins.map(p=>({tags:[],kw:[],log:[],cat:'Other',health:'ok',...p,days:toDays(p.updated??p.days??0),log:(p.log||[]).map(l=>({...l,notes:l.notes||[],days:toDays(l.date??l.days??0)}))}));
  const arts=(data.artifacts||[]).map(a=>({tags:[],kw:[],...a,days:toDays(a.updated??a.days??0)}));
  const pl=PLUGINS.map(p=>({id:`${p.name}/plugin/${p.name}`,type:'plugin',plugin:p.name,name:p.name,desc:p.desc,tags:p.tags,kw:p.kw,days:p.days}));
  A=[...pl,...arts];
  byId=Object.fromEntries(A.map(a=>[a.id,a]));
  RELEASES=PLUGINS.flatMap(p=>p.log.map(l=>({plugin:p.name,ver:l.ver,days:l.days,notes:l.notes}))).sort((x,y)=>x.days-y.days);
}
const EX=()=>PLUGINS[0]?PLUGINS[0].name:'<plugin>';
const plug=n=>PLUGINS.find(p=>p.name===n);
const ofPlugin=n=>A.filter(a=>a.plugin===n&&a.type!=='plugin');

/* ---------- state & helpers ---------- */
const S={route:'home',arg:null,q:'',f:{type:new Set(),cat:null,plugin:null,tag:null},saved:new Set(),cart:new Set(),tab:'cli',inst:'sh'};
try{const s=JSON.parse(localStorage.getItem('dd-state')||'{}');(s.saved||[]).forEach(x=>S.saved.add(x));(s.cart||[]).forEach(x=>S.cart.add(x));}catch(e){}
const persist=()=>{try{localStorage.setItem('dd-state',JSON.stringify({saved:[...S.saved],cart:[...S.cart]}))}catch(e){}};
const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ago=d=>d===0?tr('ago.today'):d===1?tr('ago.yesterday'):d<7?tr('ago.days',{n:d}):d<30?tr('ago.weeks',{n:Math.round(d/7)}):tr('ago.months',{n:Math.round(d/30)});
const installCmd=p=>`claude plugin install ${p}@${MKT}`;
const addCmd=`claude plugin marketplace add ${REPO}`;
let STOP=new Set();
const tokens=q=>q.toLowerCase().replace(/[’`]/g,"'").split(/[^\p{L}\p{N}']+/u).filter(t=>t&&!STOP.has(t));
const stem=t=>t.length>5?t.slice(0,t.length-2):t;
const alts=t=>[t];
function score(a,toks){
  if(!toks.length)return 1;
  const F=[[a.name,5],[a.kw.join(' '),4],[a.tags.join(' '),4],[a.desc,3],[a.plugin,2],[(a.use||[]).join(' ')+(a.tools||''),1]].map(([s,w])=>[s.toLowerCase().replace(/[’`]/g,"'"),w]);
  let total=0;
  for(const t of toks){let best=0;for(const u of alts(t))for(const [s,w] of F){if(s.includes(u))best=Math.max(best,w);else if(u.length>4&&s.includes(stem(u)))best=Math.max(best,w*.6);}
    if(!best)return 0; total+=best;}
  return total;
}
function hl(text,toks){
  let s=esc(text);
  toks.filter(t=>t.length>1).sort((a,b)=>b.length-a.length).forEach(t=>{const r=new RegExp('('+(t.length>5?stem(t):t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');s=s.replace(r,'<mark>$1</mark>')});
  return s;
}
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,1600)}
function copy(text,btn){
  const ok=()=>{toast(tr('toast.copied'));if(btn){btn.classList.add('done');const o=btn.textContent;btn.textContent=tr('btn.done');setTimeout(()=>{btn.classList.remove('done');btn.textContent=o},1200)}};
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){toast(tr('toast.copyManual'))}ta.remove()};
  try{navigator.clipboard.writeText(text).then(ok,fb)}catch(e){fb()}
}
const codeBlock=(t,label=tr('btn.copy'))=>`<div class="code">${esc(t)}<button class="cp" data-copy="${esc(t)}">${label}</button></div>`;
const tb=t=>`<span class="tb" style="--c:${TCOL(t)}">${TYPES[t]}</span>`;
const healthPill=p=>`<span class="pill ${p.health}">${tr('health.'+p.health)}</span>`;
const fresh=d=>d<=7?`<span class="pill new">${tr('fresh.new')}</span>`:d<=14?`<span class="pill new">${tr('fresh.upd')}</span>`:'';

/* ---------- components ---------- */
function card(a,toks=[]){
  const p=plug(a.plugin), saved=S.saved.has(a.id), inCart=S.cart.has(a.plugin);
  return `<article class="card" tabindex="0" role="link" data-open="${esc(a.id)}">
    <div class="card-h">${tb(a.type)}<span style="display:flex;gap:6px;align-items:center">${fresh(a.days)}${healthPill(p)}</span></div>
    <h3>${hl(a.name,toks)}</h3>
    <p>${hl(a.desc,toks)}</p>
    <div class="pl"><span>${esc(a.plugin)}</span><span>v${p.ver}</span><span>· ${ago(a.days)}</span></div>
    <div class="tags">${a.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
    <div class="card-f">
      <button class="btn ghost sm" data-copy="${esc(installCmd(a.plugin))}" data-stop>${tr('card.copyInstall')}</button>
      <button class="btn ghost sm" data-cart="${esc(a.plugin)}" data-stop aria-pressed="${inCart}">${inCart?tr('card.inKit'):tr('card.addKit')}</button>
      <span class="sp"></span>
      <button class="star" data-save="${esc(a.id)}" data-stop aria-pressed="${saved}" aria-label="${tr('card.save')}">${saved?'★':'☆'}</button>
    </div></article>`;
}
const execRows=list=>list.filter(a=>a.run).map(a=>`<div class="sec-row"><span class="tb" style="--c:${TCOL(a.type)}">${TYPES[a.type]}</span><div><div class="ln">${esc(a.name)}</div><code>${a.event?esc(a.event)+' · '+esc(a.matcher)+' → ':''}${esc(a.run)}</code></div></div>`).join('');
function securityPanel(list){
  const risky=list.filter(a=>a.type==='hook'||a.type==='mcp'), rows=execRows(list), tools=list.filter(a=>a.tools).map(a=>`<div class="sec-row"><span class="tb" style="--c:${TCOL(a.type)}">${TYPES[a.type]}</span><div><div class="ln">${esc(a.name)}</div><code>${esc(a.tools)}</code></div></div>`).join('');
  return `<section class="panel"><h3>${tr('sec.title')}</h3>
    <p style="margin:0 0 8px">${risky.length?`<span class="pill warn">${tr('sec.runs')}</span>`:`<span class="pill ok">${tr('sec.textOnly')}</span>`}</p>
    ${rows||''}${tools?`<div class="fg-t" style="margin-top:12px">${tr('sec.tools')}</div>${tools}`:''}
    ${!rows&&!tools?`<p class="muted" style="margin:0">${tr('sec.none')}</p>`:''}
    <p class="note">${tr('sec.note')}</p></section>`;
}

/* ---------- screens ---------- */
function home(){
  const cnt=t=>A.filter(a=>a.type===t).length, valid=PLUGINS.filter(p=>p.health==='ok').length;
  return `<section class="hero">
    <div class="eyebrow">${tr('home.eyebrow')}</div>
    <h1 style="margin-top:10px;max-width:16ch">${tr('home.title')}</h1>
    <p class="lead">${tr('home.lead')}</p>
    <form class="hsearch" id="hform"><input id="hq" type="search" placeholder="${esc(tr('home.placeholder'))}" autocomplete="off" aria-label="${tr('home.ariaQ')}"><button class="btn" type="submit">${tr('home.search')}</button></form>
    <div class="chips" aria-label="${tr('home.examplesAria')}">${trl('home.examples').map(x=>`<button class="chip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
  </section>
  <section class="sec"><div class="stats">
    <div class="stat"><b>${PLUGINS.length}</b><span><i class="dot" style="--c:var(--t-plugin)"></i>${PL.plugin}</span></div>
    ${['skill','agent','command','hook','mcp'].map(t=>`<button class="stat" data-stat="${t}"><b>${cnt(t)}</b><span><i class="dot" style="--c:${TCOL(t)}"></i>${PL[t]}</span></button>`).join('')}
    </div>
    <div class="meta-line"><span>${tr('home.valid',{a:valid,b:PLUGINS.length})}</span><span>${tr('home.updated',{when:ago(Math.min(...A.map(a=>a.days)))})}</span><span>${tr('home.total',{n:A.length})}</span></div>
  </section>
  <div class="sec home-2">
    <section><div class="sec-h"><h2>${tr('home.news')}</h2><button class="link" data-go="new">${tr('home.allNews')}</button></div>${timeline(RELEASES.slice(0,3))}</section>
    <section class="panel"><div class="eyebrow">${tr('home.connect')}</div><h2 style="margin:6px 0 12px">${tr('home.connectTitle')}</h2>
      ${codeBlock(addCmd)}<div style="height:8px"></div>${codeBlock(installCmd(EX()))}
      <p style="margin:14px 0 0"><button class="btn sm" data-go="start">${tr('home.steps')}</button></p></section>
  </div>
  <section class="sec"><div class="sec-h"><h2>${tr('home.recent')}</h2><button class="link" data-go="catalog">${tr('home.allCatalog')}</button></div>
    <div class="grid">${[...A].sort((a,b)=>a.days-b.days).filter(a=>a.type!=='plugin').slice(0,6).map(a=>card(a)).join('')}</div></section>`;
}
function matchSet(toks){return A.map(a=>[a,score(a,toks)]).filter(x=>x[1]>0)}
function catalog(){
  const toks=tokens(S.q), base=matchSet(toks), F=S.f;
  const pass=([a])=>(!F.type.size||F.type.has(a.type))&&(!F.cat||plug(a.plugin).cat===F.cat)&&(!F.plugin||a.plugin===F.plugin)&&(!F.tag||a.tags.includes(F.tag));
  let res=base.filter(pass);
  res.sort((x,y)=>toks.length?y[1]-x[1]||x[0].days-y[0].days:x[0].days-y[0].days);
  const grp=(key,vals,get)=>vals.map(v=>[v,base.filter(([a])=>get(a)===v).length]).filter(x=>x[1]>0);
  const typeOpts=TYPE_IDS.map(t=>[t,base.filter(([a])=>a.type===t).length]).filter(x=>x[1]);
  const cats=grp('cat',[...new Set(PLUGINS.map(p=>p.cat))],a=>plug(a.plugin).cat);
  const pls=grp('plugin',PLUGINS.map(p=>p.name),a=>a.plugin);
  const tags=[...new Set(A.flatMap(a=>a.tags))].filter(t=>base.some(([a])=>a.tags.includes(t))).slice(0,14);
  const opt=(k,v,label,n,on,dot)=>`<button class="fopt" data-f="${k}" data-v="${esc(v)}" aria-pressed="${on}">${dot?`<i class="dot" style="--c:${dot}"></i>`:''}${esc(label)}<em>${n}</em></button>`;
  const anyF=F.type.size||F.cat||F.plugin||F.tag;
  return `<div class="res-h"><div><h1 style="font-size:28px">${S.q?tr('cat.results',{q:esc(S.q)}):tr('cat.title')}</h1>
    ${toks.length&&S.q?`<div class="dim mono" style="font-size:12px;margin-top:6px">${tr('cat.keywords')} ${toks.map(t=>esc(t)).join(' · ')||'—'}</div>`:''}</div>
    <div class="mono muted" style="font-size:13px">${tr('cat.found',{n:res.length})}</div></div>
  <div class="cat"><aside class="filters" aria-label="${tr('cat.filters')}">
    <div><div class="fg-t">${tr('cat.type')}</div>${typeOpts.map(([t,n])=>opt('type',t,TYPES[t],n,F.type.has(t),TCOL(t))).join('')}</div>
    <div><div class="fg-t">${tr('cat.category')}</div>${cats.map(([c,n])=>opt('cat',c,c,n,F.cat===c)).join('')}</div>
    <div><div class="fg-t">${tr('cat.plugin')}</div>${pls.map(([c,n])=>opt('plugin',c,c,n,F.plugin===c)).join('')}</div>
    <div><div class="fg-t">${tr('cat.tags')}</div><div class="chips" style="margin:0">${tags.map(t=>`<button class="chip" data-f="tag" data-v="${esc(t)}" aria-pressed="${F.tag===t}">${esc(t)}</button>`).join('')}</div></div>
    ${anyF?`<button class="btn ghost sm" data-clear>${tr('cat.reset')}</button>`:''}
  </aside><section>${res.length?`<div class="grid">${res.map(([a])=>card(a,toks.flatMap(alts))).join('')}</div>`:
    `<div class="empty"><h3>${tr('cat.none')}</h3><p style="margin:0 0 14px">${tr('cat.noneHint')}</p><div class="chips" style="justify-content:center">${trl('cat.noneExamples').map(x=>`<button class="chip" data-q="${x}">${x}</button>`).join('')}</div></div>`}</section></div>`;
}
const crumbs=(...x)=>`<div class="crumbs"><button data-go="catalog">${tr('cat.title')}</button>${x.map(([l,go,arg])=>`<span>/</span>${go?`<button data-go="${go}" data-arg="${esc(arg||'')}">${esc(l)}</button>`:`<span>${esc(l)}</span>`}`).join('')}</div>`;
const fileOf=a=>a.file||({skill:`skills/${a.name}/SKILL.md`,agent:`agents/${a.name}.md`,command:`commands/${a.name.replace('/','')}.md`,hook:'hooks/hooks.json',mcp:'.mcp.json'})[a.type];
const ghUrl=a=>{const p=plug(a.plugin);return `https://github.com/${REPO}/${a.path?'blob':'tree'}/main/${a.path||p.path||'plugins/'+a.plugin}`};
const saveBtns=a=>`<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-save="${esc(a.id)}" aria-pressed="${S.saved.has(a.id)}">${S.saved.has(a.id)?tr('d.saved'):tr('d.save')}</button><a class="btn ghost sm" href="${esc(ghUrl(a))}" target="_blank" rel="noopener noreferrer">${tr('d.github')}</a></div>`;
function installPanel(pn){return `<section class="panel"><h3>${tr('d.install')}</h3><div class="codes">${codeBlock(addCmd)}${codeBlock(installCmd(pn))}</div>
  <p style="margin:12px 0 0;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-cart="${esc(pn)}" aria-pressed="${S.cart.has(pn)}">${S.cart.has(pn)?tr('card.inKit'):tr('d.addKit')}</button></p></section>`}
function artifact(a){
  if(!a)return notFound();
  if(a.type==='plugin')return pluginPage(plug(a.plugin));
  const p=plug(a.plugin), sibs=ofPlugin(a.plugin).filter(x=>x.id!==a.id);
  const fm=a.type==='skill'?`---\nname: ${a.name}\ndescription: ${a.desc}\nallowed-tools: ${a.tools}\n---`:a.type==='agent'?`---\nname: ${a.name}\ndescription: ${a.desc}\ntools: ${a.tools}\nmodel: ${a.model}\n---`:a.type==='hook'?`{\n  "hooks": { "${a.event}": [{\n    "matcher": "${a.matcher}",\n    "hooks": [{ "type": "command", "command": "${a.run}" }]\n  }]}\n}`:a.type==='mcp'?`{\n  "mcpServers": { "${a.name}": {\n    "command": "npx",\n    "args": ["-y", "@modelcontextprotocol/server-postgres"]\n  }}\n}`:a.run;
  const file=fileOf(a);
  return `${crumbs([a.plugin,'plugin',a.plugin],[a.name])}
  <div class="dh"><div style="min-width:0">${tb(a.type)}<h1 style="margin-top:8px">${esc(a.name)}</h1><p class="lead" style="margin-top:8px">${esc(a.desc)}</p>
    <div class="pl" style="margin-top:12px"><span>${esc(a.plugin)} v${p.ver}</span>${healthPill(p)}${fresh(a.days)}<span>· ${ago(a.days)}</span></div></div>${saveBtns(a)}</div>
  <div class="cols"><div class="stack">
    ${a.use?`<section class="panel prose"><h3>${tr('d.when')}</h3><ul>${a.use.map(u=>`<li>${esc(u)}</li>`).join('')}</ul></section>`:''}
    <section class="panel"><h3>${tr('d.content')} <span class="dim mono" style="font-weight:400;font-size:12px">${esc(file)}</span></h3>${codeBlock(a.content||fm)}</section>
    ${sibs.length?`<section class="panel"><h3>${tr('d.more',{p:esc(a.plugin)})}</h3><div class="list">${sibs.map(s=>`<button class="li" data-open="${esc(s.id)}">${tb(s.type)}<span class="ln">${esc(s.name)}</span><span class="sp"></span><span class="dim" style="font-size:13px">→</span></button>`).join('')}</div></section>`:''}
  </div><div class="stack">${installPanel(a.plugin)}${securityPanel([a])}</div></div>`;
}
function pluginPage(p){
  const list=ofPlugin(p.name);
  const tree=`${p.path||'plugins/'+p.name}/\n├─ <b>.claude-plugin/plugin.json</b>\n`+['skill','agent','command','hook','mcp'].flatMap(t=>list.filter(a=>a.type===t)).map((a,i,arr)=>`${i===arr.length-1?'└─':'├─'} ${fileOf(a)}`).join('\n');
  return `${crumbs([p.name])}
  <div class="dh"><div style="min-width:0">${tb('plugin')}<h1 style="margin-top:8px">${esc(p.name)}</h1><p class="lead" style="margin-top:8px">${esc(p.desc)}</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${p.external?'':`<a class="btn ghost sm" href="${esc(ghUrl({plugin:p.name}))}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`}</div></div>
  <div class="cols"><div class="stack">
    <section class="panel"><h3>${tr('p.composition',{n:list.length})}</h3><div class="list">${list.map(s=>`<button class="li" data-open="${esc(s.id)}">${tb(s.type)}<span class="ln">${esc(s.name)}</span><span class="sp"></span><span class="dim" style="font-size:13px;max-width:30ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.desc)}</span></button>`).join('')}</div></section>
    <section class="panel"><h3>${tr('p.tree')}</h3><div class="tree">${tree}</div></section>
    <section class="panel"><h3>${tr('p.history')}</h3>${timeline(p.log.map(l=>({plugin:p.name,ver:l.ver,days:l.days,notes:l.notes})),true)}</section>
  </div><div class="stack">${installPanel(p.name)}
    <section class="panel"><h3>${tr('p.state')}</h3><dl class="kv"><dt>${tr('p.version')}</dt><dd class="mono">${p.ver}</dd><dt>${tr('p.category')}</dt><dd>${esc(p.cat)}</dd><dt>${tr('p.updated')}</dt><dd>${ago(p.days)}</dd><dt>${tr('p.validation')}</dt><dd>${healthPill(p)}</dd></dl>
      ${(p.healthCodes||[]).length?`<p class="note" style="color:var(--${p.health==='err'?'err':'warn'})">${(p.healthCodes||[]).map(c=>esc(tr('hc.'+c))).join(' ')}</p>`:`<p class="note">${tr('p.clean')}</p>`}</section>
    ${securityPanel(list)}</div></div>`;
}
function timeline(items,compact){
  return `<div class="tl">${items.map(r=>`<div class="ti"><div class="ti-h">${compact?'':`<button class="link mono" data-go="plugin" data-arg="${esc(r.plugin)}">${esc(r.plugin)}</button>`}<b class="mono">v${r.ver}</b><span class="dim" style="font-size:13px">${ago(r.days)}</span>${fresh(r.days)}</div>${r.notes.length?`<ul>${r.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}</div>`).join('')}</div>`;
}
function whatsNew(){return `<div class="eyebrow">${tr('new.eyebrow')}</div><h1 style="margin-top:8px">${tr('home.news')}</h1><p class="lead">${tr('new.lead')}</p><div style="margin-top:28px;max-width:720px">${timeline(RELEASES)}</div>`}
function start(){
  const settings=`{\n  "extraKnownMarketplaces": {\n    "${MKT}": { "source": { "source": "github", "repo": "${REPO}" } }\n  },\n  "enabledPlugins": {\n    "${EX()}@${MKT}": true\n  }\n}`;
  const steps=[[tr('st.1'),tr('st.1d'),addCmd],[tr('st.2'),tr('st.2d'),installCmd(EX())],[tr('st.3'),tr('st.3d'),'/reload-plugins'],[tr('st.4'),tr('st.4d'),'claude plugin list']];
  return `<div class="eyebrow">${tr('st.eyebrow')}</div><h1 style="margin-top:8px">${tr('st.title')}</h1><p class="lead">${tr('st.lead')}</p>
  <div style="margin-top:24px"><div class="tabs" role="tablist"><button role="tab" data-tab="cli" aria-selected="${S.tab==='cli'}">${tr('st.me')}</button><button role="tab" data-tab="team" aria-selected="${S.tab==='team'}">${tr('st.team')}</button></div>
  ${S.tab==='cli'?`<div class="steps" style="max-width:720px">${steps.map((s,i)=>`<div class="step"><i>${i+1}</i><div style="min-width:0"><h3>${s[0]}</h3><p class="muted" style="margin:2px 0 8px">${s[1]}</p>${codeBlock(s[2])}</div></div>`).join('')}</div>`
  :`<div style="max-width:720px"><p class="muted" style="margin-top:0">${tr('st.teamHint')}</p>${codeBlock(settings)}</div>`}</div>`;
}
function saved(){
  const list=A.filter(a=>S.saved.has(a.id));
  return `<h1>${tr('sv.title')}</h1><p class="lead">${tr('sv.lead')}</p><div style="margin-top:24px">${list.length?`<div class="grid">${list.map(a=>card(a)).join('')}</div>`:`<div class="empty"><h3>${tr('sv.empty')}</h3><p style="margin:0 0 14px">${tr('sv.hint')}</p><button class="btn sm" data-go="catalog">${tr('sv.toCatalog')}</button></div>`}</div>`;
}
function install(){
  const sel=[...S.cart], sh=[addCmd,...sel.map(installCmd)].join('\n'), js=`{\n  "extraKnownMarketplaces": {\n    "${MKT}": { "source": { "source": "github", "repo": "${REPO}" } }\n  },\n  "enabledPlugins": {\n${sel.map(p=>`    "${p}@${MKT}": true`).join(',\n')}\n  }\n}`;
  return `<h1>${tr('kit.title')}</h1><p class="lead">${tr('kit.lead')}</p>
  <div class="cols"><div class="stack"><section class="panel"><h3>${tr('kit.selected',{n:sel.length})}</h3>${sel.length?sel.map(n=>{const p=plug(n);return `<div class="sel"><button class="link mono" data-go="plugin" data-arg="${n}">${n}</button><span class="dim mono" style="font-size:12px">v${p.ver}</span>${healthPill(p)}<span style="flex:1"></span><button class="btn ghost sm" data-cart="${n}">${tr('kit.remove')}</button></div>`}).join(''):`<div class="empty" style="border:0;padding:24px 0"><h3>${tr('kit.empty')}</h3><p style="margin:0 0 14px">${tr('kit.emptyHint')}</p><button class="btn sm" data-go="catalog">${tr('sv.toCatalog')}</button></div>`}</section></div>
  <div class="stack"><section class="panel"><div class="tabs"><button data-inst="sh" aria-selected="${S.inst==='sh'}">${tr('kit.script')}</button><button data-inst="json" aria-selected="${S.inst==='json'}">settings.json</button></div>
  ${sel.length?codeBlock(S.inst==='sh'?sh:js):`<p class="muted" style="margin:0">${tr('kit.addOne')}</p>`}</section></div></div>`;
}
function contribute(){
  const tpl=`---\nname: my-skill\ndescription: One sentence: when this skill is needed\nallowed-tools: Read, Grep\nkeywords: keyword, synonym\n---\n\nInstructions for Claude...`;
  return `<div class="eyebrow">${tr('c.eyebrow')}</div><h1 style="margin-top:8px">${tr('c.title')}</h1><p class="lead">${tr('c.lead')}</p>
  <div class="two" style="margin-top:26px"><a class="panel" href="https://github.com/${REPO}/issues/new" target="_blank" rel="noopener noreferrer"><h3>${tr('c.propose')}</h3><p class="muted" style="margin:0">${tr('c.proposeD')}</p></a>
  <a class="panel" href="https://github.com/${REPO}/issues/new" target="_blank" rel="noopener noreferrer"><h3>${tr('c.report')}</h3><p class="muted" style="margin:0">${tr('c.reportD')}</p></a></div>
  <section class="sec" style="max-width:720px"><h2>${tr('c.tpl')}</h2><p class="muted">${tr('c.tplD')}</p>${codeBlock(tpl)}</section>`;
}
function notFound(){return `<div class="empty" style="margin-top:40px"><h3>${tr('nf.title')}</h3><p style="margin:0 0 14px">${tr('nf.hint')}</p><button class="btn sm" data-go="home">${tr('nf.home')}</button></div>`}

/* ---------- router ---------- */
function render(){
  const r=S.route;
  app.innerHTML=r==='home'?home():r==='catalog'?catalog():r==='artifact'?artifact(byId[S.arg]):r==='plugin'?(plug(S.arg)?pluginPage(plug(S.arg)):notFound()):r==='new'?whatsNew():r==='start'?start():r==='saved'?saved():r==='install'?install():r==='contribute'?contribute():notFound();
  document.querySelectorAll('[data-nav]').forEach(b=>b.setAttribute('aria-current',b.dataset.nav===r?'page':'false'));
  $('#cartCnt').textContent=S.cart.size;
  const gq=$('#gq'); if(gq.value!==S.q&&document.activeElement!==gq)gq.value=S.q;
}
const ROUTES=['home','catalog','new','start','saved','install','contribute'];
function toHash(){
  const r=S.route;
  if(r==='home')return '#/';
  if(r==='catalog'){const p=new URLSearchParams();if(S.q)p.set('q',S.q);if(S.f.type.size)p.set('type',[...S.f.type].join(','));['cat','plugin','tag'].forEach(k=>S.f[k]&&p.set(k,S.f[k]));const q=p.toString();return '#/catalog'+(q?'?'+q:'')}
  if(r==='artifact')return '#/a/'+encodeURIComponent(S.arg);
  if(r==='plugin')return '#/p/'+encodeURIComponent(S.arg);
  return '#/'+r;
}
function applyHash(){
  const h=location.hash.replace(/^#\/?/,''),[path,qs='']=h.split('?'),i=path.indexOf('/'),head=i<0?path:path.slice(0,i),rest=i<0?'':decodeURIComponent(path.slice(i+1));
  S.arg=null;
  if(!head)S.route='home';
  else if(head==='a'&&rest){S.route='artifact';S.arg=rest}
  else if(head==='p'&&rest){S.route='plugin';S.arg=rest}
  else if(ROUTES.includes(head))S.route=head;
  else S.route='404';
  if(S.route==='catalog'){const p=new URLSearchParams(qs);S.q=p.get('q')||'';S.f={type:new Set((p.get('type')||'').split(',').filter(x=>TYPE_IDS.includes(x))),cat:p.get('cat'),plugin:p.get('plugin'),tag:p.get('tag')};$('#gq').value=S.q}
}
function go(route,arg=null,keep=false){
  S.route=route;S.arg=arg;const h=toHash();
  if(keep){history.replaceState(null,'',h);render();return}
  if(location.hash===h){render();scrollTo(0,0);return}
  location.hash=h;
}
addEventListener('hashchange',()=>{if(!READY)return;applyHash();render();scrollTo(0,0)});
function search(q){S.q=q;$('#gq').value=q;go('catalog',null,S.route==='catalog')}

document.addEventListener('click',e=>{
  if(!READY)return;
  const t=e.target.closest('[data-copy],[data-cart],[data-save],[data-go],[data-open],[data-q],[data-f],[data-clear],[data-stat],[data-tab],[data-inst]');
  if(!t)return;
  if(t.dataset.copy!==undefined){e.stopPropagation();copy(t.dataset.copy,t.classList.contains('cp')?t:null);return}
  if(t.dataset.cart){e.stopPropagation();const n=t.dataset.cart;S.cart.has(n)?S.cart.delete(n):S.cart.add(n);persist();toast(S.cart.has(n)?tr('toast.added'):tr('toast.removed'));const y=scrollY;render();scrollTo(0,y);return}
  if(t.dataset.save){e.stopPropagation();const n=t.dataset.save;S.saved.has(n)?S.saved.delete(n):S.saved.add(n);persist();const y=scrollY;render();scrollTo(0,y);return}
  if(t.dataset.go){go(t.dataset.go,t.dataset.arg||null);if(t.dataset.go==='catalog'){}return}
  if(t.dataset.open){go('artifact',t.dataset.open);return}
  if(t.dataset.q){search(t.dataset.q);return}
  if(t.dataset.stat){S.q='';$('#gq').value='';S.f={type:new Set([t.dataset.stat]),cat:null,plugin:null,tag:null};go('catalog');return}
  if(t.dataset.clear!==undefined){S.f={type:new Set(),cat:null,plugin:null,tag:null};go('catalog',null,true);return}
  if(t.dataset.f){const k=t.dataset.f,v=t.dataset.v;if(k==='type'){S.f.type.has(v)?S.f.type.delete(v):S.f.type.add(v)}else S.f[k]=S.f[k]===v?null:v;const y=scrollY;go('catalog',null,true);scrollTo(0,y);return}
  if(t.dataset.tab){S.tab=t.dataset.tab;render();return}
  if(t.dataset.inst){S.inst=t.dataset.inst;render();return}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.card')){go('artifact',e.target.dataset.open)}});
document.addEventListener('submit',e=>{if(e.target.id==='hform'){e.preventDefault();if(READY)search($('#hq').value)}});
$('#gq').addEventListener('input',e=>{if(!READY)return;S.q=e.target.value;go('catalog',null,S.route==='catalog')});
$('#gq').addEventListener('keydown',e=>{if(e.key==='Enter'&&READY&&S.route!=='catalog')go('catalog')});
const applyTheme=t=>{if(t==='light')document.documentElement.setAttribute('data-theme','light');else document.documentElement.removeAttribute('data-theme');$('#themeBtn').textContent=t==='light'?tr('theme.dark'):tr('theme.light')};
let theme='dark';try{theme=localStorage.getItem('dd-theme')||'dark'}catch(e){}
$('#themeBtn').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';applyTheme(theme);try{localStorage.setItem('dd-theme',theme)}catch(e){}});
(async()=>{
  app.innerHTML='<p class="muted" style="padding:40px 0">Loading…</p>';
  await loadLocales();
  try{await loadCatalog()}catch(e){
    app.innerHTML='<div class="empty" style="margin-top:40px"><h3>Could not load the catalog</h3><p style="margin:0">The data files could not be loaded. Check that the <span class="mono">data/</span> folder is next to this page.</p></div>';return}
  
  [...S.cart].forEach(n=>{if(!plug(n))S.cart.delete(n)});[...S.saved].forEach(id=>{if(!byId[id])S.saved.delete(id)});
  READY=true;applyStatic();applyHash();render();
})();

