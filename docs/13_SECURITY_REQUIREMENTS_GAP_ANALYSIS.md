# Vérification des exigences de sécurité fournies

## Portée de la vérification

Cette analyse compare les exigences du document fourni avec l’implémentation AI-NETSEC revue dans le dépôt et les résultats de recette déjà disponibles. Elle ne constitue pas un test d’intrusion sur une infrastructure externe, et elle ne confirme pas la configuration du fournisseur OAuth, de la base gérée ou de l’hébergement, qui restent hors du code applicatif visible.

## Contrôles déjà présents

| Exigence | État | Éléments vérifiés |
|---|---|---|
| Authentification côté serveur | Partiellement couvert | Le contexte tRPC ne fournit l’utilisateur qu’après authentification; les procédures protégées refusent les sessions absentes. |
| Protection OAuth contre le CSRF | Couvert | Le callback contrôle le nonce `state` contre le cookie à usage unique avant l’échange de code. |
| RBAC backend | Couvert | Les procédures administrateur vérifient `ctx.user.role === admin`; un test refuse l’audit à un analyste. |
| Validation des entrées | Couvert sur les procédures SOC | Zod borne les statuts, identifiants, tailles de texte et scores avant les mutations. |
| Injection SQL | Couvert dans la couche revue | Drizzle utilise des opérations typées et paramétrées; aucune concaténation SQL applicative n’a été observée. |
| Transitions métier | Couvert | Le cycle d’incident est contrôlé côté serveur et testé. |
| Journalisation | Partiellement couvert | Les mutations sensibles sont journalisées; le collecteur de diagnostic masque désormais les en-têtes sensibles. |
| Assistant IA | Partiellement couvert | L’accès est authentifié, le contexte est limité, les actions autonomes et instructions offensives sont interdites par le prompt système. |
| Réseau actif et uploads | Non applicable à la version actuelle | Aucun scan, shell réseau, collecte active ou flux d’upload métier n’est implémenté. |

## Écarts prioritaires

| ID | Priorité | Exigence non satisfaite ou partielle | Risque | Recommandation |
|---|---|---|---|---|
| SEC-01 | Élevée | Aucune limitation de débit applicative n’est visible pour OAuth, l’assistant IA, la génération de rapports ou les mutations. | Abus, épuisement de ressources et consommation IA non maîtrisée. | Ajouter un rate limiting par utilisateur/IP aux procédures coûteuses et aux routes OAuth. |
| SEC-02 | Élevée | Les données SOC sont accessibles à tout utilisateur authentifié sans contrôle de périmètre, organisation, propriétaire ou équipe. | Exposition excessive si la plateforme devient multi-client ou multi-équipe. | Introduire une notion de tenant/périmètre et filtrer chaque lecture ou mutation par autorisation de ressource. |
| SEC-03 | Moyenne | Les réponses IA contiennent des descriptions et historiques non cloisonnés par délimiteurs de données non fiables. | Une alerte malveillante peut tenter d’influencer les recommandations du modèle. | Étiqueter les données SOC comme non fiables, séparer instructions/contexte et ajouter une validation de sortie. |
| SEC-04 | Moyenne | La session OAuth est valide un an; aucune rotation, révocation applicative ni politique MFA n’est visible dans le code. | Persistance d’un jeton compromis. | Réduire la durée de session, prévoir révocation/renouvellement et s’appuyer sur une MFA configurée chez le fournisseur OAuth. |
| SEC-05 | Moyenne | Le serveur n’expose ni sécurité HTTP explicite (CSP, HSTS, frame protection, nosniff) ni limite spécialisée; le parseur global accepte 50 MB. | Surface HTTP et consommation mémoire plus larges que nécessaire. | Ajouter des en-têtes compatibles, abaisser les limites globales et définir des limites par route. |
| SEC-06 | Moyenne | Les erreurs tRPC/Express ne disposent pas d’une politique de réponse de production explicitement normalisée. | Risque de fuite de détails techniques selon l’environnement. | Ajouter un formateur d’erreurs sûr côté API et réserver les traces au journal serveur protégé. |
| SEC-07 | Basse | Le dépôt ne contient pas de `.env.example`, ni pipeline CI de sécurité, ni configuration Docker à durcir. | Préparation insuffisante à la reproductibilité et au déploiement contrôlé. | Créer un modèle de variables sans valeurs, une CI avec tests/audit dépendances et documenter les contrôles de déploiement. |
| SEC-08 | Basse | Le journal d’audit conserve les opérations réussies mais ne distingue pas systématiquement les échecs ou refus d’autorisation. | Investigation incomplète lors d’un abus ou d’une tentative de contournement. | Journaliser de manière minimale les refus sensibles, sans inscrire de secret ni de contenu non nécessaire. |

## Appréciation de sécurité

La base applicative est **correctement structurée pour une première version SOC défensive** : accès protégés par le serveur, contrôle administrateur centralisé, validation de contrat, ORM, audit métier, restrictions de cycle de vie et absence de fonctions de scan offensif. La campagne précédente a aussi confirmé le refus HTTP 401 sans session, les rejets de contrat et le masquage des jetons dans les nouveaux journaux de diagnostic.

Elle ne répond toutefois pas encore au niveau d’une revue de production exhaustive tel que demandé dans le document fourni. Les chantiers prioritaires sont la limitation de débit, l’autorisation par périmètre métier, le durcissement de session et HTTP, et la résistance de l’IA aux données hostiles. Ces améliorations doivent être accompagnées de tests de régression et d’une seconde revue avant une ouverture à plusieurs organisations.
