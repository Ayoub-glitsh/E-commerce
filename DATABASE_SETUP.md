# Configuration Base de Données & ORM

Ce document décrit les étapes pour configurer la base de données PostgreSQL avec Sequelize et Prisma.

## 📋 Prérequis

- Node.js (>= 16.x)
- PostgreSQL (>= 12.x) installé et en cours d'exécution
- npm ou yarn

## 🚀 Installation & Configuration

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Copier le fichier d'exemple et configurer selon votre environnement :

```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos paramètres PostgreSQL :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_dev
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 3. Création de la base de données

```bash
# Créer la base de données via Sequelize CLI
npm run db:create

# Ou créer manuellement en PostgreSQL :
# createdb ecommerce_dev
```

### 4. Test de connexion

Vérifier que les connexions Sequelize et Prisma fonctionnent :

```bash
npm run db:test-connection
```

Sortie attendue :
```
🔍 Test des connexions à la base de données...

📦 Test de connexion Sequelize:
✅ Connexion Sequelize réussie à la base de données ecommerce_dev (development)
   Database: ecommerce_dev
   Host: localhost:5432
   Dialect: postgres
   Environment: development

🔷 Test de connexion Prisma:
   ✅ Connexion Prisma réussie
   PostgreSQL Version: 14.9

📊 Résumé des tests:
   Sequelize: ✅ OK
   Prisma: ✅ OK

🏁 Test RÉUSSI
```

## 🗂️ Structure des dossiers

```
E-commerce/
├── config/
│   ├── database.js          # Configuration Sequelize (dev/test/prod)
│   └── sequelize.js         # Instance Sequelize + test connexion
├── models/
│   └── index.js             # Index Sequelize pour chargement automatique des modèles
├── migrations/              # Migrations Sequelize (versionning DB)
├── seeders/                 # Seeds Sequelize (données initiales)
├── scripts/
│   └── test-db-connection.js # Script de test des connexions
├── prisma/
│   └── schema.prisma        # Schéma Prisma (existant)
├── .sequelizerc             # Configuration des chemins Sequelize
└── DATABASE_SETUP.md        # Cette documentation
```

## ⚙️ Scripts NPM disponibles

### Scripts Sequelize
```bash
npm run db:create              # Créer la base de données
npm run db:drop                # Supprimer la base de données
npm run db:migrate             # Exécuter les migrations
npm run db:migrate:undo        # Annuler la dernière migration
npm run db:migrate:undo:all    # Annuler toutes les migrations
npm run db:seed                # Exécuter tous les seeders
npm run db:seed:undo           # Annuler tous les seeders
npm run db:reset               # Réinitialiser complètement la DB

npm run migration:generate --name create-users  # Générer une migration
npm run seed:generate --name demo-users         # Générer un seeder
```

### Scripts Prisma
```bash
npm run prisma:migrate         # Exécuter les migrations Prisma
npm run prisma:generate        # Générer le client Prisma
npm run prisma:seed            # Exécuter les seeds Prisma
npm run prisma:studio          # Ouvrir Prisma Studio (GUI)
```

### Scripts généraux
```bash
npm run db:test-connection     # Tester les connexions DB
npm start                      # Lancer l'application (production)
npm run dev                    # Lancer l'application (développement)
```

## 📝 Utilisation

### Sequelize

1. **Créer un modèle** :
   ```bash
   npx sequelize-cli model:generate --name User --attributes firstName:string,email:string
   ```

2. **Créer une migration** :
   ```bash
   npm run migration:generate -- --name add-role-to-users
   ```

3. **Exécuter les migrations** :
   ```bash
   npm run db:migrate
   ```

### Prisma

1. **Modifier le schéma** dans `prisma/schema.prisma`

2. **Créer une migration** :
   ```bash
   npm run prisma:migrate
   ```

3. **Générer le client** :
   ```bash
   npm run prisma:generate
   ```

## 🔧 Configuration des environnements

Le fichier `config/database.js` supporte 3 environnements :

- **development** : Logs SQL activés, pool de connexions réduit
- **test** : Logs désactivés, base de données séparée
- **production** : Logs désactivés, pool optimisé, SSL optionnel

Variables d'environnement par environnement :
```bash
# Développement
NODE_ENV=development
DB_NAME=ecommerce_dev

# Test
NODE_ENV=test
DB_NAME=ecommerce_test

# Production
NODE_ENV=production
DB_NAME=ecommerce_prod
DB_SSL=true
```

## 🚨 Troubleshooting

### Erreur de connexion
```bash
# Vérifier que PostgreSQL est démarré
sudo systemctl status postgresql

# Vérifier les paramètres de connexion
npm run db:test-connection
```

### Permission denied
```bash
# Créer un utilisateur PostgreSQL si nécessaire
sudo -u postgres createuser --interactive your_username
```

### Base de données n'existe pas
```bash
# Créer la base de données
npm run db:create
# ou manuellement :
sudo -u postgres createdb ecommerce_dev
```

## 📚 Documentation

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎯 Prochaines étapes

1. Créer les modèles Sequelize pour User, Product, Cart, etc.
2. Écrire les migrations correspondantes
3. Créer des seeders pour les données de test
4. Choisir entre Sequelize et Prisma pour le développement principal
5. Configurer les tests avec la base de test