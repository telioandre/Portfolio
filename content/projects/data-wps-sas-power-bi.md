# Projet Data - WPS/SAS et Power BI

## 📋 Contexte du projet

Ce projet a été réalisé lors de mon **stage d'été 2024** (8 juillet - 30 septembre) dans une entreprise spécialisée en gestion des frais de santé. Intégré dans la **cellule Data Reporting**, j'ai travaillé avec une équipe de quatre Data Analysts/Scientists.

### Problématique

L'entreprise utilise actuellement un système de gestion historique, en cours de migration vers un nouvel outil moderne. Les bénéficiaires étant répartis entre les deux systèmes, il était nécessaire de créer une **vue portefeuille** centralisée sur le nouvel outil pour :

- Fournir une vision globale du nombre de bénéficiaires, contrats et polices
- Récupérer diverses métadonnées par entreprise et par pôle
- Historiser les chiffres clés pour suivre l'évolution dans le temps

L'objectif final était de permettre une analyse consolidée des entreprises bénéficiaires (plus d'un million de bénéficiaires répartis sur plus de 90 000 contrats), regroupées en pôles, avec des métadonnées enrichies.

---

## 🛠️ Architecture technique

### Technologies utilisées

**WPS (World Programming System)**
- Manipulation de jeux de données fournis par les systèmes internes
- Langage SAS pour traitement de données (SQL étendu sans contraintes strictes de clés primaires)
- Système de fichiers partagés pour l'import de tables de référence

**Power BI**
- Création de rapports interactifs avec visualisations dynamiques
- Power Query et langage DAX pour mesures et transformations
- Connexion directe aux données SharePoint

**SharePoint**
- Stockage centralisé des données traitées (fichiers Excel)
- Partage des outils, documentation et rendus entre équipes

**SQL**
- Requêtes pour jointures, filtres et agrégations
- Gestion des doublons et vérification d'intégrité des données

### Modèle de données

Le modèle repose sur **quatre entités centrées sur le client** (une entreprise = un client) :

1. **Entité Pôles** : Regroupement des entreprises, code APE (branche d'activité), unité de visibilité
2. **Entité Polices** : Risques couverts, portabilité (assurance temporaire après perte d'emploi), pôle associé
3. **Entité Contrats** : Date de début, numéro de police, risque couvert, pôle, gestion des filiales
4. **Entité Bénéficiaires** : Identité (nom, prénom, date naissance, genre), type (assuré principal, conjoint, enfant), e-mail, portabilité, état Noemie (télétransmission), entreprise/pôle

**Enjeux principaux** : Éviter la perte de données et les doublons, trouver une source de vérité unique, garantir l'intégrité des jointures.

---

## 🔧 Fonctionnalités développées

### 1. Construction des entités WPS/SAS

**Entité Pôles**
- Rattachement de chaque entreprise à un pôle via unité de visibilité (référentiel)
- Import d'une table de correspondance de codes APE depuis fichier externe
- Vérification anti-doublons : marquage "Hors Pôles" si entreprise associée à plusieurs pôles
- Macro-programme de vérification comptant les occurrences par ID unique et pôle associé

![Macro-programme de vérification des doublons](assets/images/data_doublons.png)
*Macro-programme vérifiant qu'une entreprise n'est associée qu'à un seul pôle*

**Entité Polices**
- Récupération des métadonnées : risques couverts, pôle, portabilité
- Filtrage des polices expirées pour ne conserver que les actives

**Entité Contrats**
- Date de début, numéro de police associé, risque couvert, pôle
- Résolution des doublons inexpliqués : certains clients étaient des filiales d'autres clients, expliquant les numéros de contrat partagés

**Entité Bénéficiaires**
- Informations personnelles : nom, prénom, date de naissance, genre, e-mail (si disponible)
- Calcul de la propension d'e-mails (taux de collecte par rapport au nombre total de bénéficiaires)
- Détermination du type de bénéficiaire (assuré principal, conjoint, enfant, autre)
- Récupération de la portabilité correcte pour le mois en cours via macro-variables (gestion de bénéficiaires enregistrés dans plusieurs garanties/polices)
- État Noemie : informations sur la télétransmission de chaque bénéficiaire
- Rattachement à l'entreprise et au pôle associé
- Gestion des doublons pour personnes travaillant à mi-temps (vérification croisée avec l'outil Open)

### 2. Système d'historisation

Pour répondre à la demande croissante d'historisation, j'ai créé des **tables intermédiaires** résumant chaque entité :
- Nombre d'entreprises, contrats, polices
- Nombre de bénéficiaires par type
- Vue consolidée par pôle
- Date de dernière mise à jour du programme

**Automatisation via macro-programmes**

*Macro 1 : Création de table d'historisation*
- Vérifie l'existence de la table de stockage
- Crée la structure si absente (prévention contre perte de données en cas de sinistre)
- Garantit le bon fonctionnement même si table supprimée accidentellement

*Macro 2 : Ajout des données quotidiennes*
- Utilise une table temporaire pour copier les données du jour
- Colle les données dans la table d'historisation
- Vérification de date pour éviter les doublons (une seule entrée par date)

![Macro-programme d'ajout à l'historique](assets/images/data_historique.png)
*Macro-programme automatisant l'ajout des données quotidiennes avec vérification de date*

### 3. Export et intégration SharePoint

Chaque table a été exportée sous forme de feuille dans un **fichier Excel unique**, déposé dans le système de fichiers partagé, puis transféré automatiquement vers **SharePoint** pour récupération dans Power BI.

### 4. Rapport Power BI interactif

**Transformations de données**
- Formatage des dates (conversion du format `yyyymmdd` non reconnu par Power BI)
- Création de colonnes conditionnelles pour tranches d'âge des bénéficiaires
- Regroupement de toutes les mesures dans une table dédiée (colonnes masquées pour simplifier l'interface utilisateur)

**Mesures DAX créées**
- Nombre de bénéficiaires, contrats, polices, entreprises
- Taux de télétransmission (état Noemie)
- Taux de collecte des e-mails
- Âge moyen des bénéficiaires
- Taux de croissance pour l'historisation

**Pages du rapport**

*Vue Entreprise*
- Vision détaillée par entreprise avec indicateurs clés
- Filtres dynamiques par pôle, contrat, risque

*Vue Pôle*
- Consolidation des données par pôle
- Comparaison entre pôles avec visualisations graphiques

*Historisation*
- Évolution temporelle des indicateurs
- Taux de croissance mois par mois
- Suivi des tendances

**Fonctionnalités avancées**
- **Signets** : Sauvegarde d'états de page pour basculer entre visualisations (par âge/par tranche d'âge)
- **Graphiques** : Répartition par tranche d'âge, télétransmission, collecte e-mails
- **Charte graphique** : Intégration de la charte visuelle de l'entreprise

![Rapport Power BI - Vue Pôle](assets/images/data_powerbi.png)
*Vue du rapport Power BI avec visualisations par tranches d'âge, genre, état Noemie et type de bénéficiaire*

**Détection d'anomalies**
Le rapport a révélé des erreurs dans les tables sources :
- Bénéficiaires avec date de naissance par défaut (01/01/1900)
- Entreprises de test non nettoyées avec numéros SIRET identiques

---

## 📊 Résultats et impact

**Données traitées**
- Plus d'**un million de bénéficiaires** analysés
- Plus de **90 000 contrats** consolidés
- Entreprises regroupées en pôles avec métadonnées enrichies (codes APE, risques, portabilité)

**Livrables**
- Quatre entités relationnelles complètes (Pôles, Polices, Contrats, Bénéficiaires)
- Système d'historisation automatisé avec macro-programmes préventifs
- Rapport Power BI interactif avec trois vues principales et mesures avancées
- Documentation technique et tables de référence sur SharePoint

**Bénéfices métier**
- **Vision consolidée** du portefeuille clients dans le contexte de migration Pégase → Open
- **Suivi temporel** des évolutions (historisation mensuelle automatisée)
- **Détection d'anomalies** dans les données sources (bénéficiaires invalides, entreprises de test)
- **Tableaux de bord dynamiques** pour analyses ad hoc par pôle, entreprise ou type de bénéficiaire
- **Gain de temps** grâce à l'automatisation des exports et des mises à jour

**Qualité des données**
- Vérifications anti-doublons systématiques via macro-programmes dédiés
- Validation des jointures et filtrage des données expirées
- Traçabilité complète avec dates de dernière mise à jour

---

## 🎓 Compétences développées

**Traitement de données**
- Maîtrise du langage SAS et de WPS pour manipulation de grands volumes de données
- Gestion des jointures complexes et résolution de doublons
- Modélisation relationnelle avec entités centrées client

**Automatisation**
- Création de macro-programmes SAS pour vérifications automatiques
- Système d'historisation préventif contre perte de données
- Export automatisé vers SharePoint

**Business Intelligence**
- Conception de rapports Power BI avec Power Query et DAX
- Visualisations interactives et utilisation de signets pour états multiples
- Intégration de charte graphique d'entreprise

**Qualité et rigueur**
- Vérifications systématiques d'intégrité des données
- Documentation technique pour maintenance future
- Détection proactive d'anomalies dans les sources de données

**Métier de l'assurance santé**
- Compréhension des concepts de portabilité, polices, garanties
- Connaissance de l'état Noemie (télétransmission)
- Gestion des types de bénéficiaires (assuré principal, conjoint, enfant)

Cette expérience m'a permis d'acquérir des bases solides en Data Analysis et des bonnes pratiques que j'applique désormais dans mon alternance, également dans le domaine de la Data.
