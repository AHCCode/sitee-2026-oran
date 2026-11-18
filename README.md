# AFRIMÉTIERS HUB

Plateforme web full-stack bilingue (**Français / English**) dédiée à la découverte d'artisans et professionnels des métiers à travers l'Afrique, à la recherche multicritère (métier, pays, ville, mot-clé), à l'envoi de demandes de devis et à l'administration complète via un back-office sécurisé.

---

## Stack technique & architecture

- **Framework Full-Stack :** Next.js 15 (App Router) + React 19 + TypeScript strict
- **Styles & Responsive Design :** Tailwind CSS (testé sur **360px mobile**, **768px tablette**, **1280px desktop**)
- **Base de données & ORM :** SQLite (zéro configuration locale, portable vers PostgreSQL) avec **Prisma ORM** (requêtes préparées/paramétrées contre les injections SQL)
- **Validation :** Schémas **Zod** partagés entre le front-end et l'API REST (`422 Unprocessable Entity` avec erreurs détaillées par champ)
- **Authentification :** Sessions serveur stockées en base (jeton aléatoire 256 bits dans un cookie `HttpOnly` + condensat SHA-256 en base) et mots de passe hachés avec **bcrypt** (facteur de coût 12, comparaison à temps constant)
- **Internationalisation (FR / EN) :** Dictionnaires complets (`src/lib/i18n/fr.ts`, `src/lib/i18n/en.ts`) et sélecteur de langue instantané dans l'en-tête public et le back-office

---

## Démarrage rapide en local

### 1. Prérequis
- **Node.js** `>= 20` et **npm**

### 2. Installation & initialisation de la base de données
```bash
npm install
npm run setup
```
> `npm run setup` exécute `prisma migrate deploy` puis `prisma db seed` pour créer et peupler la base SQLite (`prisma/dev.db`) avec :
> - **12 métiers (catégories)** bilingues FR/EN
> - **10 pays africains** et **40 villes** liées
> - **28 artisans** réalistes (24 `PUBLISHED` dont 6 `à la une`, 2 `DRAFT`, 2 `ARCHIVED`) avec galeries photos locales et listes de services
> - **18 demandes de devis** (`DEV-2026-0001` à `DEV-2026-0018`) réparties sur les 10 derniers mois avec historiques complets

### 3. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000).

### 4. Build de production & suite de tests automatisés
```bash
npm run typecheck
npm run build
npm start
# Dans un autre terminal :
npm run test:api
```

---

## Comptes de démonstration

| Rôle | Identifiant (e-mail ou username) | Mot de passe | Comportement sur `/api/admin/*` |
| --- | --- | --- | --- |
| **ADMIN** | `admin@afrimetiers.com` ou `admin` | `Admin@2026!` | Accès complet au back-office (`200 OK`) |
| **VIEWER** | `viewer@afrimetiers.com` ou `viewer` | `Viewer@2026!` | Authentifié sans droits admin (`403 Forbidden`) |

---

## Référence des endpoints REST (`/api/...`)

Toutes les routes retournent un JSON structuré uniforme :
- Succès : `{ "data": ..., "meta"?: ... }`
- Erreur : `{ "error": { "code": "...", "message": "...", "fields"?: { ... } } }`

### API Publique
| Méthode & Route | Description |
| --- | --- |
| `GET /api/categories` | Liste des métiers avec le nombre d'artisans **publiés** (`artisanCount`) |
| `GET /api/countries` | Liste des pays couverts |
| `GET /api/countries/:id/cities` | Liste dynamique des villes rattachées au pays `:id` (`404` si pays inconnu) |
| `GET /api/artisans` | Recherche paginée avec filtres combinables : `q`, `category`, `country`, `city`, `sort` (`relevance`, `recent`, `name`, `experience`), `featured`, `page`, `pageSize` |
| `GET /api/artisans/:id` | Profil complet d'un artisan publié, galerie photos, services et artisans similaires |
| `POST /api/quotes` | Création d'une demande de devis. Retourne `201 Created` avec la référence unique `DEV-2026-XXXX` ou `422 Unprocessable Entity` avec `error.fields` |

### API Authentification & Administration
| Méthode & Route | Description |
| --- | --- |
| `POST /api/auth/login` | Connexion par e-mail ou nom d'utilisateur + mot de passe. Cookie `HttpOnly` + message générique en cas d'échec (`401`) |
| `POST /api/auth/logout` | Suppression effective de la session en base et effacement du cookie |
| `GET /api/auth/me` | Utilisateur courant (`401` si non connecté) |
| `GET /api/admin/stats` | KPIs du tableau de bord, série mensuelle (12 mois), répartition par pays, dernières demandes |
| `GET / POST /api/admin/artisans` | Liste filtrable/paginée (tous statuts) et création d'un artisan avec validation serveur |
| `GET / PUT / PATCH / DELETE /api/admin/artisans/:id` | Lecture, mise à jour complète, publication/dépublication rapide et suppression |
| `POST /api/admin/uploads` | Téléversement sécurisé de photos (vérification des magic bytes JPEG/PNG/WebP/GIF, max 5 Mo) |
| `GET /api/admin/quotes` | Liste filtrable par statut, recherche texte et pagination + compteurs par statut |
| `GET / PATCH /api/admin/quotes/:id` | Détail d'une demande, changement de statut, notes internes, bascule « Transmise à l'artisan » et journal d'historique |
