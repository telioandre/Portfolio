document.getElementById('year').textContent = new Date().getFullYear();

const scrollToTopBtn = document.getElementById('scroll-to-top');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    scrollToTopBtn.classList.add('visible');
  } else {
    scrollToTopBtn.classList.remove('visible');
  }
});

scrollToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

function slugify(str){
  return (str||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}



function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function loadProject(){
  const slug = getParam('slug');
  const container = document.getElementById('project');
  const nav = document.getElementById('project-nav');
  if(!slug){
    container.innerHTML = `<p>Aucun projet spécifié.</p><p><a class="btn" href="index.html#projects">← Retour aux projets</a></p>`;
    return;
  }

  let list = [];
  try{
    const res = await fetch('projects.json');
    list = await res.json();
  }catch(e){
    console.error('Erreur chargement projets:', e);
    container.innerHTML = `<p>Erreur lors du chargement du projet. Assurez-vous que projects.json existe.</p><p><a class="btn" href="index.html#projects">← Retour aux projets</a></p>`;
    return;
  }

  const project = list.find(p => slugify(p.title) === slug);
  if(!project){
    container.innerHTML = `<p>Projet introuvable.</p><p><a class="btn" href="index.html#projects">← Retour aux projets</a></p>`;
    return;
  }

  const tags = (project.tech||[]).map(t=>`<li>${t}</li>`).join('');
  const img = project.image ? `<img src="${project.image}" alt="${project.title}">` : '';
  const links = [
    project.liveUrl ? `<a class="btn" href="${project.liveUrl}" target="_blank" rel="noreferrer">Voir la démo</a>` : '',
    project.repoUrl ? `<a class="btn" href="${project.repoUrl}" target="_blank" rel="noreferrer">Voir le code</a>` : ''
  ].filter(Boolean).join(' ');

  container.innerHTML = `
    <nav style="margin-bottom:16px"><a class="btn" href="index.html#projects">← Retour aux projets</a></nav>
    <header style="margin-bottom:16px">
      <h1 style="margin:0 0 8px">${project.title}</h1>
      <p style="color:var(--muted);max-width:800px">${project.description||''}</p>
    </header>
    <div class="project-hero" style="border:1px solid var(--border);border-radius:16px;overflow:hidden;background:var(--panel);margin-bottom:16px">${img}</div>
    <section>
      <h3>Technologies</h3>
      <ul class="tags">${tags}</ul>
    </section>
    ${links ? `<section style="margin-top:16px">${links}</section>` : ''}
    <section style="margin-top:24px">
      <h3>Détails</h3>
      <article id="details" class="prose">Chargement des détails…</article>
    </section>
  `;

  const slugified = slugify(project.title);
  const detailsPath = `content/projects/${slugified}.md`;
  try{
    const res = await fetch(detailsPath);
    if(res.ok){
      const md = await res.text();
      let html = window.marked ? window.marked.parse(md) : md.replace(/\n/g,'<br>');
      const baseUrl = window.location.pathname.includes('/Portfolio/') ? '/Portfolio/' : '/';
      html = html.replace(/src="assets\//g, `src="${baseUrl}assets/`);
      html = html.replace(/src='assets\//g, `src='${baseUrl}assets/`);
      html = html.replace(/href="assets\//g, `href="${baseUrl}assets/`);
      html = html.replace(/href='assets\//g, `href='${baseUrl}assets/`);
      const detailsEl = document.getElementById('details');
      detailsEl.innerHTML = html;

      const headings = detailsEl.querySelectorAll('h2, h3');
      if(headings.length){
        const toc = document.createElement('nav');
        toc.className = 'prose';
        const listEl = document.createElement('ul');
        headings.forEach(h => {
          const id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
          h.id = id;
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `#${id}`;
          a.textContent = h.textContent;
          li.appendChild(a);
          listEl.appendChild(li);
        });
        toc.appendChild(listEl);
        detailsEl.prepend(toc);
      }
    }else{
      document.getElementById('details').innerHTML = 'Aucun détail supplémentaire.';
    }
  }catch{
    document.getElementById('details').innerHTML = 'Aucun détail supplémentaire.';
  }

  const slugs = list.map(p => slugify(p.title));
  const idx = slugs.indexOf(slugified);
  const prev = idx > 0 ? slugs[idx-1] : null;
  const next = idx < slugs.length-1 ? slugs[idx+1] : null;
  nav.innerHTML = `
    ${prev ? `<a href="project.html?slug=${encodeURIComponent(prev)}">← Précédent</a>` : '<span></span>'}
    ${next ? `<a href="project.html?slug=${encodeURIComponent(next)}">Suivant →</a>` : '<span></span>'}
  `;
}

loadProject();
