# Rapport de posture détaillé

## Objectif

Le rapport détaillé transforme les données SOC disponibles au moment de la génération en une synthèse imprimable pour l’analyste, le responsable sécurité ou l’administrateur. Il présente des observations issues de la plateforme, sans extrapoler des résultats de scan, de collecte réseau ou de détection non présents dans les données.

## Structure imprimable

| Section | Contenu |
|---|---|
| En-tête | Identifiant, date UTC, auteur et mention du périmètre de données. |
| Synthèse exécutive | Score global, alertes actives, incidents en cours et couverture des actifs. |
| Tendance du risque | Points de mesure disponibles et évolution récente. |
| Alertes prioritaires | Sévérité, statut, score, actif, source de détection et confiance. |
| Incidents actifs | Dossier, sévérité, statut, responsabilité, actif associé et score. |
| Actifs prioritaires | Équipements critique/élevé, disponibilité, propriété et score. |
| Recommandations | Mesures de vérification et de remédiation dérivées de la posture observée. |
| Limites | Informations non disponibles, données de démonstration et absence de collecte réseau directe. |

## Format d’export

Le JSON inclut les mêmes sections sous forme structurée et conserve l’horodatage de génération. La vue dédiée est préparée pour l’impression navigateur ou l’enregistrement PDF; la navigation et les contrôles applicatifs sont masqués à l’impression.

## Validation dans l’application

Un rapport détaillé `RPT-30002` a été généré avec succès dans l’environnement actif. Son aperçu présente le score global, la couverture, les tendances, les alertes et incidents prioritaires, les actifs à risque élevé, les recommandations, le périmètre et les limites. La métrique des incidents actifs a été vérifiée à `1` et la copie destinée à l’impression est désormais masquée à l’écran.

L’action **Imprimer / PDF** appelle le dialogue natif `window.print()`. Dans le navigateur connecté, ce dialogue bloque volontairement l’automatisation après son ouverture; l’utilisateur peut y choisir *Enregistrer au format PDF* pour produire le document détaillé.

Le bouton d’impression ne devient disponible qu’après sélection d’un rapport détaillé. À l’impression, les éléments de navigation et de contrôle sont masqués et seule la copie dédiée du rapport est envoyée au dialogue PDF.

## Composition A4 professionnelle

La version imprimée est conçue pour une page **A4 en portrait**. La grille utilise des marges de 12 mm sur les côtés, 14 mm en haut et 16 mm en bas afin de préserver une zone de lecture régulière et un espace de pied de page. La police est réduite de façon contrôlée pour la sortie papier, sans utiliser de tailles inférieures à 7,5 points pour les données tabulaires.

| Élément | Règle A4 |
|---|---|
| Couverture | Titre, référence, date, auteur et classification du document. |
| En-tête courant | Nom de la plateforme et référence du rapport après la couverture. |
| Sections | Titres hiérarchisés, espacement régulier et prévention des ruptures à l’intérieur d’un bloc. |
| Tableaux | En-tête répété à chaque page, lignes non scindées et colonnes adaptées à la largeur papier. |
| Pagination | Saut de page avant les alertes prioritaires et pied de document avec référence. |
| Couleurs | Palette limitée à l’identité AI-NETSEC, conservée avec l’option d’impression des arrière-plans activée. |

La boîte de dialogue PDF du navigateur doit être réglée sur **A4**, orientation **Portrait**, marges **Par défaut** et impression des graphiques/arrière-plans activée afin de préserver les étiquettes de sévérité.

## Validation de la mise en page

L’aperçu du rapport détaillé a été vérifié dans l’application avec la référence `RPT-30002`. Il affiche l’en-tête AI-NETSEC, la mention de diffusion restreinte, les indicateurs de synthèse, les tableaux de priorité, les recommandations et le pied de document. La feuille d’impression utilise désormais une source dédiée au format A4 et masque la navigation, les actions et l’aperçu écran lors de l’export PDF.
