document.getElementById('year').textContent = new Date().getFullYear();

// Fallback local si le fichier est ouvert en file:// (CORS bloque fetch)
const FALLBACK_PROJECTS = [
  {"title":"Quoridor 2D","description":"Jeu de plateau Quoridor réalisé en Python (2D) avec gestion des règles et moteur de déplacement.","tech":["Python","Pygame"],"repoUrl":"","liveUrl":"","image":"assets/images/quoridor.png"},
  {"title":"Age of Stick 2D","description":"Jeu vidéo 2D sous Unity avec logiques de combat, niveaux et assets personnalisés.","tech":["C#","Unity"],"repoUrl":"","liveUrl":"","image":"assets/images/age-of-war.png"},
  {"title":"Messagerie temps réel","description":"Clone léger de Teams/Discord en fullstack (Node.js + React) avec messagerie temps réel et version mobile.","tech":["Node.js","Express","Socket.IO","React","MongoDB","React Native"],"repoUrl":"","liveUrl":"","image":"assets/images/chat-app.png"},
  {"title":"Stockage type Google Drive (en cours)","description":"Application web de stockage/partage de fichiers (projet en cours) avec gestion des droits et upload.","tech":["React","Node.js","MongoDB","Cloud Storage"],"repoUrl":"","liveUrl":"","image":"assets/images/drive-like.png"},
  {"title":"REST APIs multi-stack","description":"Divers services REST réalisés en PHP, React et C# pour explorer plusieurs stacks backend/frontend.","tech":["PHP Laravel","React","C#","ASP.NET"],"repoUrl":"","liveUrl":"","image":"assets/images/rest-apis.png"},
  {"title":"Téléphone IoT","description":"Prototype de téléphone IoT avec connectivité et pilotage embarqué.","tech":["IoT","C++","Arduino"],"repoUrl":"","liveUrl":"","image":"assets/images/iot-phone.png"},
  {"title":"Application mobile Kotlin","description":"Application Android Kotlin développée sous Android Studio (UI native, navigation, stockage local).","tech":["Kotlin","Android Studio"],"repoUrl":"","liveUrl":"","image":"assets/images/kotlin-app.png"},
  {"title":"Générateur d'incidents ServiceNow","description":"Application Python (pandas) générant des incidents aléatoires pour ServiceNow afin de simuler des flux de support.","tech":["Python","Pandas","ServiceNow"],"repoUrl":"","liveUrl":"","image":"assets/images/servicenow-generator.png"},
  {"title":"Data WPS/SAS + Power BI","description":"Création/gestion de tables via WPS (SAS), macros et variables, puis rapport Power BI alimenté chaque mois via Power Automate (CI/CD).","tech":["SAS","WPS","SQL","Power BI","Power Automate"],"repoUrl":"","liveUrl":"","image":"assets/images/wps-powerbi.png"},
  {"title":"Automatisation Excel vers une template","description":"Script d'automatisation pour extraire des données Excel et les redistribuer dynamiquement dans un template.","tech":["VBA","Automation"],"repoUrl":"","liveUrl":"","image":"assets/images/excel-automation.png"},
  {"title":"Bot Discord","description":"Bot Discord lié au divertissement avec diverses commandes personnalisées.","tech":["Node.js","Discord.js"],"repoUrl":"","liveUrl":"","image":"assets/images/discord-bot.png"}
];

let currentProjects = [];
let currentIndex = 0;
let allProjects = [];
let activeTag = 'Tout';
let searchTerm = '';

function baseVisibleSlides(){
  const w = window.innerWidth || document.documentElement.clientWidth;
  if(w <= 640) return 1;
  if(w <= 960) return 2;
  return 3;
}

function debounce(fn, ms){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), ms);
  };
}

function slugify(str){
  return (str||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

async function loadProjects(){
  if(window.location.protocol === 'file:'){
    allProjects = FALLBACK_PROJECTS;
    renderFilters(allProjects);
    currentProjects = applyFilters(allProjects);
    renderCarousel(currentProjects);
    return;
  }

  try{
    const res = await fetch('projects.json');
    const list = await res.json();
    allProjects = list;
    renderFilters(list);
    currentProjects = applyFilters(list);
    renderCarousel(currentProjects);
  }catch(e){
    allProjects = FALLBACK_PROJECTS;
    renderFilters(FALLBACK_PROJECTS);
    currentProjects = applyFilters(FALLBACK_PROJECTS);
    renderCarousel(currentProjects);
  }
}

function renderCarousel(list){
  const track = document.getElementById('projects-track');
  const dots = document.getElementById('projects-dots');

  if(!Array.isArray(list) || list.length===0){
    track.innerHTML = '<p>Aucun projet pour le moment.</p>';
    dots.innerHTML = '';
    return;
  }

  const visibleBase = baseVisibleSlides();
  const visible = Math.min(visibleBase, list.length || 1);
  const slideWidth = 100 / visible;
  track.innerHTML = list.map(p => `<div class="slide" style="flex:0 0 ${slideWidth}%;max-width:${slideWidth}%">${cardHTML(p)}</div>`).join('');

  const maxIndex = Math.max(0, list.length - visible);
  const pageCount = maxIndex + 1;
  dots.innerHTML = Array.from({length: pageCount}, (_,i)=>`<button data-index="${i}" class="${i===0?'active':''}"></button>`).join('');

  currentIndex = 0;
  updateCarousel();

  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');

  prevBtn.onclick = () => move(-1);
  nextBtn.onclick = () => move(1);
  dots.onclick = (e)=>{
    if(e.target.tagName!=='BUTTON') return;
    currentIndex = Number(e.target.dataset.index);
    updateCarousel();
  };

  window.addEventListener('resize', debounce(()=>{
    const filtered = applyFilters(allProjects);
    currentProjects = filtered;
    const visibleBase2 = baseVisibleSlides();
    const visible2 = Math.min(visibleBase2, filtered.length || 1);
    const maxIndex2 = Math.max(0, filtered.length - visible2);
    if(currentIndex > maxIndex2) currentIndex = maxIndex2;
    renderCarousel(filtered);
  }, 150));
}

function move(step){
  const visibleBase = baseVisibleSlides();
  const visible = Math.min(visibleBase, currentProjects.length || 1);
  const maxIndex = Math.max(0, currentProjects.length - visible);
  const pageCount = maxIndex + 1;
  currentIndex = (currentIndex + step + pageCount) % pageCount;
  updateCarousel();
}

function updateCarousel(){
  const track = document.getElementById('projects-track');
  const dots = document.getElementById('projects-dots').querySelectorAll('button');
  const visibleBase = baseVisibleSlides();
  const visible = Math.min(visibleBase, currentProjects.length || 1);
  const offset = -currentIndex * (100 / visible);
  track.style.transform = `translateX(${offset}%)`;
  dots.forEach((d,i)=> d.classList.toggle('active', i===currentIndex));
}

function cardHTML(p){
  const slug = slugify(p.title||'');
  const img = p.image ? `<a href="project.html?slug=${encodeURIComponent(slug)}"><img src="${p.image}" alt="${p.title}"/></a>` : '';
  const tags = (p.tech||[]).map(t=>`<li>${t}</li>`).join('');
  const links = [
    p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" rel="noreferrer">Démo</a>` : '',
    p.repoUrl ? `<a href="${p.repoUrl}" target="_blank" rel="noreferrer">Code</a>` : ''
  ].filter(Boolean).join('');
  return `
    <article class="card">
      <div class="thumb">${img}</div>
      <div class="body">
        <h3><a href="project.html?slug=${encodeURIComponent(slug)}">${p.title||''}</a></h3>
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
  const tags = Array.from(allTags).sort();
  const buttons = ['Tout', ...tags];
  filtersEl.innerHTML = `
    <input id="project-search" class="search" type="search" placeholder="Rechercher un projet ou une techno" aria-label="Recherche" />
    ${buttons.map(b=>`<button data-tag="${b}">${b}</button>`).join('')}
  `;
  
  filtersEl.addEventListener('click', e => {
    if(e.target.tagName!== 'BUTTON') return;
    activeTag = e.target.dataset.tag;
    Array.from(filtersEl.querySelectorAll('button')).forEach(btn=>btn.classList.toggle('active', btn.dataset.tag===activeTag));
    const filtered = applyFilters(allProjects);
    currentProjects = filtered;
    renderCarousel(filtered);
  });

  const searchInput = document.getElementById('project-search');
  searchInput.addEventListener('input', e => {
    searchTerm = (e.target.value||'').trim().toLowerCase();
    const filtered = applyFilters(allProjects);
    currentProjects = filtered;
    renderCarousel(filtered);
  });

  const first = filtersEl.querySelector('button');
  if(first) first.classList.add('active');
}

function applyFilters(list){
  let out = Array.isArray(list) ? list.slice() : [];
  if(activeTag && activeTag !== 'Tout'){
    out = out.filter(p => (p.tech||[]).some(t => t === activeTag));
  }
  if(searchTerm){
    out = out.filter(p => {
      const title = (p.title||'').toLowerCase();
      const techs = (p.tech||[]).map(t=>String(t).toLowerCase());
      return title.includes(searchTerm) || techs.some(t=>t.includes(searchTerm));
    });
  }
  return out;
}

loadProjects();
