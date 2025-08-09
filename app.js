const state = { db:null, view:'top' };
function $(sel){ return document.querySelector(sel); }
function e(tag, cls){ const el = document.createElement(tag); if(cls) el.className=cls; return el; }

async function loadDB(){
  const res = await fetch('db.json', {cache:'no-store'});
  state.db = await res.json();
  renderTop(); renderUnits(); renderNews();
}

// Classement S+ > S > A…
function rankWeight(rank){
  const r = (rank||'').replace('LR ','').replace('TUR ','').trim();
  const order = {'S+':0,'S':1,'A+':2,'A':3,'B':4,'C':5};
  return (order[r] ?? 99);
}

// Cartes « Top »
function renderTop(){
  const rarity = $('#top-rarity').value;
  const list = $('#top-list'); list.innerHTML='';
  const units = (state.db?.units||[]).filter(u=>u.rarity===rarity)
    .sort((a,b)=> rankWeight(a.tier?.rank)-rankWeight(b.tier?.rank) || a.name.localeCompare(b.name));
  units.forEach(u=> list.appendChild(unitCard(u, true)));
}

// Liste + recherche/filtres
function renderUnits(){
  const q = $('#search').value?.toLowerCase() || '';
  const fr = $('#filter-rarity').value;
  const ft = $('#filter-type').value;
  const list = $('#units-list'); list.innerHTML='';
  (state.db?.units||[])
    .filter(u=> (!q || u.name.toLowerCase().includes(q)) && (!fr || u.rarity===fr) && (!ft || u.type===ft))
    .sort((a,b)=> a.name.localeCompare(b.name))
    .forEach(u=> list.appendChild(unitCard(u, false)));
}

// Nouveautés
function renderNews(){
  const list = $('#news-list'); list.innerHTML='';
  (state.db?.news||[]).sort((a,b)=> b.date.localeCompare(a.date)).forEach(n=>{
    const card = e('div','card');
    card.innerHTML = `
      <h3>${n.title}</h3>
      <div class="meta">${n.date}</div>
      <p>${n.description}</p>
      <a href="${n.url}" target="_blank" rel="noopener">Voir la source</a>
    `;
    list.appendChild(card);
  });
}

// Fiche carte
function unitCard(u, compact){
  const card = e('div','card');
  const h = e('h3'); h.textContent = u.name; card.appendChild(h);
  const meta = e('div','meta'); meta.textContent = `${u.rarity} • ${u.type}${u.tier?.rank ? ' • '+u.tier.rank : ''}`; card.appendChild(meta);
  if(compact){
    const roles = e('div'); (u.roles||[]).forEach(r=>{ const b=e('span','badge'); b.textContent=r; roles.appendChild(b); }); card.appendChild(roles);
  }
  card.addEventListener('click', ()=> openModal(u));
  return card;
}

function openModal(u){
  const m = $('#modal'); const c = $('#modal-content');
  c.innerHTML = `
    <h2 style="margin:0 0 6px 0;">${u.name}</h2>
    <div class="meta">${u.rarity} • ${u.type} ${u.tier?.rank ? '• '+u.tier.rank : ''} ${u.tier?.source ? '• '+u.tier.source : ''}</div>
    <div class="section"><strong>Leader Skill</strong><br>${u.leaderSkill}</div>
    <div class="section"><strong>Passive</strong><br>${u.passive}</div>
    ${u.links?.length ? '<div class="section"><strong>Liens</strong><br>'+u.links.join(', ')+'</div>' : ''}
    ${u.categories?.length ? '<div class="section"><strong>Catégories</strong><br>'+u.categories.join(', ')+'</div>' : ''}
    ${(u.sources||[]).length ? '<div class="section"><strong>Sources</strong><br>'+u.sources.map(s=>'<a target="_blank" rel="noopener" href="'+s.url+'">'+s.label+'</a>').join(' • ')+'</div>' : ''}
  `;
  m.style.display='block';
}
function closeModal(){ $('#modal').style.display='none'; }

// Navigation
function switchView(name){
  state.view = name;
  document.querySelectorAll('.view').forEach(v=> v.style.display='none');
  $('#view-'+name).style.display='block';
  document.querySelectorAll('.tabbar button').forEach(b=> b.classList.remove('active'));
  $('#tab-'+name).classList.add('active');
  if(name==='top') renderTop();
  if(name==='cartes') renderUnits();
  if(name==='news') renderNews();
}

document.addEventListener('DOMContentLoaded', ()=>{
  $('#tab-top').addEventListener('click', ()=> switchView('top'));
  $('#tab-cartes').addEventListener('click', ()=> switchView('cartes'));
  $('#tab-news').addEventListener('click', ()=> switchView('news'));
  $('#top-rarity').addEventListener('change', renderTop);
  $('#search').addEventListener('input', renderUnits);
  $('#filter-rarity').addEventListener('change', renderUnits);
  $('#filter-type').addEventListener('change', renderUnits);
  $('#modal-close').addEventListener('click', closeModal);
  loadDB();
});
