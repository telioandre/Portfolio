# Générateur d'incidents ServiceNow – Détails du projet

![Générateur incidents](../../assets/images/servicenow-generator.png)

## Contexte
Script **Python + pandas** pour générer des incidents aléatoires et alimenter ServiceNow.

## Extrait de code
```python
import pandas as pd
import random, datetime as dt
cats = ['Hardware','Software','Network']
rows = []
for i in range(100):
    rows.append({
        'number': f'INC{1000+i}',
        'category': random.choice(cats),
        'priority': random.choice(['Low','Medium','High']),
        'opened_at': dt.datetime.now() - dt.timedelta(hours=random.randint(0,72))
    })
incidents = pd.DataFrame(rows)
print(incidents.head())
```

## Médias
- Vidéo (placeholder): https://example.com/demo-servicenow
