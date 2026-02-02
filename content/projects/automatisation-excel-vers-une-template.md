# Automatisation Excel vers une template – Détails du projet

![Automatisation Excel](/assets/images/excel-automation.png)

## Contexte
Macro VBA pour l'extraction et la consolidation de données de temps depuis un fichier source vers une template de workload. Le script récupère les heures par utilisateur/activité, les catégorise (BUILD/RUN/TRANSVERSE) et alimente un classeur cible de manière dynamique.

## Vue d'ensemble
La macro automatise le processus d'import de données de temps dans Excel en :
- Comparant les utilisateurs entre la source et la cible
- Mappant les activités via un code analytique
- Gestion des colonnes dynamiques selon le mois
- Mettant à jour les cellules existantes ou insérant de nouvelles activités
- Vidant les cellules pour les activités non présentes en source

## Architecture & flux

### 1. Ouverture et récupération des données
```vb
Const FEUILLE_SOURCE As String = "Feuil1"
Const FEUILLE_CIBLE As String = "Workload [CENSURÉ]"
Const FEUILLE_ACTIVITES As String = "Activités A charger"
Const mois As Integer = 6

Set wbSource = Workbooks("[CENSURÉ].xlsx")
Set wsSource = wbSource.Sheets(FEUILLE_SOURCE)
Set wsCible = ThisWorkbook.Sheets(FEUILLE_CIBLE)
Set wsActivites = ThisWorkbook.Sheets(FEUILLE_ACTIVITES)

derniereLigneSource = wsSource.Cells(wsSource.Rows.Count, 1).End(xlUp).Row
derniereColonneSource = wsSource.Cells(5, wsSource.Columns.Count).End(xlToLeft).Column
```
- Récupération du fichier source (classeur avec données d'export).
- Référencement de 3 feuilles (source, cible, mapping des activités).
- Identification dynamique des limites (nombre de lignes et colonnes).

![Import données (placeholder)](/assets/images/placeholder-import-data.png)

### 2. Détermination des types d'activité
```vb
lastBuild = 0
lastRun = 0

For j = 1 To derniereColonneSource
    Select Case Trim(wsSource.Cells(4, j).Value)
        Case "RUN"
            lastBuild = j - 1
        Case "TRANSVERSE"
            lastRun = j - 1
    End Select
Next j

If j <= lastBuild Then
    typeActivite = "BUILD"
ElseIf j <= lastRun Then
    typeActivite = "RUN"
Else
    typeActivite = "TRANSVERSE"
End If
```
- Scan de la ligne 4 pour identifier les colonnes de transition (RUN, TRANSVERSE).
- Détermination du type d'activité selon la colonne analysée.

![Classification activités (placeholder)](/assets/images/placeholder-activity-type.png)

### 3. Indexation des utilisateurs et activités
```vb
Set dictUtilisateurs = CreateObject("Scripting.Dictionary")

With wsCible
    For i = 2 To derniereLigneCible
        utilisateur = Trim(.Cells(i, 2).Value)
        If utilisateur <> "" And Not dictUtilisateurs.exists(utilisateur) Then
            Set dictUtilisateurs(utilisateur) = CreateObject("Scripting.Dictionary")
            dictUtilisateurs(utilisateur)(Trim(.Cells(i, 3).Value)) = i
        End If
    Next i
End With
```
- Création d'un dictionnaire pour les utilisateurs de la feuille cible.
- Mappage des lignes de chaque utilisateur pour accès rapide.
- Stockage des activités déjà présentes.

### 4. Lookup du code analytique vers l'activité
```vb
derniereLigneActivites = wsActivites.Cells(wsActivites.Rows.Count, "D").End(xlUp).Row

For k = 2 To derniereLigneActivites
    If Trim(wsActivites.Cells(k, 4).Value) = codeAnalytique Then
        activite = Trim(wsActivites.Cells(k, 2).Value)
        Exit For
    End If
Next k
```
- Recherche de la description d'activité à partir du code analytique.
- Utilise la feuille "Activités A charger" comme table de référence.

![Mapping analytique (placeholder)](/assets/images/placeholder-mapping.png)

### 5. Mise à jour ou création des lignes
```vb
Set activiteRange = wsCible.Range("A" & ligneUtilisateur & ":A" & derniereLigneUtilisateurTemp).Find(codeAnalytique, LookIn:=xlValues, LookAt:=xlWhole)
trouveActivite = Not activiteRange Is Nothing

If trouveActivite Then
    ' Activité existante : écraser le temps
    activiteRange.Offset(0, 2 + mois).Value = valeur
    dictActivites(codeAnalytique) = True
Else
    ' Nouvelle activité : insérer une ligne
    Do While wsCible.Cells(derniereLigneUtilisateurTemp, 2).Value <> ""
        derniereLigneUtilisateurTemp = derniereLigneUtilisateurTemp + 1
    Loop
    
    With wsCible
        .Cells(derniereLigneUtilisateurTemp, 1).Value = codeAnalytique
        .Cells(derniereLigneUtilisateurTemp, 2).Value = typeActivite
        .Cells(derniereLigneUtilisateurTemp, 3).Value = activite
        .Cells(derniereLigneUtilisateurTemp, 3 + mois).Value = valeur
    End With
End If
```
- Recherche de l'activité dans le bloc utilisateur.
- Si trouvée : mise à jour de la colonne des heures (dynamique selon le mois).
- Si non trouvée : insertion de la nouvelle activité avec type et description.

![Mise à jour lignes (placeholder)](/assets/images/placeholder-update-rows.png)

### 6. Nettoyage des activités non présentes
```vb
For Each activiteKey In dictActivitesCible.Keys
    If Not dictActivites.exists(activiteKey) Then
        Set activiteRange = wsCible.Range("A" & ligneUtilisateur & ":A" & derniereLigneUtilisateurTemp).Find(activiteKey, LookIn:=xlValues, LookAt:=xlWhole)
        If Not activiteRange Is Nothing Then
            wsCible.Cells(activiteRange.Row, 3 + mois).ClearContents
        End If
    End If
Next activiteKey
```
- Identification des activités présentes dans la cible mais absentes de la source.
- Vidage des cellules pour ces activités (évite les données obsolètes).

### 7. Fermeture et nettoyage
```vb
wbSource.Close False
Set wsSource = Nothing
Set wsCible = Nothing
Set wsActivites = Nothing
Set dictUtilisateurs = Nothing
Set dictActivites = Nothing
Set dictActivitesCible = Nothing
```
- Fermeture du classeur source sans enregistrement.
- Libération de toutes les variables de mémoire.

![Nettoyage (placeholder)](/assets/images/placeholder-cleanup.png)

## Points clés d'implémentation

**Dictionnaires pour performance**
- Utilisation de dictionnaires VBA pour indexer rapidement les utilisateurs et activités.
- Évite les boucles imbriquées répétitives et améliore la vitesse d'exécution.

**Colonnes dynamiques par mois**
- La colonne de destination est calculée dynamiquement : `3 + mois`.
- Permet de router les données vers différentes colonnes sans modification du code.

**Gestion des limites dynamiques**
- Détection automatique des dernières lignes/colonnes avec `.End(xlUp)` et `.End(xlToLeft)`.
- S'adapte automatiquement à la taille des données.

**Validation et catégorisation**
- Les heures sont validées (IsNumeric, > 0) avant traitement.
- Les codes analytiques non mappés sont ignorés.

**Comparaison bidirectionnelle**
- Mise à jour des activités présentes en source.
- Nettoyage des activités absentes en source.

## Flux global (pseudocode)
```vb
Pour chaque utilisateur de la source :
    Si l'utilisateur existe dans la cible :
        Charger son bloc de lignes (activités actuelles)
        
        Pour chaque activité avec heures > 0 :
            Récupérer le type (BUILD/RUN/TRANSVERSE)
            Récupérer la description (via code analytique)
            
            Si l'activité existe déjà :
                Mettre à jour les heures
            Sinon :
                Insérer une nouvelle activité
        
        Pour chaque activité manquante en source :
            Vider les heures

Fermer et nettoyer
```
