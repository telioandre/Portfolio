# Application mobile Kotlin – Détails du projet

![Capture Android](../../assets/images/kotlin-app.png)

## Contexte
Application Android réalisée avec **Kotlin**, utilisant une architecture MVVM simple, navigation, et persistance locale.

## Fonctionnalités
- Écrans list/detail
- Formulaires avec validation
- Persistance locale (Room ou SharedPreferences)
- Thème sombre/clair

## Techniques utilisées
- Kotlin, Android Studio, ViewModel, LiveData
- RecyclerView, Navigation Component

## Démos / médias
- Vidéo (placeholder) : https://example.com/demo-kotlin

## Extrait de code
```kotlin
class ItemsViewModel(private val repo: ItemsRepository): ViewModel() {
    val items = MutableLiveData<List<Item>>()
    fun load() {
        viewModelScope.launch {
            items.postValue(repo.all())
        }
    }
}
```
