# Modèle de données — AI-NETSEC SOC

## Entités de la première version

| Entité | Finalité | Relations clés |
|---|---|---|
| `assets` | Actifs surveillés, contexte métier et niveau de risque | Référencé par les alertes et incidents. |
| `alerts` | Signal de sécurité qualifié et priorisé | Associé à un actif, un analyste et éventuellement un incident. |
| `incidents` | Dossier d’investigation regroupant des alertes | Contient une chronologie et une responsabilité. |
| `incident_actions` | Historique immuable des changements et commentaires | Rattaché à un incident et à l’utilisateur auteur. |
| `risk_snapshots` | Points de mesure pour les tendances de risque | Permet les graphiques dans le temps. |
| `reports` | Métadonnées des rapports de posture générés | Rattaché à l’utilisateur générateur. |
| `audit_logs` | Traçabilité des opérations sensibles | Rattaché à l’utilisateur initiateur. |

## Conventions

Les dates métier sont conservées en UTC. Les valeurs d’état sont représentées par des énumérations contrôlées. Les relations imposent l’intégrité référentielle, et les historiques sont ajoutés plutôt que réécrits afin de préserver l’auditabilité.

## Évolution prévue

Les futures intégrations introduiront des tables de journaux normalisés, d’événements de sécurité, de sources de données, de travaux de scan autorisés et de modèles IA. Elles resteront découplées des objets SOC principaux afin d’éviter de bloquer les parcours analystes en cas d’indisponibilité d’un collecteur.
