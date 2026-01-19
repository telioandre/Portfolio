# Age of Stick 2D – Détails du projet

![Capture du jeu](../../assets/images/age-of-war.png)

## Contexte
Jeu 2D réalisé sous **Unity** (C#) avec systèmes de combat, animations, gestion des niveaux et assets personnalisés.

## Objectifs techniques
- Mécaniques de combat et équilibrage
- Système d’ennemis et IA basique (patrouille, poursuite)
- Gestion des niveaux et progression
- Architecture claire (Scenes, Prefabs, ScriptableObjects)

## Défis
- Synchronisation animations/combat
- Collisions et détection de hitbox
- Gestion des performances sur mobiles

## Extrait de code
```csharp
public class Enemy : MonoBehaviour {
    public float speed = 2f;
    public Transform[] waypoints;
    private int idx = 0;

    void Update() {
        var target = waypoints[idx].position;
        transform.position = Vector3.MoveTowards(transform.position, target, speed * Time.deltaTime);
        if(Vector3.Distance(transform.position, target) < 0.1f){
            idx = (idx + 1) % waypoints.Length;
        }
    }
}
```

## Médias
- Vidéo (placeholder): https://example.com/demo-age-of-stick
