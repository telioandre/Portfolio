document.getElementById('year').textContent = new Date().getFullYear();

async function loadProjects(){
  try{
    const res = await fetch('projects.json');
    const list = await res.json();
    renderFilters(list);
    renderGrid(list);
  }catch(e){
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '<p>Impossible de charger les projets. Vérifiez le fichier projects.json.</p>';
  }
}

function renderGrid(list){
  const grid = document.getElementById('projects-grid');
  if(!Array.isArray(list) || list.length===0){
    grid.innerHTML = '<p>Aucun projet pour le moment.</p>';
    return;
  }
  grid.innerHTML = list.map(p => cardHTML(p)).join('');
}

function cardHTML(p){
  const img = p.image ? `<img src="${p.image}" alt="${p.title}"/>` : '';
  const tags = (p.tech||[]).map(t=>`<li>${t}</li>`).join('');
  const links = [
    p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noreferrer">Démo</a>` : '',
    p.repoUrl ? `<a href="${p.repoUrl}" target="_blank" rel="noreferrer">Code</a>` : ''
  ].filter(Boolean).join('');
  return `
    <article class="card">
      <div class="thumb">${img}</div>
      <div class="body">
        <h3>${p.title||''}</h3>
        <p>${p.description||''}</p>
        <ul class="tags">${tags}</ul>
        <div class="links">${links}</div>
      </div>
    </article>`;
}

function renderFilters(list){
  const filtersEl = document.getElementById('filters');
  const allTags = new Set();
  list.forEach(p=> (p.tech||[]).forEach(t=>allTags.add(t)));
  const tags = Array.from(allTags);
  const buttons = ['Tout', ...tags];
  let active = 'Tout';
  filtersEl.innerHTML = buttons.map(b=>`<button data-tag="${b}">${b}</button>`).join('');
  filtersEl.addEventListener('click', e => {
    if(e.target.tagName!== 'BUTTON') return;
    active = e.target.dataset.tag;
    Array.from(filtersEl.querySelectorAll('button')).forEach(btn=>btn.classList.toggle('active', btn.dataset.tag===active));
    const filtered = active==='Tout' ? list : list.filter(p => (p.tech||[]).includes(active));
    renderGrid(filtered);
  });
  const first = filtersEl.querySelector('button');
  if(first) first.classList.add('active');
}

loadProjects();
