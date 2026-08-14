# Exigences du projet — AI-NETSEC SOC

## Finalité

AI-NETSEC est une plateforme de supervision défensive destinée aux analystes et administrateurs de sécurité. Elle centralise les alertes, incidents et actifs surveillés afin de permettre leur qualification, leur priorisation et leur suivi au sein d’une interface SOC unique.

La première version opérationnelle privilégie les parcours essentiels : tableau de bord, alertes, incidents, actifs, analyses de risque, rapports, assistance IA et alertes au propriétaire. Les données de démonstration doivent toujours être explicitement distinguées des données de production.

## Rôles et accès

| Rôle | Accès principal | Restrictions |
|---|---|---|
| `analyst` | Tableau de bord, alertes, incidents, actifs, analyses, assistant IA et rapports | Ne peut pas administrer les utilisateurs ni modifier les paramètres sensibles. |
| `admin` | Tous les droits de l’analyste, gestion des utilisateurs, paramètres et journal d’audit | Seul rôle autorisé à effectuer les opérations administratives. |

Les autorisations sont appliquées côté serveur. L’interface ne constitue jamais le seul mécanisme de protection.

## Règles métier critiques

| Domaine | Règle |
|---|---|
| Incidents | Une transition est valide uniquement dans l’ordre `open → in_progress → resolved → closed`. |
| Alertes | Les niveaux pris en charge sont `critical`, `high`, `medium` et `low`; chaque alerte possède un statut suivi. |
| Notifications | La création d’une alerte critique ou d’un incident de sévérité haute/critique doit déclencher une notification au propriétaire. |
| Assistant IA | L’assistant répond seulement à partir du contexte SOC fourni; il doit signaler clairement les informations indisponibles et ne pas présenter ses suggestions comme des faits établis. |
| Détection réseau | Les scans et collectes réels ne sont autorisés que pour des réseaux explicitement autorisés. Ils ne sont pas exécutés dans la première version applicative. |

## Critères de réussite de la première version

La version initiale doit proposer une expérience d’analyse SOC cohérente avec des données démonstratives identifiées, une persistance relationnelle des objets de sécurité, des contrôles d’accès appliqués côté serveur, une visualisation exploitable du risque, un rapport exportable et des tests couvrant les transitions d’incident ainsi que les contrôles de rôle.
