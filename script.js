document.getElementById('year').textContent = new Date().getFullYear();

// Scroll animations
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in, .slide-up, .timeline-item').forEach(el => observer.observe(el));

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
  try{
    const res = await fetch('projects.json');
    const list = await res.json();
    allProjects = list;
    renderFilters(list);
    currentProjects = applyFilters(list);
    renderCarousel(currentProjects);
  }catch(e){
    console.error('Erreur chargement projets:', e);
    document.getElementById('projects-track').innerHTML = '<p>Erreur lors du chargement des projets. Assurez-vous que projects.json existe.</p>';
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
