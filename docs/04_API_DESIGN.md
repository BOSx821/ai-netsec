# Contrat applicatif — AI-NETSEC SOC

## Principes

Les interactions applicatives passent par des procédures typées. Les entrées sont validées, les accès sont contrôlés côté serveur et aucune information sensible n’est renvoyée à un utilisateur non autorisé.

| Domaine | Cas d’usage initiaux | Niveau requis |
|---|---|---|
| `dashboard` | Consulter la synthèse SOC, les KPI et les tendances | Analyste ou administrateur |
| `alerts` | Lister, filtrer, consulter et mettre à jour une alerte | Analyste ou administrateur |
| `incidents` | Créer, assigner, commenter et faire progresser un incident | Analyste ou administrateur |
| `assets` | Lister et consulter les actifs supervisés | Analyste ou administrateur |
| `reports` | Générer, consulter et exporter un rapport de posture | Analyste ou administrateur |
| `assistant` | Poser une question SOC avec contexte limité | Analyste ou administrateur |
| `admin` | Consulter l’audit et gérer les paramètres sensibles | Administrateur |

Les changements d’état des incidents sont validés avant persistance. Les alertes critiques et incidents à haute sévérité sont notifiés par le serveur, indépendamment de l’interface utilisée.
