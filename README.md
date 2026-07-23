<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" height="50" alt="Node.js"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" height="50" alt="Express"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" height="50" alt="PostgreSQL"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" height="50" alt="Prisma"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sequelize/sequelize-original.svg" height="50" alt="Sequelize"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" height="50" alt="GitHub"/>
</p>


<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=28&pause=1000&color=00C2FF&center=true&vCenter=true&width=1000&lines=E-commerce+Platform;AI-Powered+Intelligent+Platform;Created+by+the+Interns+of+3LM+Solutions" alt="Typing SVG" />
</div>

# 🛒 E-commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5+-purple.svg)](https://prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Une plateforme e-commerce moderne et scalable construite avec Node.js, PostgreSQL et Prisma.

## 📋 Table des Matières

- [🎯 Vue d'ensemble](#-vue-densemble)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🚀 Installation](#-installation)
- [📊 Base de Données](#-base-de-données)
- [🔧 Configuration](#-configuration)
- [📚 API Documentation](#-api-documentation)
- [🧪 Tests](#-tests)
- [👥 Contribution](#-contribution)

## 🎯 Vue d'ensemble

Cette plateforme e-commerce offre une solution complète pour la gestion d'une boutique en ligne, incluant la gestion des utilisateurs, du catalogue produits, du panier d'achat, et du processus de commande.

### 🎨 Fonctionnalités Principales

- **👤 Gestion Utilisateurs** - Authentification JWT, rôles (client/admin)
- **📦 Catalogue Produits** - Gestion complète avec catégories, images, tags
- **🛒 Panier d'Achat** - Panier persistant avec gestion temps réel
- **📝 Système d'Avis** - Reviews et ratings des produits
- **🚚 Gestion Commandes** - Workflow complet avec statuts
- **📊 Analytics** - Tracking événements utilisateurs

## 🏗️ Architecture

### Stack Technique

- **Backend:** Node.js + Express.js
- **Base de Données:** PostgreSQL (Neon Cloud)
- **ORM:** Prisma + Sequelize
- **Authentification:** JWT (JSON Web Tokens)
- **Validation:** Joi/Yup
- **Documentation:** Swagger/OpenAPI

### Structure du Projet

```
E-commerce/
├── 📁 config/                 # Configuration DB
├── 📁 migrations/             # Migrations Sequelize
├── 📁 models/                 # Modèles Sequelize
├── 📁 prisma/                 # Schema Prisma
├── 📁 scripts/                # Scripts utilitaires
├── 📁 seeders/                # Données de test
├── 📁 src/
│   ├── 📁 controllers/        # Contrôleurs API
│   ├── 📁 middleware/         # Middlewares (auth, validation)
│   ├── 📁 routes/             # Définition des routes
│   └── 📁 services/           # Logique métier
├── 📄 package.json
├── 📄 README.md
└── 📄 .env.example
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- PostgreSQL 15+
- Git

### Étapes d'Installation

1. **Clone du repository**
```bash
git clone https://github.com/Ayoub-glitsh/E-commerce.git
cd E-commerce
```

2. **Installation des dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

4. **Configuration de la base de données**
```bash
# Test de connexion
npm run db:test

# Exécution des migrations
npm run db:migrate

# Population avec des données de test
npm run db:seed
```

5. **Démarrage du serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Base de Données

### Schéma E-commerce (8 Tables)

| Table | Description | Clés |
|-------|-------------|------|
| `users` | Utilisateurs et administrateurs | UUID, email unique |
| `categories` | Catégories de produits | UUID, nom |
| `products` | Catalogue produits complet | UUID, prix, stock, rating |
| `reviews` | Avis clients sur produits | UUID, rating 1-5 |
| `carts` | Paniers utilisateurs | UUID, user_id unique |
| `cart_items` | Articles dans les paniers | UUID, contrainte unique |
| `orders` | Commandes avec statuts | UUID, données JSON |
| `user_events` | Événements tracking | UUID, type événement |

### Relations Clés

- **User → Cart** (1:1) - Un utilisateur a un panier unique
- **Cart → CartItems** (1:N) - Un panier contient plusieurs articles  
- **Product → Reviews** (1:N) - Un produit a plusieurs avis
- **User → Orders** (1:N) - Un utilisateur a plusieurs commandes
- **Category → Products** (1:N) - Une catégorie contient plusieurs produits

### Scripts Disponibles

```bash
# Base de données
npm run db:test          # Test connexion
npm run db:migrate       # Exécuter migrations
npm run db:seed          # Peupler données test
npm run db:reset         # Reset complet
npm run show:schema      # Afficher structure

# Développement
npm run dev              # Mode développement
npm run build            # Build production
npm start                # Démarrage production

# Tests
npm run test             # Tests unitaires
npm run test:coverage    # Couverture de tests
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` basé sur `.env.example` :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=your_user
DB_PASS=your_password

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=24h

# Application
NODE_ENV=development
PORT=3000
```

### Configuration Neon PostgreSQL

Pour utiliser Neon (cloud PostgreSQL) :

1. Créez un compte sur [Neon](https://neon.tech)
2. Créez une base de données
3. Copiez la connection string dans `DATABASE_URL`
4. Ajoutez `?sslmode=require` à la fin de l'URL

## 📚 API Documentation

### Endpoints Principaux

#### 🔐 Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Refresh token

#### 🛒 Panier
- `GET /api/cart` - Récupérer panier utilisateur
- `POST /api/cart/items` - Ajouter article
- `PUT /api/cart/items/:id` - Modifier quantité
- `DELETE /api/cart/items/:id` - Supprimer article
- `DELETE /api/cart` - Vider panier

#### 📦 Produits
- `GET /api/products` - Liste produits
- `GET /api/products/:id` - Détails produit
- `POST /api/products` - Créer produit (admin)
- `PUT /api/products/:id` - Modifier produit (admin)

#### 🚚 Commandes
- `GET /api/orders` - Commandes utilisateur
- `POST /api/orders` - Créer commande
- `GET /api/orders/:id` - Détails commande

### Format des Réponses

```json
{
  "success": true,
  "data": {
    // Données de réponse
  },
  "message": "Operation successful",
  "timestamp": "2024-07-21T10:00:00Z"
}
```

## 🧪 Tests

### Exécution des Tests

```bash
# Tests complets
npm run test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests d'une catégorie spécifique
npm run test:unit        # Tests unitaires
npm run test:integration # Tests d'intégration
npm run test:e2e        # Tests end-to-end
```

### Structure des Tests

```
tests/
├── 📁 unit/              # Tests unitaires
├── 📁 integration/       # Tests d'intégration  
├── 📁 e2e/              # Tests end-to-end
├── 📁 fixtures/         # Données de test
└── 📁 helpers/          # Utilitaires de test
```

## 🚀 Déploiement

### Production Ready

Le projet est configuré pour un déploiement en production avec :

- **Docker** support (Dockerfile inclus)
- **CI/CD** GitHub Actions workflows
- **Environment** variables validation
- **Security** headers et CORS
- **Logging** structuré
- **Health checks** endpoints

### Déploiement Docker

```bash
# Build de l'image
docker build -t ecommerce-api .

# Démarrage avec docker-compose
docker-compose up -d
```

## 👥 Contribution

### Comment Contribuer

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### Standards de Code

- **ESLint** configuration stricte
- **Prettier** pour le formatting
- **Conventional Commits** pour les messages
- **Tests** obligatoires pour nouvelles features
- **Documentation** à jour

## 📄 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs et Contributeurs

<table>
<tr>
<td align="center">
<a href="https://github.com/Ayoub-glitsh">
<img src="https://github.com/Ayoub-glitsh.png" width="100px;" alt="Ayoub Aguezar"/><br />
<sub><b>Ayoub Aguezar</b></sub><br />
<sub>Lead Developer</sub>
</a>
</td>
  
<td align="center">
<a href="https://github.com/oumayma728">
<img src="https://github.com/oumayma728.png" width="100px;" alt="Oumayma"/><br />
<sub><b>Oumayma</b></sub><br />
<sub>Scrum Master</sub>
</a>
</td> 

<td align="center">
<a href="https://github.com/Elmahdi45">
<img src="https://github.com/Elmahdi45.png" width="100px;" alt="Elmahdi45"/><br />
<sub><b>Oumayma</b></sub><br />
<sub>Scrum Master</sub>
</a>
</td>

<td align="center">
<a href="https://github.com/AITHMAID-AYOUB">
<img src="https://github.com/AITHMAID-AYOUB.png" width="100px;" alt="Elmahdi45"/><br />
<sub><b>Oumayma</b></sub><br />
<sub>Scrum Master</sub>
</a>
</td>



<!-- Ajoutez les autres développeurs ici -->
</tr>
</table>

### 📧 Contact
- **Ayoub Aguezar**: ayoubaguezzar1@gmail.com

## 🙏 Remerciements

- [Prisma](https://prisma.io) pour l'excellent ORM
- [Neon](https://neon.tech) pour l'hébergement PostgreSQL
- [Express.js](https://expressjs.com) pour le framework web
- La communauté open-source pour les outils formidables

---

⭐ **N'hésitez pas à donner une étoile si ce projet vous aide !**
