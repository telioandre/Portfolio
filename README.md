# Mon Portfolio

🔗 **Site Live** : https://telioandre.github.io/Portfolio/

## À propos

Portfolio personnel minimaliste pour montrer mes projets informatiques. Léger, rapide et facilement customizable en HTML/CSS/JS pur.

## Structure

```
.
├── index.html           # Page d'accueil
├── project.html         # Page détail projet (charge le markdown dynamiquement)
├── styles.css           # Design minimaliste
├── script.js            # Logique d'affichage et de filtres
├── project.js           # Loader markdown + conversion marked.js + corrections chemins assets
├── projects.json        # Meta data des projets (titre, tech, images, liens)
├── content/projects/    # Détails en Markdown (*.md) pour chaque projet
└── assets/
    ├── images/          # Screenshots et images des projets
    └── videos/          # Démos vidéo
```

## Fonctionnalités

- **Affichage dynamique** : Les projets se chargent depuis `projects.json`
- **Détails en Markdown** : Chaque projet a son fichier `.md` avec architecture, code, démos
- **Conversion automatique** : Marked.js convertit le Markdown → HTML avec gestion des chemins
- **Responsive** : Design adapté mobile/desktop
- **Filtres par tech** : Cliquez sur un tag pour filtrer les projets
- **Navigation entre projets** : Naviguez prev/next depuis la page détail

## Démarrage local

### Avec Python
```bash
python -m http.server 5500
# Accédez à http://localhost:5500
```

### Directement
Double-cliquez sur `index.html` (limité : pas de support markdown si en file://)

## Ajouter un projet

1. **Ajouter une entrée dans `projects.json`** :
```json
{
  "title": "Mon Projet",
  "description": "Courte description",
  "tech": ["Node.js", "React"],
  "image": "assets/images/mon-projet.png",
  "repoUrl": "https://github.com/...",
  "liveUrl": "https://..."
}
```

2. **Créer le fichier détail** : `content/projects/mon-projet.md` avec architecture, code, démos

3. **Ajouter les assets** :
   - Image d'illustration dans `assets/images/`
   - Vidéo de démo dans `assets/videos/` (optionnel)

**Note** : Les chemins dans le Markdown doivent être `assets/...` (sans `./`). La conversion JS les préfixe automatiquement avec `/Portfolio/` en prod.

## Déploiement GitHub Pages

1. Push sur GitHub
2. Settings → Pages → Source = `main` branch, `/root`
3. Attendez ~1-2 min, site live à `https://[username].github.io/Portfolio/`

## Détails techniques

- **Marked.js** : Convertit Markdown → HTML côté client
- **Rechargement URL** : `project.html?slug=mon-projet` charge dynamiquement le markdown
- **Correction des chemins** : `project.js` détecte la base URL (`/Portfolio/` en prod) et adapte les `src/href`
- **Table of contents** : Générée automatiquement à partir des h2/h3 du markdown
