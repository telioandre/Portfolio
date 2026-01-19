document.getElementById('year').textContent = new Date().getFullYear();

function slugify(str){
  return (str||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

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
  if(window.location.protocol === 'file:'){
    list = FALLBACK_PROJECTS;
  }else{
    try{
      const res = await fetch('projects.json');
      list = await res.json();
    }catch{
      list = FALLBACK_PROJECTS;
    }
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

  // Charger un fichier markdown de détails s'il existe
  const slugified = slugify(project.title);
  const detailsPath = `content/projects/${slugified}.md`;
  try{
    const res = await fetch(detailsPath);
    if(res.ok){
      const md = await res.text();
      const html = window.marked ? window.marked.parse(md) : md.replace(/\n/g,'<br>');
      const detailsEl = document.getElementById('details');
      detailsEl.innerHTML = html;
      // Générer une table des matières à partir des h2/h3
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

  // Navigation précédent / suivant
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
