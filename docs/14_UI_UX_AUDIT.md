# Audit UI/UX — AI-NETSEC

## Portée et invariants

L’audit porte sur les routes existantes de posture, alertes, incidents, actifs, analyse, assistant IA, rapports et administration. Les procédures tRPC, les transitions d’incident, le contrôle de rôle, les actions de mise à jour d’alerte, les exports et l’authentification sont des invariants : la refonte ne les modifie pas.

## Constats priorisés

| Priorité | Observation | Effet utilisateur | Direction de correction |
|---|---|---|---|
| Élevée | Le dashboard affiche des KPI avant toute lecture explicite de la priorité opérationnelle. | L’analyste doit interpréter plusieurs blocs avant de savoir ce qui requiert une action immédiate. | Introduire un résumé de posture prioritaire avec niveau de menace, alertes critiques et accès direct aux investigations. |
| Élevée | La navigation latérale est fonctionnelle mais ne distingue pas clairement détection, réponse, exposition, analyse et gouvernance. | La carte mentale SOC reste faible au premier usage. | Regrouper les liens par domaine opérationnel, garder les routes et adapter les libellés visuels. |
| Élevée | Les panneaux ont une structure et une densité homogènes, y compris les informations réellement critiques. | Les alertes à fort risque ne se distinguent pas suffisamment des informations secondaires. | Définir des variantes de surfaces et de statuts avec une combinaison icône, libellé, contexte et couleur. |
| Moyen | Les tableaux sont lisibles sur grand écran mais offrent peu de repères de tri, de regroupement ou d’action primaire. | La qualification est plus lente lorsque le volume augmente. | Renforcer les en-têtes, le focus des lignes, les filtres et la mise en évidence des actions existantes. |
| Moyen | Certaines zones vides n’expliquent pas toujours la prochaine étape possible. | Les états sans données paraissent passifs. | Standardiser les états vide, chargement, erreur et réussite avec du contexte métier. |
| Moyen | Les vues mobiles existent pour les alertes, mais le shell et les contenus denses nécessitent une vérification systématique. | Risque de surcharge sur petit écran. | Revoir les priorités de contenu, la grille et la navigation aux points de rupture ciblés. |
| Moyen | Les indicateurs de sévérité utilisent un point et une couleur mais peu de sémantique supplémentaire. | Une personne malvoyante ou en contexte de faible contraste peut interpréter plus difficilement le niveau. | Uniformiser les badges avec libellé explicite, icône, texte d’assistance et contrastes renforcés. |

## Principes de refonte retenus

L’interface adoptera une posture **dark-first d’entreprise**, avec un bleu nuit profond, des surfaces différenciées, un cyan mesuré réservé aux interactions et à la supervision, et des couleurs de risque strictement sémantiques. Les panneaux conserveront une densité adaptée aux analystes SOC, sans effets décoratifs excessifs. La première lecture de chaque écran devra clarifier le niveau de risque, le nombre d’objets à traiter et la prochaine action disponible.

Les composants de statut et de données seront rendus cohérents entre les écrans. Les actions irréversibles, transitions et opérations administratives conserveront leurs mécanismes actuels, avec un retour visuel plus explicite. La validation couvrira les vues desktop et mobile, le clavier, les contrastes, les erreurs de console, la compilation et les tests Vitest.

## Vérification visuelle après implémentation

La vérification desktop confirme que la nouvelle vue de posture rend explicitement le niveau de menace, le score associé, le nombre d’alertes critiques et la voie d’accès au centre d’alertes avant les indicateurs secondaires. La navigation a été regroupée par domaines SOC, et les badges de sévérité ou de cycle de vie associent désormais une icône à leur libellé textuel. Les écrans d’alertes, d’incidents, d’actifs, d’assistant, de rapports et d’administration héritent du shell, des surfaces et des composants de statut sans modification de leurs appels de données ou de leurs actions.

La QA mobile confirme que le dashboard conserve sa hiérarchie de sécurité et que le centre d’alertes bascule vers des cartes exploitables. Le débordement horizontal des actions dans les cartes d’incident a été corrigé : les commandes de cycle de vie passent maintenant à la ligne de façon prévisible, sans masquer de bouton ni supprimer d’action.

Les vues desktop de détection, d’inventaire, d’incident, d’analyse, de rapports, d’administration et d’assistance ont été revues après la refonte. Les tables conservent leurs données et leurs actions, tandis que les regroupements de navigation, les en-têtes, les surfaces, les indicateurs et les retours de statut sont cohérents entre les parcours. L’assistant est désormais présenté comme une capacité d’intelligence de sécurité contextualisée, avec une limite d’usage explicite et sans promesse d’exécution automatique.

Les graphiques sont désormais montés seulement après la mesure effective de leur conteneur. Cette précaution conserve la stabilité du rendu lors de l’initialisation, des changements de largeur et des contrôles visuels automatisés, sans altérer les séries, les échelles ou les requêtes existantes.

Les composants de feedback, d’insight et de carte d’alerte ont été intégrés aux écrans disponibles. Les écrans Actifs, Alertes, Rapports et Administration disposent maintenant de hiérarchies et de retours d’état explicites au-delà du shell global. Les vérifications desktop et mobile confirment que les cartes, indicateurs et actions se réorganisent sans débordement ; les actions de qualification des alertes restent accessibles en format compact sur mobile.

## Variante compacte orientée données

La variante demandée adopte une composition plus dense inspirée de la référence : navigation latérale réduite, barre utilitaire avec recherche de section, tuiles de métriques compactes et panneaux analytiques alignés en grille. Les données, termes et priorités du SOC restent spécifiques à AI-NETSEC. Les vérifications desktop et mobile confirment que la barre d’outils, les actions d’alerte et la hiérarchie du dashboard restent exploitables sans introduire de défilement horizontal.
