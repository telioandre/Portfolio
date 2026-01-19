# Automatisation Excel vers une template – Détails du projet

![Automatisation Excel](../../assets/images/excel-automation.png)

## Contexte
Automatisation de l’extraction de données Excel pour les injecter dans une template (génération de livrables).

## Extrait de code (Python + openpyxl)
```python
from openpyxl import load_workbook
wb = load_workbook('source.xlsx')
ws = wb.active
values = [c.value for c in ws['A'][1:]]

tpl = load_workbook('template.xlsx')
tws = tpl.active
for i, v in enumerate(values, start=2):
    tws[f'B{i}'] = v

tpl.save('output.xlsx')
```

## Médias
- Vidéo (placeholder): https://example.com/demo-excel
