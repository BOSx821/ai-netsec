# Matrice de recette fonctionnelle et sécurité

## Périmètre

La présente campagne couvre exclusivement l’application AI-NETSEC, son API applicative, sa base de données gérée et les données explicitement marquées `[Démo]` ou `[Recette]`. Elle exclut tout scan, toute découverte active et toute tentative d’accès à des systèmes externes.

| Domaine | Cas de test | Critère d’acceptation |
|---|---|---|
| Authentification | Procédures protégées sans session | Réponse `UNAUTHORIZED` sans fuite de données. |
| Rôles | Appel analyste vers procédure administrateur | Réponse `FORBIDDEN` avant l’accès à la base de données. |
| Validation | Identifiants, statuts et champs hors contrat | Rejet par validation typée, sans mutation. |
| Incidents | Transition non séquentielle | Rejet de la transition et conservation de l’état. |
| Alertes | Statut valide et détail ouvert | Mutation journalisée et détail resynchronisé. |
| Rapport | Export JSON détaillé et impression | Contenu structuré, vue dédiée A4 et éléments d’interface masqués à l’impression. |
| Assistant IA | Réponse structurée et contexte limité | Réponse française prudente; aucune action autonome. |
| Audit | Mutations sensibles | Trace consultable par l’administrateur. |
| Erreurs | Ressource inexistante ou saisie invalide | Erreur contrôlée, sans écran bloqué ni données exposées. |
