# Architecture — AI-NETSEC SOC

## Décision d’implémentation

Le rapport initial propose une architecture Flutter, FastAPI et PostgreSQL. La plateforme est développée dans l’environnement full-stack déjà provisionné : React pour l’interface, Express avec tRPC pour les contrats serveur, MySQL compatible via Drizzle pour la persistance et Manus OAuth pour l’authentification. Cette adaptation préserve la séparation des responsabilités et permet de livrer rapidement une base applicative contrôlable.

## Couches

| Couche | Responsabilité | Implémentation actuelle |
|---|---|---|
| Présentation | Visualiser l’état SOC et exécuter les actions analystes | React, Tailwind, composants accessibles et tableaux de bord réactifs |
| Contrat applicatif | Validation des entrées, autorisation et exposition des cas d’usage | Routeurs tRPC avec procédures publiques, protégées et administrateur |
| Domaine SOC | Gestion des alertes, incidents, risques, actifs, audit et rapports | Services et procédures organisés par domaine |
| Intelligence | Analyse contextuelle des alertes et incidents | Assistant IA côté serveur, enrichi avec le contexte minimum nécessaire |
| Persistance | Conservation des entités et de leurs relations | Drizzle ORM et base relationnelle |
| Intégrations futures | Collecte réseau, IDS, SIEM, ML et fournisseurs de LLM | Adaptateurs configurables, séparés du noyau SOC |

## Limites et extension

La première version ne lance ni scan Nmap, ni capture réseau, ni entraînement de modèle ML dans l’environnement de production. Ces capacités requièrent une infrastructure autorisée, des collecteurs dédiés et des garde-fous supplémentaires. Le modèle de données et les interfaces de domaine sont conçus pour accueillir ultérieurement les événements normalisés provenant de sources telles que Suricata, Zeek ou Syslog.
