# Résultats de recette fonctionnelle et sécurité

| Contrôle | Observation | Résultat |
|---|---|---|
| API sans session | L’appel direct de `soc.alerts.list` sans cookie retourne HTTP 401 et `UNAUTHORIZED`. | Validé |
| Tests de contrat | Les entrées hors schéma, commentaires vides et transitions vers une ressource inexistante sont rejetés avant mutation. | Validé |
| Tests automatisés | `pnpm check` a réussi; 10 scénarios Vitest ont réussi. | Validé |
| Audit administrateur | Le journal affiche les transitions, rapports, appels IA et notifications critiques récentes. | Validé |
| Export JSON | L’action JSON du rapport détaillé a été déclenchée dans la session administrateur. | Validé |
| Synchronisation alerte | Le statut de `ALT-00003` a été mis à jour avec le détail ouvert; les deux vues ont affiché `En cours`. | Validé |
| Protection des journaux | Après rechargement, les requêtes authentifiées récentes affichent `authorization: [REDACTED]` dans les journaux de développement; aucune valeur Bearer n’est affichée dans les entrées post-correctif. | Validé |

## Limites de cette campagne

Les contrôles ont porté sur l’application et ses procédures accessibles. Aucune attaque, exploration de vulnérabilité, analyse de trafic externe, scan ou action dirigée vers des systèmes hors de la plateforme n’a été menée. La validation d’une seconde session OAuth Analyste reste recommandée pour compléter le scénario de séparation de rôles dans un navigateur distinct.

## Mesure corrective appliquée

La revue des journaux de développement a identifié que le collecteur de diagnostic enregistrait auparavant les en-têtes de requête sans leur appliquer le mécanisme de masquage déjà disponible pour les autres objets. Le collecteur applique désormais `sanitizeValue` aux en-têtes de requête et de réponse avant journalisation. Une nouvelle requête authentifiée a confirmé le remplacement de l’en-tête d’autorisation par la valeur `[REDACTED]` dans les entrées post-correctif.

## Décision de recette

La campagne autorisée est **acceptée avec réserve de périmètre**. Les parcours applicatifs et les contrôles serveur testés répondent aux critères de la matrice. La réserve concerne uniquement la vérification interactive du rôle Analyste dans une seconde session OAuth distincte, qui doit être exécutée avant une mise en production à large échelle.
