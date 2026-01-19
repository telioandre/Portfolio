# Data WPS/SAS + Power BI – Détails du projet

![Workflow Data](../../assets/images/wps-powerbi.png)

## Contexte
Création/gestion de tables via **WPS/SAS** (macros, variables), visualisation dans **Power BI**, mise à jour mensuelle via **Power Automate**.

## Extrait SAS
```sas
%macro build_table(month);
  data work.kpis;
    set source.transactions;
    where month(date) = &month.;
  run;
%mend;
%build_table(12);
```

## Power Automate
- Flow mensuel qui rafraîchit le dataset Power BI
- Envoi d’un rapport PDF aux parties prenantes

## Médias
- Doc/vidéo (placeholder): https://example.com/demo-wps-powerbi
