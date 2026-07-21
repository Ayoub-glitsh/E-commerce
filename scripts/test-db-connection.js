#!/usr/bin/env node

/**
 * Script de test de connexion à la base de données
 * Teste Sequelize uniquement pour éviter les problèmes Prisma
 */

require('dotenv').config();
const { sequelize, testConnection } = require('../config/sequelize');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function testDatabaseConnections() {
  log(colors.cyan, '🔍 Test de la connexion Sequelize à la base de données...\n');

  let sequelizeSuccess = false;

  // Test Sequelize
  log(colors.blue, '📦 Test de connexion Sequelize:');
  try {
    sequelizeSuccess = await testConnection();
    
    // Afficher les infos de config
    const config = sequelize.config;
    log(colors.green, `   Database: ${config.database}`);
    log(colors.green, `   Host: ${config.host}:${config.port}`);
    log(colors.green, `   Dialect: ${config.dialect}`);
    log(colors.green, `   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test d'une requête simple
    const [results] = await sequelize.query('SELECT version()');
    log(colors.green, `   PostgreSQL Version: ${results[0].version.split(' ')[1]}`);
    
  } catch (error) {
    log(colors.red, `   ❌ Erreur Sequelize: ${error.message}`);
    
    // Détails de l'erreur pour debug
    if (error.name === 'SequelizeConnectionError') {
      log(colors.yellow, '   💡 Suggestions:');
      log(colors.yellow, '      - Vérifiez que PostgreSQL est démarré');
      log(colors.yellow, '      - Vérifiez les paramètres de connexion dans .env');
      log(colors.yellow, '      - Créez la base de données: npm run db:create');
    }
  }

  console.log('');

  // Variables d'environnement
  log(colors.cyan, '🔧 Variables d\'environnement:');
  log(colors.yellow, `   DB_HOST: ${process.env.DB_HOST || 'Non définie (défaut: localhost)'}`);
  log(colors.yellow, `   DB_PORT: ${process.env.DB_PORT || 'Non définie (défaut: 5432)'}`);
  log(colors.yellow, `   DB_NAME: ${process.env.DB_NAME || 'Non définie (défaut: ecommerce_dev)'}`);
  log(colors.yellow, `   DB_USERNAME: ${process.env.DB_USERNAME || 'Non définie (défaut: postgres)'}`);
  log(colors.yellow, `   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***définie***' : 'Non définie'}`);

  // Nettoyage
  await sequelize.close();

  // Code de sortie
  console.log('');
  log(sequelizeSuccess ? colors.green : colors.red, `🏁 Test ${sequelizeSuccess ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
  
  if (sequelizeSuccess) {
    log(colors.green, '\n🎉 Configuration de la base de données opérationnelle !');
    log(colors.cyan, '\n📋 Prochaines étapes:');
    log(colors.cyan, '   1. npm run db:create (si la DB n\'existe pas)');
    log(colors.cyan, '   2. npm run db:migrate (exécuter les migrations)');
    log(colors.cyan, '   3. npm run db:seed (charger les données de test)');
  }
  
  process.exit(sequelizeSuccess ? 0 : 1);
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  log(colors.red, `❌ Erreur non gérée: ${error.message}`);
  process.exit(1);
});

// Lancer le test
testDatabaseConnections();