# Plan de validation en conditions d’utilisation réelles

## Périmètre autorisé

La campagne teste l’application AI-NETSEC active avec le compte propriétaire déjà authentifié, les données de démonstration explicitement identifiées et les services intégrés de la plateforme. Elle couvre l’authentification, les restrictions de rôle, les parcours de gestion SOC, le rapport de posture, l’assistant IA et la notification du propriétaire.

## Exclusions de sécurité

Aucun scan, aucune découverte active, aucune capture de trafic, aucune tentative de connexion et aucune action de détection ne sera dirigée vers un réseau ou un système externe. La plateforme ne dispose pas encore de collecteur réseau relié à un environnement autorisé; la validation de ces connecteurs fera l’objet d’une campagne distincte, seulement après définition écrite du périmètre et des autorisations.

## Critères d’acceptation

| Parcours | Attendu |
|---|---|
| Accès authentifié | Les pages SOC sont accessibles et les données se chargent. |
| Rôles | L’administrateur accède à l’audit; un analyste ne peut pas interroger les fonctions administratives. |
| Incident | Création, assignation, commentaire et transitions ordonnées sont conservés. |
| Alerte critique | La création génère une notification destinée au propriétaire. |
| Rapport | La posture est persistée et exportée. |
| Assistant IA | Une réponse en français est produite à partir du contexte SOC, sans action automatisée. |

## Observation d’accès réel

Le 14 août 2026, une session OAuth administrateur a été établie dans le navigateur personnel. Le tableau de bord actif a chargé les données `[Démo]` : trois alertes, un incident ouvert, trois actifs, un score de risque global de 72/100 et le menu Administrateur. Cette observation confirme le chargement authentifié des données, la signalisation explicite du mode démonstration et la visibilité du rôle administrateur.

## Résultats de recette en cours

| Parcours | Résultat observé | État |
|---|---|---|
| Connexion OAuth administrateur | Retour réussi vers l’application et données SOC chargées. | Validé |
| Navigation administrateur | Les espaces Dashboard, Alertes, Incidents, Actifs, Analyse, Assistant IA, Rapports et Administration sont visibles. | Validé |
| Administration et audit | Le journal d’audit réel est accessible avec des traces `demo.seed` et `assistant.ask`. | Validé |
| Centre d’alertes | Quatre alertes de démonstration sont affichées avec sévérité, actif, risque et statut. | Validé |
| Filtre de sévérité | Le choix `Critique` réduit le résultat à l’alerte critique attendue. | Validé |
| Détail d’alerte | Les informations de source/destination, méthode, confiance, contexte IA et recommandations sont visibles. | Validé |
| Rôle Analyste | La navigation ne montrait pas Administration après changement temporaire de rôle dans la base, mais la session OAuth déjà émise conservait son rôle Administrateur côté serveur. Un second compte OAuth est requis pour une validation intégrale du refus d’accès en session Analyste. | Partiel |
| Mise à jour d’alerte | L’alerte critique de démonstration a été déplacée de `open` vers `in_progress`. Le détail ouvert était initialement désynchronisé; une invalidation de la requête de détail a été ajoutée et validée par compilation/tests. | Validé après correction |
| Assignation d’incident | L’incident de démonstration a été affecté au compte administrateur, puis le responsable `oussama` a été affiché après rafraîchissement. | Validé |
| Cycle de vie d’incident | La séquence `open → in_progress → resolved → closed` a été exécutée intégralement, avec le statut final `Fermé`. | Validé |
| Historique d’incident | Une observation de recette a été ajoutée et apparaît au sommet de l’historique avec l’auteur et l’horodatage. | Validé |
| Inventaire d’actifs | Les trois actifs `[Démo]` sont listés avec plateforme, IP, disponibilité, niveau et score de risque. | Validé |
| Analyse des risques | Les KPI, la tendance sur trois jours, la distribution par sévérité, les catégories et les actifs prioritaires sont calculés et affichés. | Validé |
| Rapport de posture | Un rapport `RPT-0001` a été généré, persisté, affiché dans la liste et exporté en JSON. | Validé |
| Assistant IA | Le premier essai a révélé une réponse vide liée au modèle GPT et à sa limite de sortie. Après sélection préférentielle de `claude-haiku` et correction du traitement de contenu structuré, une réponse française détaillée a été reçue avec faits observés et recommandations défensives. | Validé après correction |
| Notification critique | L’incident fictif `INC-30001` a créé l’entrée `incident.high_severity.notification`; le journal contient `{"delivered": true}` et l’écran Administration affiche l’opération comme réussie. | Validé |
| Journal d’audit | Les créations, transitions, commentaire, requête IA, génération de rapport et notification sont visibles dans l’espace Administrateur. | Validé |
| Rendu assistant | La réponse IA est désormais présentée avec titres, séparateurs et listes sans marqueurs Markdown bruts. Les tableaux Markdown restent affichés sous forme de texte structuré, ce qui n’empêche pas la lecture. | Validé |

## Conclusion de recette

Les parcours disponibles dans l’interface ont été exercés avec une session administrateur réelle et des objets clairement nommés `[Démo]` ou `[Recette]`. La notification propriétaire a été confirmée côté système par le journal d’audit avec `delivered: true`. Aucune interaction réseau externe, aucun scan et aucune ingestion de flux réel n’ont été réalisés.

La vérification interactive d’un rôle Analyste dans une seconde session OAuth distincte reste à planifier. Un changement temporaire de rôle a bien masqué le menu Administration dans l’interface; la protection côté serveur est par ailleurs couverte par le test RBAC automatisé réussi.

## Vérification complémentaire de synchronisation

Le 14 août 2026, l’alerte de démonstration `ALT-00003` a été affichée dans son panneau de détail au statut **Ouverte**, puis modifiée vers **En cours** sans fermer ce panneau. Le tableau et le panneau de détail ont tous deux affiché immédiatement le nouveau statut après la mutation. La correction de synchronisation est donc validée en session réelle.
