# REST APIs Multi-Stack – Détails du projet

## Contexte

Ensemble de **trois projets complémentaires** développés pour explorer différentes approches de conception d'APIs REST et de consommation de données externes. Ces projets illustrent la polyvalence dans l'utilisation de stacks backend (PHP Symfony, C# ASP.NET Core) et frontend (React TypeScript) pour gérer des systèmes CRUD, des événements métier, et des intégrations d'APIs tierces.

**Objectif pédagogique :** Maîtriser les patterns RESTful, l'architecture en couches, la gestion d'état côté client, et l'intégration d'APIs publiques avec des mécanismes de cache et de recherche avancée.

---

## Stack 1 : PHP Symfony – API de gestion de tournois sportifs

### Architecture

API REST complète avec **Symfony 6+** utilisant une architecture **Entity-First** avec **Doctrine ORM**. Le système gère des tournois sportifs, des matchs, des inscriptions de joueurs et un système de rôles (Admin, Organizer, Player).

**Stack technique :**
- **Backend :** PHP 8.1+, Symfony 6, Doctrine ORM
- **Authentification :** Lexik JWT Bundle (tokens JWT avec TTL 3600s)
- **Base de données :** MySQL/PostgreSQL avec migrations Doctrine
- **Testing :** PHPUnit pour tests unitaires et validation

### Fonctionnalités principales

#### 1. Gestion des tournois
- CRUD complet sur les tournois avec validation Symfony
- Propriétés : nom, dates (début/fin), description, sport, lieu, nombre max de participants
- Statuts : `Planned`, `Ongoing`, `Completed`
- Relations : organisateur (User avec ROLE_ORGANIZER), gagnant (User nullable)

```php
#[ORM\Entity(repositoryClass: TournamentRepository::class)]
class Tournament
{
    #[ORM\Column(length: 255)]
    #[Assert\NotBlank()]
    private ?string $tournamentName = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Assert\GreaterThan(propertyPath: "startDate")]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $organizer = null;
}
```

#### 2. Système de matchs
- Entité `SportMatch` liée aux tournois et joueurs
- Scores validés (max 4 points par joueur)
- Statuts : `Scheduled`, `InProgress`, `Completed`

```php
#[ORM\Entity(repositoryClass: SportMatchRepository::class)]
class SportMatch
{
    #[ORM\ManyToOne]
    private ?Tournament $tournament = null;

    #[ORM\Column]
    #[Assert\LessThanOrEqual(value: 4)]
    private ?int $scorePlayer1 = null;
}
```

#### 3. Architecture événementielle

Utilisation du **EventDispatcher de Symfony** pour déclencher des actions métier lors de la mise à jour de tournois.

**Exemple : TournamentWinnerListener**
```php
#[AsEventListener(event: TournamentWinnerNotifier::class)]
readonly class TournamentWinnerListener
{
    public function __construct(private LoggerInterface $logger) {}

    public function onCustomEvent(TournamentWinnerNotifier $event): void
    {
        $this->logger->info("Winner : {$event->getWinner()->getUsername()}");
    }
}
```

Quand un tournoi est mis à jour via `GET /api/tournaments/{id}`, un événement est dispatché pour logger le gagnant. Ce pattern permet d'ajouter facilement des notifications email, des statistiques, ou des webhooks sans modifier le contrôleur.

#### 4. Authentification JWT

Configuration avec **Lexik JWT Bundle** :
```yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    token_ttl: 3600
```

Les tokens sont générés lors du login et validés via le bundle Security de Symfony. Les endpoints sensibles utilisent `#[IsGranted('ROLE_ORGANIZER')]` pour restreindre l'accès.

### Endpoints API

```http
GET    /api/tournaments          # Liste tous les tournois
GET    /api/tournaments/{id}     # Détails d'un tournoi (dispatche événement winner)
POST   /api/tournaments          # Crée un tournoi (auto-assigne ROLE_ORGANIZER)
PUT    /api/tournaments/{id}     # Modifie un tournoi (requiert ROLE_ORGANIZER)
DELETE /api/tournaments/{id}     # Supprime un tournoi

GET    /api/matches              # Liste les matchs
POST   /api/matches              # Crée un match lié à un tournoi

POST   /api/register             # Inscription d'un joueur à un tournoi
```

### Particularités techniques

- **Services dédiés :** `getTournament.php` encapsule la récupération avec gestion d'erreurs
- **Validation robuste :** Contraintes Doctrine (`@Assert\GreaterThan`, `@Assert\Positive`)
- **Tests automatisés :** `CheckEmailTest.php`, `StrongPassTest.php` pour validation des utilisateurs
- **Command CLI :** `VictoryCount.php` pour calculer les statistiques via console Symfony

---

## Stack 2 : C# ASP.NET Core – API de gestion de projets et tâches

### Architecture

API REST en **ASP.NET Core 6+** avec pattern **Service-Repository-DTO**, **Entity Framework Core** pour l'ORM, et **SQLite** pour la persistance. Système de gestion de projets avec tâches associées, authentification JWT, et middleware de gestion d'erreurs centralisée.

**Stack technique :**
- **Backend :** C# .NET 6+, ASP.NET Core Web API
- **ORM :** Entity Framework Core avec migrations
- **Authentification :** JWT Bearer Token avec SymmetricSecurityKey
- **Base de données :** SQLite (migrations code-first)
- **Documentation :** Swagger/OpenAPI avec exemples

### Fonctionnalités principales

#### 1. Architecture en couches

**Models :** Entités EF Core avec relations
```csharp
public class Project
{
    public int Id { get; set; }
    [Required]
    public string Name { get; set; }
    public DateTime CreationDate { get; set; }
    public int UserId { get; set; }
    public User User { get; set; }
    public ICollection<TaskItem> Tasks { get; set; }
}
```

**DTOs :** Séparation des données d'entrée/sortie
```csharp
public class ProjectCreateDto
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }
    public List<string>? Tags { get; set; }
}
```

**Services :** Logique métier isolée
```csharp
public interface IProjectService
{
    Task<IEnumerable<Project>> GetAllAsync();
    Task<Project> CreateAsync(int userId, ProjectCreateDto projectDto);
}
```

#### 2. Gestion des tâches avec enum personnalisé

Les tâches utilisent un **enum `TaskStatus`** avec conversion JSON automatique :
```csharp
public enum TaskStatus { Afaire, Encours, Termine }

public class TaskItem
{
    public TaskStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public List<string> Commentaire { get; set; }
}
```

Configuration dans `Program.cs` :
```csharp
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
})
```

#### 3. Middleware de gestion d'erreurs

**ExceptionMiddleware** centralise toutes les exceptions avec codes HTTP appropriés :
```csharp
public class ExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await _next(context); }
        catch (Exception error)
        {
            var errorResponse = new ErrorResponse
            {
                Message = error.Message,
                Details = error.StackTrace
            };

            switch (error)
            {
                case UserAlreadyExistsException:
                    response.StatusCode = 409; // Conflict
                    break;
                case KeyNotFoundException:
                    response.StatusCode = 404; // Not Found
                    break;
                case UnauthorizedAccessException:
                    response.StatusCode = 403; // Forbidden
                    break;
            }
        }
    }
}
```

Avantages : contrôleurs propres, gestion cohérente des erreurs, logs centralisés.

#### 4. Sécurité et autorisation

**Configuration JWT dans `Program.cs` :**
```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"])
            )
        };
    });
```

**Protection des contrôleurs :**
```csharp
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProjectsController : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult> CreateProject([FromBody] ProjectCreateDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var project = await _projectService.CreateAsync(userId, dto);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }
}
```

Le middleware `[Authorize]` vérifie le token JWT, et le `userId` est extrait des claims pour lier automatiquement le projet à l'utilisateur connecté.

#### 5. Validation propriétaire

Le service vérifie que l'utilisateur est propriétaire avant modification/suppression :
```csharp
public async Task<Project> UpdateAsync(int id, int userId, ProjectUpdateDto dto)
{
    var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id);
    if (project.UserId != userId)
        throw new UnauthorizedAccessException("Vous n'êtes pas autorisé");
    
    project.Name = dto.Name;
    await _context.SaveChangesAsync();
    return project;
}
```

### Endpoints API

```http
GET    /api/projects             # Liste projets (avec Include EF Core : User, Tasks)
GET    /api/projects/{id}        # Détails projet
POST   /api/projects             # Crée projet (userId extrait du JWT)
PUT    /api/projects/{id}        # Modifie projet (vérif propriétaire)
DELETE /api/projects/{id}        # Supprime projet (cascade sur tasks)

GET    /api/taskitems            # Liste tâches
POST   /api/taskitems            # Crée tâche
PUT    /api/taskitems/{id}       # Modifie tâche

POST   /api/users/register       # Inscription (hash password avec PasswordHasher)
POST   /api/users/login          # Login (génère JWT)
```

### Particularités techniques

- **Migrations Code-First :** `20250430123913_InitialCreate.cs` génère schéma SQLite
- **Include EF Core :** `.Include(p => p.User).Include(p => p.Tasks)` évite N+1 queries
- **Swagger personnalisé :** SchemaFilters pour exemples JSON dans la documentation
- **Password Hashing :** `IPasswordHasher<User>` avec Identity Framework

---

## Stack 3 : React TypeScript – Frontend de recherche de livres

### Architecture

Application **React 18 + TypeScript + Vite** consommant l'**API OpenLibrary** avec intégration **Wikipedia** pour enrichissement de métadonnées. Utilise **Zustand** pour la gestion d'état globale et un système de cache côté client pour optimiser les requêtes.

**Stack technique :**
- **Frontend :** React 18, TypeScript 5, Vite
- **Gestion d'état :** Zustand avec persistance localStorage
- **APIs externes :** OpenLibrary API, Wikipedia REST API
- **Routing :** React Router v6
- **Styling :** CSS modules avec animations

### Fonctionnalités principales

#### 1. Custom Hook `useOpenLibrary`

Hook réutilisable pour recherche de livres avec pagination, tri, et cache Zustand :
```typescript
export function useOpenLibrary(query: string, page: number, sort: string) {
  const [books, setBooks] = useState<OpenLibraryBook[]>([])
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const { getSearchResults, addSearchResults } = useBookStore()

  useEffect(() => {
    const searchTerm = query.trim() || 'subject:fiction'
    const offset = page * 25
    const queryKey = `${searchTerm}-offset${offset}-${sort}-25`
    
    // Vérification cache
    const cachedResults = getSearchResults(queryKey)
    if (cachedResults) {
      setBooks(cachedResults.books)
      setTotalResults(cachedResults.totalResults)
      return
    }
    
    // Requête API avec debounce (300ms)
    let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&offset=${offset}&limit=25`
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setBooks(data.docs)
        setTotalResults(data.numFound)
        addSearchResults(queryKey, data.docs, data.numFound)
      })
  }, [query, page, sort])

  return { books, loading, totalResults }
}
```

**Particularités :**
- **Debounce de 300ms** pour éviter requêtes excessives
- **Cache avec clé composite** : `query-offset-sort-limit`
- **Fallback** : recherche "subject:fiction" si query vide
- **AbortController** pour annuler requêtes en vol

#### 2. Système de cache Zustand

Store persisté dans localStorage avec TTL (1 heure) :
```typescript
export const useBookStore = create<BookStore>()(
  persist(
    (set, get) => ({
      booksCache: {},
      searchCache: {},
      cacheTTL: 3600000, // 1 heure
      
      addSearchResults: (queryKey, books, totalResults) => set((state) => ({
        searchCache: { 
          ...state.searchCache, 
          [queryKey]: { books, totalResults, timestamp: Date.now() }
        }
      })),
      
      getSearchResults: (queryKey) => {
        const cached = get().searchCache[queryKey]
        if (!cached) return null
        
        const now = Date.now()
        if (now - cached.timestamp > get().cacheTTL) return null
        
        return { books: cached.books, totalResults: cached.totalResults }
      }
    }),
    { name: 'book-store' }
  )
)
```

**Avantages :**
- Réduction drastique des appels API (pagination sans refetch)
- Persistance entre sessions (localStorage)
- Invalidation automatique après 1h

#### 3. Intégration Wikipedia avec `useWikipediaInfo`

Hook pour enrichir les détails de livres avec descriptions et images Wikipedia :
```typescript
export function useWikipediaInfo(title: string, language: string = 'en') {
  const [wikiInfo, setWikiInfo] = useState<WikipediaInfo>({ 
    description: null, 
    imageUrl: null 
  })

  useEffect(() => {
    if (!title) return

    const searchTerm = title.replace(/\(.*\)/g, '').trim()
    const apiUrl = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        setWikiInfo({
          description: data.extract || null,
          imageUrl: data.thumbnail?.source || null
        })
      })
  }, [title, language])

  return { wikiInfo, loading, error }
}
```

Utilisé dans la page `Book.tsx` pour afficher une description enrichie :
```tsx
const { wikiInfo } = useWikipediaInfo(book?.title || '')

return (
  <div className="wiki-section">
    {wikiInfo.description && <p>{wikiInfo.description}</p>}
    {wikiInfo.imageUrl && <img src={wikiInfo.imageUrl} alt="Wikipedia" />}
  </div>
)
```

#### 4. Recherche avancée avec `AdvancedSearchBar`

Composant avec filtres multiples (auteur, date, ISBN, éditeur, langue) :
```tsx
export default function AdvancedSearchBar({ onSearch, isSticky }) {
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [language, setLanguage] = useState('')
  const [sort, setSort] = useState('relevance')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch({ query, author, isbn, language, sort })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <select value={language}>
        <option value="eng">English</option>
        <option value="fre">French</option>
      </select>
      <select value={sort}>
        <option value="new">Newest first</option>
        <option value="title_asc">Title (A → Z)</option>
      </select>
    </form>
  )
}
```

Construction de l'URL API avec paramètres dynamiques :
```typescript
let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}`
if (author) url += `&author=${encodeURIComponent(author)}`
if (isbn) url += `&isbn=${isbn}`
if (language) url += `&language=${language}`
```

#### 5. Composants UI réutilisables

- **`BookCard`** : Carte livre avec cover OpenLibrary, auteur, année
- **`BookSkeleton`** : Skeleton loader pendant chargement
- **`Pagination`** : Navigation pages avec calcul offset
- **`RecentBooksCarousel`** : Carrousel books récents avec lazy loading

### Flux de données

```
User Input (AdvancedSearchBar)
    ↓
useOpenLibrary hook
    ↓
Vérification cache Zustand (searchCache)
    ↓ (cache miss)
Fetch OpenLibrary API
    ↓
Mise en cache (addSearchResults)
    ↓
Render BookCard[] avec Pagination
    ↓ (click sur livre)
Page Book.tsx : fetch détails + useWikipediaInfo
    ↓
Affichage enrichi (cover + description Wikipedia)
```

### Particularités techniques

- **TypeScript strict :** Types pour OpenLibraryBook, WikipediaInfo, Book
- **Optimisations :** `AbortController`, debounce, lazy loading images
- **Accessibilité :** `aria-label` sur inputs, navigation clavier
- **Error boundaries :** Gestion erreurs fetch avec états `error`

---

## Comparaison des approches

### Symfony (PHP)
- **Pattern :** Entity-First + Event-Driven
- **Erreurs :** Exceptions avec Listeners (découplage)
- **Validation :** Annotations Doctrine robustes
- **Authentification :** Lexik JWT Bundle (tokens)
- **Persistance :** Doctrine ORM (QueryBuilder)
- **Documentation :** NelmioApiDocBundle

### ASP.NET Core (C#)
- **Pattern :** Service-Repository-DTO
- **Erreurs :** Middleware centralisé (codes HTTP uniformes)
- **Validation :** Data Annotations + FluentAPI
- **Authentification :** JWT Bearer + Claims extraction
- **Persistance :** EF Core Code-First (migrations)
- **Documentation :** Swagger avec SchemaFilters

### React TypeScript
- **Pattern :** Hooks + Zustand State Management
- **Erreurs :** Try-catch dans hooks avec states
- **Validation :** TypeScript + validation côté serveur
- **Authentification :** Tokens localStorage + headers
- **Persistance :** Zustand + localStorage (cache)
- **Documentation :** Types TypeScript comme source unique

---

## Apprentissages clés

1. **Architecture en couches** : Séparation Models/Services/Controllers (C#) vs Entity/Repository/Controller (PHP) améliore testabilité et maintenabilité

2. **Gestion d'état côté client** : Cache Zustand réduit drastiquement les appels API et améliore UX (1h TTL, recherches paginées persistantes)

3. **Événements métier** : Symfony EventDispatcher permet découplage (ex: logging winner sans modifier controller, prêt pour webhooks)

4. **Middleware centralisé** : ExceptionMiddleware (C#) unifie gestion erreurs et codes HTTP (409 Conflict, 404 NotFound, 403 Forbidden)

5. **Custom hooks React** : `useOpenLibrary` et `useWikipediaInfo` encapsulent logique fetch et rendent composants réutilisables et testables

6. **DTOs vs Entities** : Séparation données d'entrée/sortie évite over-fetching et protège modèle interne

7. **JWT Claims** : Extraction userId depuis token (au lieu de paramètres URL) augmente sécurité et intégrité

8. **Validation multi-niveaux** : TypeScript (compile-time) + Data Annotations (runtime) + contraintes DB (integrity) = robustesse maximale
