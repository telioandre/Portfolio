# Quoridor 2D

![Quoridor 2D](/assets/images/quoridor.png)

## Contexte

Implémentation complète du jeu de plateau **Quoridor** en Python avec interface graphique. Quoridor est un jeu stratégique à deux joueurs où l'objectif est d'atteindre le côté opposé du plateau tout en plaçant des barrières pour bloquer l'adversaire.

Le projet combine :
- Un **moteur de jeu** avec logiques complexes de déplacement et validation
- Une **interface utilisateur graphique** (UI) développée avec Pygame
- Une **architecture client-serveur** pour support du jeu en réseau (optionnel)
- Un **système de sauvegarde/chargement** pour reprendre les parties

## Objectifs

- Implémenter les **règles complètes du Quoridor** (mouvements, barrières, gestion du tour)
- Créer une **interface 2D intuitive** et réactive
- Développer une **architecture modulaire** séparant logique et présentation
- Implémenter un **pathfinding** pour valider les mouvements et déterminer les barrières prioritaires
- Support du **mode local** (2 joueurs sur le même écran)
- Support optionnel du **mode réseau** (client-serveur)

## Architecture du projet

```
QuoridorPython/
├── main.py              # Point d'entrée principal
├── launch.py            # Lancement et configuration du jeu
├── settings.py          # Constantes et paramètres globaux
├── game.py              # Moteur de jeu (logique principale)
├── client.py            # Client réseau (mode multijoueur)
├── serveur.py           # Serveur réseau
├── win.py               # Gestion des conditions de victoire
├── case_pawn.py         # Classe représentant les pions
├── case_barrier.py      # Classe représentant les barrières
├── user_interface/
│   ├── colors.py        # Palette de couleurs
│   ├── fonts/           # Polices personnalisées
│   ├── images/          # Assets graphiques (sprites, background)
│   └── son/             # Fichiers audio (SFX, musique)
└── save.txt             # Fichier de sauvegarde de partie
```

![Menu principal du jeu](/assets/images/quoridor.png)
*Menu principal avec sélection du mode de jeu*

## Technologies utilisées

**Langage & Frameworks :**
- **Python 3.x** - Langage principal
- **Pygame** - Moteur graphique 2D
- **Socket** - Communication réseau TCP/IP

**Concepts clés :**
- Programmation orientée objet (classes `CasePawn`, `CaseBarrier`)
- Pathfinding (BFS pour validation de chemin)
- Gestion d'état et machine à états
- Architecture client-serveur

## Composants principaux

### 1. **Moteur de jeu (game.py)**

Cœur logique du jeu :
- Gestion du plateau 9x9 (positions des pions et barrières)
- Validation des mouvements légaux
- Alternance des tours entre joueurs
- Détection de fin de partie

```python
class Game:
    def __init__(self):
        self.board = [[None for _ in range(9)] for _ in range(9)]
        self.pawns = [CasePawn(0, 4), CasePawn(8, 4)]  # Pions des joueurs
        self.barriers = []
        self.current_player = 0
        self.barrier_count = [10, 10]  # 10 barrières par joueur
    
    def is_valid_move(self, player, new_x, new_y):
        # Vérifier absence de barrière sur le trajet
        # Vérifier pas en dehors du plateau
        pass
    
    def place_barrier(self, player, x, y, orientation):
        # Placer une barrière (horizontal/vertical)
        # Vérifier barrière non déjà présente
        pass
```

### 2. **Représentation des entités**

**CasePawn (case_pawn.py)** - Pions joueur :
```python
class CasePawn:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def move(self, dx, dy):
        self.x += dx
        self.y += dy
```

**CaseBarrier (case_barrier.py)** - Barrières :
```python
class CaseBarrier:
    def __init__(self, x, y, orientation):  # 'H' = horizontal, 'V' = vertical
        self.x = x
        self.y = y
        self.orientation = orientation
```

### 3. **Interface utilisateur (user_interface/)**

**Rendu Pygame :**
- Plateau 9x9 avec grille
- Affichage des pions (couleurs distinctes : Rouge/Bleu)
- Affichage des barrières (traits épais)
- Compteur de barrières restantes par joueur
- Interface de sélection (mouvements possibles en surbrillance)

![Plateau de jeu en cours](/assets/images/quoridor_board.png)
*Partie en cours avec pions et barrières placées*

**Assets :**
- `colors.py` : Palette personnalisée (couleurs du plateau, pions, barrières)
- `fonts/` : Polices pour texte du jeu
- `images/` : Sprites et backgrounds
- `son/` : Effets sonores (placement barrière, victoire) et musique

![Écran de paramètres](/assets/images/quoridor_settings.png)
*Configuration des paramètres de jeu (difficulté, mode, etc.)*

### 4. **Gestion des conditions de victoire (win.py)**

```python
def check_victory(game, player):
    pawn = game.pawns[player]
    if player == 0 and pawn.y == 8:
        return True  # Joueur 0 atteint le bas
    if player == 1 and pawn.y == 0:
        return True  # Joueur 1 atteint le haut
    return False
```

### 5. **Système de sauvegarde**

**save.txt** - Format de sauvegarde :
```
9,4
8,4
0,4,H
2,7,V
10,9
...
```

Permet de reprendre une partie interrompue.

### 6. **Mode Réseau (Optionnel)**

**client.py** - Client connecté au serveur :
- Envoie les actions du joueur local
- Reçoit les actions du joueur distant

**serveur.py** - Serveur centralisé :
- Gère l'état du jeu
- Arbitre les coups légaux
- Synchronise les deux clients

## Flux de jeu

1. **Initialisation** → `launch.py` configure le plateau et connecte les joueurs
2. **Boucle de jeu** → Affichage + entrée utilisateur alternée
3. **Validation** → `game.py` valide les mouvements/barrières
4. **Rendu** → `user_interface/` affiche le nouvel état
5. **Condition de victoire** → `win.py` détecte fin de partie
6. **Sauvegarde** → État optionnellement sauvegardé dans `save.txt`

## Algorithme de pathfinding (BFS)

Validation critique : s'assurer qu'une barrière ne bloque pas complètement un joueur :

```python
from collections import deque

def has_path_to_goal(board, start_pos, goal_rows):
    """Vérifie s'il existe un chemin du départ à la ligne d'arrivée"""
    queue = deque([start_pos])
    visited = {start_pos}
    
    while queue:
        r, c = queue.popleft()
        
        # Condition de victoire atteinte ?
        if r in goal_rows:
            return True
        
        # Explorer les 4 directions
        for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
            nr, nc = r + dr, c + dc
            
            # Vérifier limites et barrières
            if 0 <= nr < 9 and 0 <= nc < 9 and (nr, nc) not in visited:
                if not is_barrier_blocking(board, r, c, nr, nc):
                    visited.add((nr, nc))
                    queue.append((nr, nc))
    
    return False
```

## Défis techniques

### 1. **Validation des mouvements complexes**
- Détection de barrières bloquantes (4 directions)
- Gestion des sauts (enjambement de l'adversaire)
- Chemin non bloqué vers la zone gagnante (règle Quoridor)

### 2. **Placement de barrières**
- Chaque barrière occupe 2 cases
- Overlap detection entre barrières
- Orientation (horizontale/verticale)

### 3. **Rendu graphique**
- Affichage fluide avec Pygame
- Gestion des événements (clics souris, clavier)
- Mise à jour d'état correcte

### 4. **Synchronisation réseau**
- Format de sérialisation des coups
- Gestion de la latence
- Reconnexion et gestion d'erreurs

## Utilisation

### Mode local (2 joueurs)
```bash
python main.py --mode local
```

### Mode réseau (serveur)
```bash
python serveur.py
```

### Mode réseau (client)
```bash
python client.py --server 127.0.0.1 --port 5000
```

## Vidéo de démonstration

<video width="100%" controls style="border-radius: 12px; border: 1px solid var(--border);">
  <source src="/assets/videos/Demo_Quoridor.mp4" type="video/mp4">
  Votre navigateur ne supporte pas la lecture de vidéos.
</video>

---

**Ressources :**
- <a href="https://fr.wikipedia.org/wiki/Quoridor" target="_blank" rel="noopener noreferrer">Règles complètes du Quoridor</a>
