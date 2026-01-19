# REST APIs multi-stack – Détails du projet

![Capture APIs](../../assets/images/rest-apis.png)

## Contexte
Création de **REST APIs** avec différentes stacks (PHP Laravel, ASP.NET, React pour front).

## Endpoints exemple
```http
GET /api/v1/items
POST /api/v1/items
GET /api/v1/items/:id
```

## Contrôleur (Laravel)
```php
public function store(Request $req){
  $item = Item::create($req->all());
  return response()->json($item, 201);
}
```

## Contrôleur (ASP.NET)
```csharp
[HttpGet("{id}")]
public IActionResult Get(int id){
  var item = _repo.Get(id);
  return item != null ? Ok(item) : NotFound();
}
```

## Médias
- Vidéo (placeholder): https://example.com/demo-apis
