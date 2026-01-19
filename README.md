# Portfolio

Un portfolio minimaliste et moderne pour présenter vos projets informatiques.

## Personnalisation rapide
- Ouvrez `index.html` et remplacez "Votre Nom", l'e-mail et les liens.
- Modifiez `projects.json` pour ajouter/éditer vos projets (titre, description, technologies, liens, image).
- Ajoutez des images dans `assets/images/` et référencez-les dans `projects.json`.

## Prévisualisation locale
- Double-cliquez sur `index.html` pour l'ouvrir dans votre navigateur.
- Optionnel: servir en local pour éviter des restrictions CORS.

```powershell
# Avec Python (si installé)
python -m http.server 5500; Start-Process http://localhost:5500/index.html
```

## Déploiement GitHub Pages
1. Créez un dépôt sur GitHub et poussez ce dossier.
2. Dans GitHub, allez sur `Settings` > `Pages` > `Branch` = `main` (ou `master`) / `/root`.
3. Attendez 1-2 minutes; votre site sera accessible à l'URL indiquée.

## Structure
- `index.html` – Page principale
- `styles.css` – Styles globaux
- `script.js` – Rendu des projets et filtres
- `projects.json` – Données des projets
- `assets/images/` – Images des projets
