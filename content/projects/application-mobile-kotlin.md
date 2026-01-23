# Application mobile Kotlin – Recettes (Food2Fork)

## Contexte
Application Android en **Kotlin** (Jetpack Compose) qui consomme l'API Food2Fork pour lister et détailler des recettes. Architecture **MVVM** avec **StateFlow**, cache local **Room** pour le mode hors-ligne et navigation Compose (liste ↔ détail).

## Fonctionnalités clés
- **Chargement** : splash animé (logo cook) pendant la récupération des données.
- **Liste** : cartes image/titre, recherche locale, filtres rapides par catégorie, pagination (suivant/précédent), scroll-to-top après navigation.
- **Détail** : image plein format, auteur, note, date de mise à jour, description si disponible, liste d'ingrédients, bouton Back (`BackHandler`).
- **Résilience réseau** : fallback cache Room si l'appel API échoue, écran d'erreur avec Retry/Go back.
- **Offline-first** : insertion en base après succès API pour consultation ultérieure sans réseau.

## Architecture & stack
- **UI** : Jetpack Compose (Material3), écrans `LoadingScreen`, `RecipeListScreen`, `RecipeDetailScreen`, `ErrorScreen`.
- **State** : `StateFlow` (recipes, sélection, loading, error), `rememberSaveable` pour l'écran courant.
- **Données** : Retrofit + Gson, en-tête d'authentification token, endpoints `/recipe/search` et `/recipe/get` (Food2Fork).
- **Persistance** : Room (`RecipeEntity`, `RecipeDao`, `AppDatabase`) avec fallback cache en cas d'échec réseau.
- **VM / Repository** : `RecipeViewModel` (pagination 30 éléments/page, requête par défaut "beef"), `RecipeRepository` (write-through cache + fallback).

## Problématiques mobiles & réponses
- **Réseau instable** : fallback Room si l'appel Retrofit échoue, pour éviter crash et limiter le trafic.
- **Pagination / mémoire** : page de 30 items, filtrage local et scroll-to-top pour garder l'UI fluide.
- **Images** : Coil + cache pour éviter les OOM, resize implicite via Compose.
- **Navigation/back** : `BackHandler` sur le détail pour un retour prévisible sans perdre l'état liste.
- **Hors-ligne** : write-through cache (insertion après succès) et lecture en fallback.

## Flux utilisateur
1) Splash/Loading → 2) Liste paginée avec recherche/filtres → 3) Détail (ingrédients, métadonnées) → Retour liste. En cas d'erreur : écran dédié avec retry.

## Extraits de code

### Fallback cache si l'API échoue
```kotlin
suspend fun searchRecipes(query: String, page: Int, pageSize: Int): List<Recipe> =
    withContext(Dispatchers.IO) {
        try {
            val response = api.searchRecipes(query, page, pageSize)
            recipeDao.insertAll(*response.results.map { it.toEntity() }.toTypedArray())
            response.results
        } catch (e: Exception) {
            val offset = (page - 1) * pageSize
            val cached = recipeDao.getRecipes(pageSize, offset)
            if (cached.isNotEmpty()) cached.map { it.toRecipe() } else throw e
        }
    }
```

### Navigation Compose et gestion du back
```kotlin
when (currentScreen.value) {
    Screen.RecipeList -> { /* liste + pagination + erreur */ }
    Screen.RecipeDetail -> {
        selectedRecipe?.let { recipe ->
            RecipeDetailScreen(recipe = recipe) {
                viewModel.selectRecipe(null)
                currentScreen.value = Screen.RecipeList
            }
        }
    }
}
```

### Liste avec recherche locale et pagination
```kotlin
val filtered = recipes.filter { it.title.contains(searchQuery, true) }
LazyColumn(state = listState) {
    items(filtered) { recipe ->
        Card(onClick = { onRecipeClick(recipe) }) {
            Image(
                painter = rememberAsyncImagePainter(recipe.featured_image),
                contentDescription = recipe.title,
                modifier = Modifier.fillMaxWidth().height(180.dp)
            )
            Text(recipe.title, fontWeight = FontWeight.Bold)
        }
    }
}
Row { Button(onClick = onPreviousPage) { Text("Previous") }
     Button(onClick = onNextPage) { Text("Next") } }
```

### Chargement / erreur dédiés
```kotlin
if (isLoading && errorMessage == null) LoadingScreen()
else if (errorMessage != null) {
    ErrorScreen(
        errorMessage = errorMessage!!,
        onRetry = { viewModel.retryFetching() },
        onGoBack = { viewModel.loadPreviousPage() }
    )
}
```

## Médias

**Démonstration :**
- [Vidéo du système en action](#) *(à ajouter)*
