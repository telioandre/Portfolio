# Générateur d'incidents ServiceNow – Détails du projet

## Contexte – Stage Devoteam 2023

**Durée :** 2 mois (juin-juillet 2023) chez **Devoteam**, cabinet de conseil IT leader en transformation digitale et cloud.

**Problématique :** La plateforme ServiceNow (ITSM – IT Service Management) nécessitait un volume important **d'incidents de test** pour :
- Valider les configurations de flux de travail (workflows)
- Tester les règles d'assignation automatique
- Entraîner les utilisateurs sans données réelles
- Valider les rapports et dashboards

**Objectif :** Développer un **générateur d'incidents automatisé** capable de créer et importer des centaines d'incidents avec données réalistes et variées.

---

## Architecture et Technologies

**Stack technique :**
- **Langage :** Python 3.8+
- **Librairies :** pandas, requests, random, datetime
- **Source de données :** Fichiers CSV, base de données Sonepar
- **Intégration :** API REST ServiceNow (table `incident`)
- **Environnement :** Windows (scripts batch), exécution manuelle ou planifiée

---

## Fonctionnalités développées

### 1. Génération de données d'incidents

Script Python générant des incidents aléatoires avec les champs critiques ServiceNow :
- Numéro unique (INC)
- Description courte et détaillée
- Catégorie, sous-catégorie
- Priorité, urgence, impact
- Dates d'ouverture/fermeture réalistes
- Groupe d'assignation et utilisateur

Approche probabiliste : création d'incidents variés avec différentes combinaisons de champs pour tester la robustesse du système ServiceNow.

![Slider nombre d'incidents](/assets/images/snow_nombre.png)
*Slider pour déterminer le nombre d'incidents à générer (1-1000)*

![Répartition impact](/assets/images/snow_impact.png)
*Configuration de la répartition des impacts (low/medium/high) via sliders*

![Graphique catégories](/assets/images/snow_graph.png)
*Exemple de diagramme circulaire : répartition des catégories pour 10 incidents générés (Inquiry 40%, Hardware 30%, Database 20%, Software 10%)*

### 2. Intégration API ServiceNow

Importation automatique dans ServiceNow via ses **Web Services REST** :
- Authentification par credentials (username/password base64)
- Mappings priorités : conversion texte français ↔ numéros ServiceNow
- Gestion erreurs et retry automatique
- Logs traçabilité complets

### 3. Validation et nettoyage des données

Avant import :
- Vérification champs obligatoires
- Validation format et longueur des descriptions
- Contrôle cohérence des dates
- Vérification catégories valides selon configuration ServiceNow
- Export CSV intermédiaire pour audit

### 4. Script batch pour automatisation

Exécution manuelle ou planifiée (Windows batch/scheduler) :
- Import CSV
- Génération et validation
- Appels API ServiceNow
- Logs détaillés (fichier + console)
- Reporting erreurs

![Vue table ServiceNow](/assets/images/snow.png)
*Vue de la table incident dans ServiceNow après génération : champs parent, made_sla, caused_by, watch_list, upon_reject, sys_updated_on, child_incidents, hold_reason visibles*

---

## Résultats et impact

### Performance réelle
- Génération incidents : création en masse via pandas
- Import ServiceNow : appels API REST batch
- Gestion erreurs et logging pour traçabilité

### Apports business
✅ Tests workflow d'escalade automatiques  
✅ Validation règles d'assignation (groupe → utilisateur)  
✅ Formation utilisateurs sans données sensibles  
✅ Rapports dashboard avec données réalistes  
✅ Économies de temps en phase de configuration ServiceNow

---

## Compétences développées

- **Python :** pandas, requests, intégrations API
- **ServiceNow :** Web Services REST, API incident, champs et workflows
- **ITSM :** concepts incidents, priorités, SLA, assignation groupes
- **Gestion données :** validation, nettoyage, export/import CSV
- **Déploiement :** scripts batch, planification tâches Windows
