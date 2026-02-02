# Age of Stick 2D – Tower Defense contre vagues d'ennemis

![Capture du jeu](./assets/images/age-of-war.png)

## Contexte
Jeu 2D Tower Defense en **Unity** (C#) inspiré d'Age of War. Joueur contre IA dans des vagues successives : construire/améliorer des tours (turrets), générer du cash, recruter unités, viser et ajuster la vitesse de jeu. Intégration **Photon PUN2** pour multijoueur, **PlayFab** pour le cloud save, **Photon Chat** pour la communication. Architecture modulaire : GameManager central, Player/IA controllers, Turret/Castle builders, systèmes de collision détaillés, gestion réseau et ui.

## Architecture & systèmes principaux

### Core gameplay (GameManager)
- **GameManager** : boucle principale, gestion des ressources (cash, temps), états du jeu, synchronisation joueur/IA.
- **Player** : mouvement caméra, placement de turrets, sélection d'unités, gestion cash + upgrades, stats de santé.
- **DifficultyManager** : escalade progressive des ennemis (nombre, durée de vie, dégâts) selon la progression.
*Capture à ajouter : écran principal avec ressources, turrets disponibles et stats.*

### Systèmes de construction & économie
- **Turret** : placer, tirer (délai entre tirs), cible l'ennemi le plus proche, dégâts variables, amélioration de puissance.
- **Casern** : recrute unités offensives, coûts en cash, gestion de la file d'attente de création.
- **Castle** : structure défensive principale, santé critique pour la victoire/défaite, amélioration d'armure.
- **ShopTurret** : UI pour acheter/améliorer tours, validation des ressources, feedback visuel sur les prix.
*Capture à ajouter : menu shop de turrets avec prix et améliorations.*

### Ennemis & IA
- **IA** : agent IA qui place ses propres towers, gère son économie, attaque selon la progression, difficulté croissante.
- **EnemyShooting** : projectiles ennemis (speed, lifetime, dégâts), destruction après collision ou délai.
- **EnemyBulletScript** : gestion des projectiles ennemis avec impacts et éventuels effets visuels.
*Capture à ajouter : vague d'ennemis en attaque, projections et explosions.*

### Contrôle & interactions
- **Clicked** : gestion des clics souris pour sélectionner/placer turrets, interaction UI.
- **ButtonScript** : gestion des boutons (pause, settings, restart, accueil).
- **ScreenController** : gestion des transitions d'écrans (menu → jeu → fin), fading transitions.
- **OnPauseMenu** : pause en jeu avec options (reprendre, paramètres, quitter), verrouillage de la physique.
*Capture à ajouter : écran pause avec options.*

### Réseau & multi-joueur
- **PunManager** : initialisation Photon PUN2, création/rejoindre rooms, synchronisation d'état entre joueurs, fallback en solo.
- **PhotonChatManager** : système de chat in-game via Photon Chat, messages temps réel, notifications.
- **OnlineButton** : UI pour le multijoueur, sélection du mode (local vs online).
*Capture à ajouter : écran menu multijoueur avec sélection.*

### Sauvegarde cloud & compte
- **PlayFabManager** : authentification PlayFab, cloud save de progression/scores, leaderboards.
- **SpeedControl** : contrôle de la vitesse de jeu (1x, 2x, pause), accessible pendant la partie.
*Capture à ajouter : écran profil / leaderboards.*

## Difficultés techniques & solutions

### 1. Synchronisation réseau (Photon PUN2)
- **Défi** : synchroniser positions d'unités, placements de turrets, cash, État du jeu entre joueurs avec latence.
- **Solution** : RPC calls pour les événements critiques (placement turret, victoire), synchronisation périodique des stats non-critiques, predict positions côté client.

### 2. Collisions & hitboxes précises
- **Défi** : détection correcte des projectiles sur unités mobiles (2D box/circle overlaps), éviter les faux positifs.
- **Solution** : Collisions.cs centralise les vérifications, raycasts pour les tirs à longue portée, padding de hitbox pour plus de tolerance.

### 3. Performance (render + physics)
- **Défi** : gestion de centaines d'ennemis + projectiles + animations sur mobile.
- **Solution** : Object pooling pour projectiles/ennemis, désactivation des colliders inactifs, LOD sur animations distantes, profiling pour identifier les hotspots.

### 4. IA équilibrée
- **Défi** : IA trop simple = facile, trop smart = impossible ; escalade progressive des vagues.
- **Solution** : DifficultyManager ajuste stats ennemis en fonction du tour/temps, IA place turrets selon pattern fixe + budget croissant, playtesting & tweaking des courbes.

### 5. Sauvegarde état de partie (PlayFab + local)
- **Défi** : persister progression entre sessions, eviter les cheats (cash infini), sync avec cloud.
- **Solution** : PlayFabManager sign-in automatique, signature des données sensibles, fallback JSON local en mode offline.

### 6. UI responsive (écrans différents)
- **Défi** : adaptation buttons/canvas à aspect ratios variés (mobile portrait/landscape, desktop).
- **Solution** : Canvas Scaler avec reference resolution, layout groups, ScreenController gère les transitions.

## Extraits de code

### Placement turret + coût cash (Player.cs concept)
```csharp
public class Player : MonoBehaviour {
    public int cash = 500;
    public List<Turret> turrets = new();
    
    public bool CanBuyTurret(int cost) => cash >= cost;
    
    public void PlaceTurret(Vector3 pos, TurretData data) {
        if (!CanBuyTurret(data.cost)) return;
        Instantiate(turretPrefab, pos, Quaternion.identity);
        cash -= data.cost;
        GameManager.instance.UpdateUIResources(cash);
    }
}
```

### Tir de turret + cooldown (Turret.cs concept)
```csharp
public class Turret : MonoBehaviour {
    public float fireRate = 1f;
    private float lastFireTime = 0f;
    
    void Update() {
        Collider2D target = FindNearestEnemy();
        if (target && Time.time - lastFireTime >= fireRate) {
            FireAtTarget(target);
            lastFireTime = Time.time;
        }
    }
    
    void FireAtTarget(Collider2D target) {
        var bullet = Instantiate(bulletPrefab, firePoint.position, Quaternion.identity);
        var rb = bullet.GetComponent<Rigidbody2D>();
        rb.velocity = (target.transform.position - firePoint.position).normalized * bulletSpeed;
    }
}
```

### Gestion collision projectile-ennemi (Collisions.cs concept)
```csharp
public class Collisions : MonoBehaviour {
    void OnTriggerEnter2D(Collider2D col) {
        if (col.CompareTag("Enemy")) {
            var enemy = col.GetComponent<IA>();
            if (enemy) {
                enemy.TakeDamage(GetComponent<EnemyBulletScript>().damage);
                Destroy(gameObject); // bullet
            }
        }
    }
}
```

### Difficulté escalade (DifficultyManager.cs concept)
```csharp
public class DifficultyManager : MonoBehaviour {
    int currentWave = 0;
    
    public void StartWave() {
        int enemyCount = 3 + currentWave;        // wave 0 = 3, wave 5 = 8, etc
        float enemyHealth = 100 * (1 + currentWave * 0.2f);  // +20% par vague
        float aiCash = 300 + currentWave * 100;  // IA gagne plus de cash
        GameManager.instance.SpawnWave(enemyCount, enemyHealth);
        currentWave++;
    }
}
```

### Réseau Photon PUN2 (PunManager.cs concept)
```csharp
public class PunManager : MonoBehaviour {
    void Start() {
        PhotonNetwork.ConnectUsingSettings();
    }
    
    public override void OnConnectedToMaster() {
        PhotonNetwork.JoinLobby();
    }
    
    [PunRPC] void RPC_PlayerPlacedTurret(Vector3 pos, int turretType) {
        // Synchroniser placement turret à tous les joueurs
        Instantiate(GetTurretPrefab(turretType), pos, Quaternion.identity);
    }
}
```

## Médias
- Placeholder : `assets/images/age-of-war.png`
