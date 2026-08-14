# Conception de sécurité — AI-NETSEC SOC

## Contrôles appliqués

L’authentification s’appuie sur le fournisseur OAuth déjà intégré. Les procédures protégées vérifient la présence d’un utilisateur authentifié; les procédures administratives vérifient son rôle côté serveur. Les entrées sont validées par schéma avant traitement et les mutations importantes créent une trace d’audit.

| Risque | Contrôle de la première version |
|---|---|
| Élévation de privilèges | Autorisation serveur par procédure et rôle. |
| Transitions d’incident invalides | Machine d’état contrôlée côté serveur. |
| Manipulation de données | Validation stricte des entrées et requêtes typées. |
| Fuite d’informations via l’IA | Contexte minimal, sans secret ni donnée inutile. |
| Réseau non autorisé | Aucun scan actif; les futures intégrations exigeront une configuration explicite d’autorisation. |
| Actions sensibles non traçables | Historique des incidents et journal d’audit. |

Les secrets d’environnement ne sont jamais conservés dans le dépôt. La mise en production exige une revue de sécurité, un paramétrage TLS et une stratégie de conservation des données adaptée au contexte d’exploitation.
