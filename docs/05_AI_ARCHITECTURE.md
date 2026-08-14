# Architecture IA — AI-NETSEC SOC

## Assistant d’analyse

L’assistant IA est une aide à l’analyse et non un moteur de décision autonome. Le serveur constitue un contexte concis à partir de l’alerte, de l’incident, de l’actif et des tendances pertinentes avant de l’envoyer au modèle. Les réponses proposent une explication, des éléments à vérifier et des mesures de remédiation prudentes.

Le prompt système exige de distinguer les éléments observés, les hypothèses et les informations absentes. Une réponse ne doit jamais affirmer l’exécution d’une action ou la détection d’un fait non présent dans le contexte fourni.

## Évolution ML

Les modèles de détection d’anomalie et de classification sont prévus comme services distincts. Les résultats exploités par le SOC devront inclure la source, la version du modèle, le score, la confiance, les caractéristiques explicatives et la date d’inférence. L’entraînement et l’évaluation sur des jeux de données de référence restent une phase ultérieure documentée, sans résultat inventé.
