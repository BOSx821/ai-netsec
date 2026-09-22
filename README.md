# AI-NETSEC

> **Plateforme SOC défensive assistée par l’intelligence artificielle** pour centraliser les alertes, suivre les incidents, surveiller les actifs et analyser la posture de sécurité.

AI-NETSEC fournit un espace opérationnel destiné aux équipes de sécurité. La plateforme aide à qualifier les événements, prioriser les risques et suivre les actions de traitement dans un environnement contrôlé. Les autorisations sont appliquées côté serveur et l’assistant IA reste limité au contexte SOC disponible.

## Accès à la démonstration

La version déployée est accessible à l’adresse suivante :

**<https://aiseclplat-fqvigzax.manus.space>**

Les données de démonstration sont clairement identifiées dans l’application. Elles servent à valider les parcours fonctionnels et ne représentent pas des données de production.

## Fonctionnalités principales

| Domaine | Fonctionnalités |
|---|---|
| **Dashboard SOC** | Indicateurs de posture, score de risque global, tendances, catégories de menaces, couverture des systèmes et événements récents. |
| **Centre d’alertes** | Création, filtrage, consultation détaillée et changement de statut des alertes, avec sévérité, score de risque, niveau de confiance et actif associé. |
| **Incidents** | Création, affectation, auto-affectation, commentaires, historique et transitions contrôlées du cycle `open → in_progress → resolved → closed`. |
| **Inventaire des actifs** | Suivi des systèmes surveillés, de leur type, propriétaire, criticité, disponibilité et score de risque. |
| **Analyse des risques** | Visualisation des tendances et répartition des risques à partir des données persistées. |
| **Rapports** | Rapport de posture détaillé avec synthèse exécutive, alertes prioritaires, incidents, actifs à risque, tendances et recommandations. Le rendu imprimable respecte le format A4. |
| **Assistant IA** | Analyse en langage naturel des alertes, incidents et indicateurs SOC, avec réponses Markdown contextualisées. |
| **Gouvernance** | Rôles Analyste et Administrateur, journal d’audit, contrôles d’accès serveur et notifications pour les événements critiques. |

## Architecture

```text
React 19 + Tailwind CSS 4 + Vite
                │
                ▼
       tRPC 11 + React Query
                │
                ▼
       Express 4 + procédures protégées
          │          │           │
          ▼          ▼           ▼
      Drizzle      Assistant   Notifications
       ORM            IA
          │          │           │
          └──────────┴───────────┘
                     │
                     ▼
                 MySQL / TiDB
```

L’interface React communique avec le serveur au moyen de procédures tRPC typées. Le serveur Express centralise l’authentification, l’autorisation et les règles métier. Drizzle ORM assure l’accès relationnel à MySQL ou TiDB. Les services IA et de notification sont appelés côté serveur afin d’éviter l’exposition des secrets dans le navigateur.

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Lucide, Recharts et Wouter |
| Données client | TanStack React Query, tRPC 11 et SuperJSON |
| Backend | Node.js, Express 4, tRPC 11 et Zod |
| Persistance | MySQL ou TiDB, Drizzle ORM et Drizzle Kit |
| Authentification | Manus OAuth et sessions HTTP sécurisées |
| IA et notifications | Services intégrés appelés côté serveur |
| Qualité | TypeScript, Vitest et Prettier |

## Rôles et autorisations

| Rôle | Description | Accès principal |
|---|---|---|
| `user` | Analyste sécurité | Dashboard, alertes, incidents, actifs, analyses, rapports et assistant IA |
| `admin` | Administrateur SOC | Tous les accès Analyste, plus les fonctions d’administration, les données de démonstration et le journal d’audit |

Les autorisations ne dépendent pas uniquement de l’interface. Les procédures sensibles vérifient le rôle de l’utilisateur côté serveur. Les transitions d’incident et les validations d’entrée sont également contrôlées avant la persistance.

## Prérequis locaux

- **Node.js 22** ou une version compatible avec le projet ;
- **pnpm 10** ;
- une base **MySQL ou TiDB** accessible par `DATABASE_URL` ;
- les services d’authentification et intégrés configurés pour l’environnement utilisé.

## Installation

```bash
git clone https://github.com/BOSx821/ai-netsec.git
cd ai-netsec
pnpm install
```

Le dépôt GitHub est privé. L’accès nécessite donc une autorisation GitHub appropriée.

Configurez ensuite les variables d’environnement nécessaires. Dans l’environnement managé, certaines valeurs sont injectées automatiquement. Ne commitez jamais de fichier `.env`, de clé privée ou de secret applicatif.

| Variable | Utilité |
|---|---|
| `DATABASE_URL` | Connexion MySQL ou TiDB |
| `JWT_SECRET` | Signature des sessions applicatives |
| `VITE_APP_ID` | Identifiant de l’application OAuth |
| `OAUTH_SERVER_URL` | URL du serveur OAuth |
| `VITE_OAUTH_PORTAL_URL` | Portail de connexion côté navigateur |
| `BUILT_IN_FORGE_API_URL` | URL des services intégrés côté serveur |
| `BUILT_IN_FORGE_API_KEY` | Clé serveur des services intégrés |
| `OWNER_OPEN_ID` / `OWNER_NAME` | Identification du propriétaire pour l’administration et les notifications |

Initialisez la base puis démarrez le serveur de développement :

```bash
pnpm db:push
pnpm dev
```

L’application est ensuite disponible sur `http://localhost:3000`.

## Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Lance le serveur Express/Vite en mode développement. |
| `pnpm build` | Construit le frontend et le bundle serveur de production. |
| `pnpm start` | Lance le bundle de production. |
| `pnpm check` | Exécute la vérification TypeScript sans émettre de fichiers. |
| `pnpm test` | Exécute les tests Vitest. |
| `pnpm format` | Formate le projet avec Prettier. |
| `pnpm db:push` | Génère puis applique les migrations Drizzle. |

## Modèle de données

Les principales entités persistées sont les utilisateurs, actifs, alertes, incidents, actions d’incident, instantanés de risque, rapports et journaux d’audit.

```text
User ──< AuditLog
  │
  ├──< Alert >── Asset
  └──< Incident >── Asset
             │
             └──< IncidentAction

RiskSnapshot ──> Dashboard et rapports
Report ────────> Synthèses de posture
```

## Sécurité et limites de l’assistant IA

AI-NETSEC applique une validation des entrées avec Zod, des procédures tRPC protégées, une séparation des rôles, une journalisation des actions sensibles et des notifications lors de la création d’une alerte critique ou d’un incident de haute sévérité.

L’assistant IA est un outil d’aide à l’analyse. Il ne remplace pas la décision d’un analyste, ne confirme pas à lui seul une compromission et n’exécute pas d’action sur l’infrastructure. Ses réponses sont produites à partir du contexte SOC transmis par l’application et doivent être vérifiées par un professionnel.

Cette version ne fournit pas de scan réseau actif, de capture réseau, d’ingestion native de journaux externes, de connexion directe à un SIEM/IDS ou d’entraînement de modèles de détection. Ces capacités peuvent faire l’objet d’une évolution ultérieure.

## Validation

La version actuelle a été validée sur les parcours fonctionnels principaux et les contrôles de sécurité autorisés. La suite de tests automatisés comprend **10 spécifications Vitest réussies**. Les contrôles couvrent notamment les procédures sensibles, les validations d’entrée, les refus sans session, la génération de rapports, la chronologie des incidents, les notifications critiques et la journalisation d’audit.

La recette réelle a été effectuée avec la session disponible. La validation d’un second rôle OAuth indépendant nécessite une seconde session utilisateur distincte.

## Structure du projet

```text
client/
  src/pages/          # Vues du dashboard et des domaines SOC
  src/components/     # Layout, composants UI et éléments réutilisables
server/
  routers/            # Procédures métier SOC et assistant IA
  _core/              # Authentification et services intégrés
  db.ts               # Accès aux données
  storage.ts          # Gestion du stockage
shared/               # Types et constantes partagés
drizzle/              # Schéma relationnel et migrations
docs/                 # Architecture, exigences, sécurité et validation
```

## Déploiement

AI-NETSEC est une application full-stack. Son déploiement doit fournir un runtime Node.js, le serveur Express, l’accès à la base de données et les variables d’environnement nécessaires. GitHub Pages n’est pas adapté, car il ne peut pas exécuter le backend, les procédures tRPC, OAuth ou les accès base de données.

La version de démonstration est publiée sur un hébergement managé avec une URL HTTPS. Un domaine personnalisé peut être associé depuis les paramètres de domaine de l’environnement d’hébergement.

## Licence

Le projet est distribué sous licence **MIT**, conformément au champ `license` de `package.json`.

## Références

[1]: https://react.dev/ "Documentation officielle React"
[2]: https://trpc.io/ "Documentation officielle tRPC"
[3]: https://orm.drizzle.team/ "Documentation officielle Drizzle ORM"
[4]: https://vitest.dev/ "Documentation officielle Vitest"
