# AI-NETSEC

> **Plateforme SOC défensive** permettant de centraliser les alertes, incidents, actifs surveillés et indicateurs de risque dans une interface d’analyse unique.

AI-NETSEC aide les équipes sécurité à **qualifier**, **prioriser** et **suivre** les événements de sécurité. Elle privilégie des flux de travail explicites, des contrôles d’accès appliqués côté serveur et une assistance IA encadrée par le contexte SOC réellement disponible.

## Fonctionnalités

| Domaine | Capacités disponibles |
|---|---|
| **Dashboard SOC** | KPI de posture, score de risque global, tendance de risque, répartition des menaces, couverture système et événements récents. |
| **Alertes** | Création, filtrage, consultation et mise à jour de statut des alertes avec sévérité, score de risque, niveau de confiance et actif associé. |
| **Incidents** | Création, affectation, commentaires et cycle de vie contrôlé : `open → in_progress → resolved → closed`. |
| **Actifs** | Inventaire des systèmes surveillés avec type, propriétaire, criticité, état de disponibilité et niveau de risque. |
| **Analyse** | Visualisations des tendances et catégories de risque à partir des données persistées dans la plateforme. |
| **Rapports** | Génération de rapports de posture incluant synthèse exécutive, alertes prioritaires, incidents actifs, actifs à risque et recommandations. |
| **Assistant IA** | Assistant d’analyse en français, contextualisé par le dashboard, une alerte ou un incident sélectionné. |
| **Gouvernance** | Journal d’audit, contrôle de rôles côté serveur et notifications du propriétaire pour les événements de forte criticité. |

## Aperçu de l’architecture

```text
React 19 + Tailwind CSS 4 + Vite
             │
             ▼
       tRPC / React Query
             │
             ▼
Express 4 + procédures protégées tRPC
      │              │              │
      ▼              ▼              ▼
Drizzle ORM      Assistant IA    Notifications
      │              │              │
      └──────────────┴──────────────┘
                     │
                     ▼
                MySQL / TiDB
```

L’interface React consomme exclusivement les procédures tRPC. Le serveur Express applique l’authentification, les autorisations et les règles métier ; Drizzle ORM gère la persistance relationnelle. L’assistant IA et les notifications sont déclenchés côté serveur afin de ne pas exposer les secrets applicatifs au navigateur.

## Stack technique

| Couche | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Lucide, Recharts, Wouter |
| Données client | TanStack React Query, tRPC 11, SuperJSON |
| Backend | Node.js, Express 4, tRPC 11, Zod |
| Base de données | MySQL/TiDB, Drizzle ORM et Drizzle Kit |
| Authentification | Manus OAuth avec sessions HTTP sécurisées |
| IA et notifications | Services intégrés côté serveur |
| Qualité | TypeScript, Vitest, Prettier |

## Rôles et contrôle d’accès

| Rôle stocké | Usage | Droits principaux |
|---|---|---|
| `user` | Analyste sécurité | Dashboard, alertes, incidents, actifs, analyses, assistant IA et rapports. |
| `admin` | Administrateur SOC | Droits analyste, création d’actifs, amorçage des données de démonstration et consultation du journal d’audit. |

Les autorisations ne reposent pas uniquement sur l’interface : les procédures sensibles utilisent des contrôles côté serveur. Les transitions d’incident sont également validées côté serveur avant leur persistance.

## Démarrage local

### Prérequis

| Outil | Version recommandée |
|---|---|
| Node.js | 22 ou version compatible avec le projet |
| pnpm | 10 |
| Base de données | MySQL ou TiDB accessible via `DATABASE_URL` |

### Installation

```bash
git clone https://github.com/BOSx821/ai-netsec.git
cd ai-netsec
pnpm install
```

Configurez ensuite les variables d’environnement de votre instance. Les clés système sont injectées automatiquement dans l’environnement managé ; ne les commitez jamais dans le dépôt.

| Variable | Utilité |
|---|---|
| `DATABASE_URL` | Chaîne de connexion MySQL/TiDB. |
| `JWT_SECRET` | Signature des sessions applicatives. |
| `VITE_APP_ID` | Identifiant de l’application OAuth. |
| `OAUTH_SERVER_URL` | URL du serveur OAuth. |
| `VITE_OAUTH_PORTAL_URL` | Portail de connexion utilisé côté navigateur. |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Accès serveur aux services intégrés, notamment IA et notifications. |
| `OWNER_OPEN_ID` / `OWNER_NAME` | Identification du propriétaire pour les notifications et l’administration. |

Lancez ensuite l’application :

```bash
pnpm dev
```

## Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Démarre le serveur de développement Express/Vite. |
| `pnpm build` | Produit le build frontend et le bundle serveur. |
| `pnpm start` | Démarre le build de production. |
| `pnpm check` | Lance la vérification TypeScript sans génération de fichiers. |
| `pnpm test` | Exécute les tests Vitest. |
| `pnpm format` | Formate le projet avec Prettier. |
| `pnpm db:push` | Génère puis applique les migrations Drizzle. |

## Modèle de données

Les entités persistées couvrent les utilisateurs, actifs, alertes, incidents, actions d’incident, snapshots de risque, rapports et journaux d’audit.

```text
User ──< AuditLog
  │
  ├──< Alert >── Asset
  └──< Incident >── Asset
             │
             └──< IncidentAction

RiskSnapshot ──> Dashboard / rapports de posture
Report ──> Synthèses de posture générées
```

## Sécurité et traçabilité

AI-NETSEC applique plusieurs garde-fous : validation des entrées avec Zod, procédures tRPC protégées, rôle administrateur pour les opérations de gouvernance, journalisation des actions sensibles et notification du propriétaire lors de la création d’une alerte critique ou d’un incident de sévérité haute/critique.

L’assistant IA est un **outil d’aide à l’analyse**, non un moteur de décision autonome. Il reçoit uniquement le contexte SOC disponible, distingue les faits des hypothèses et ne prétend pas confirmer une compromission ou réaliser une action sur l’infrastructure.

## Limites actuelles

Cette version ne réalise pas de scan réseau actif, de capture réseau, d’ingestion de journaux externes, de connexion directe à un SIEM/IDS ni d’entraînement de modèles de détection. Les données démonstratives sont identifiées dans l’interface et ne doivent pas être interprétées comme des données de production.

## Déploiement

L’application nécessite un environnement **full-stack Node.js** avec accès à la base de données et aux variables d’environnement citées ci-dessus. Une publication sur GitHub Pages n’est donc pas adaptée, car ce service ne peut pas exécuter le backend Express, tRPC, OAuth et les accès base de données.

Le projet est actuellement compatible avec son hébergement managé, qui publie les versions validées et fournit une URL HTTPS. Pour utiliser un domaine personnalisé, rattachez un domaine déjà enregistré dans les paramètres de domaine de l’hébergement, puis appliquez les enregistrements DNS fournis.

## Structure du projet

```text
client/                 # Application React et composants UI
  src/pages/            # Dashboard et vues métier SOC
  src/components/       # Shell, indicateurs, tableaux et composants réutilisables
server/                 # Serveur Express, procédures tRPC et règles métier
  routers/              # Domaines SOC et assistant IA
  _core/                # Infrastructure d’authentification et services intégrés
drizzle/                # Schéma relationnel et migrations
shared/                 # Types et constantes partagés
docs/                   # Exigences, architecture, sécurité et validation
```

## Documentation complémentaire

Les documents de conception et de validation sont disponibles dans [`docs/`](./docs), notamment les exigences produit, l’architecture, le schéma de données, la conception de sécurité et la matrice de validation.

## Licence

Ce projet est distribué sous licence **MIT**. Consultez `package.json` pour la déclaration de licence du projet.
