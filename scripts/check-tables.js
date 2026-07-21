#!/usr/bin/env node

/**
 * Script pour vérifier les tables créées dans Neon DB
 */

require('dotenv').config();
const { sequelize } = require('../config/sequelize');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function checkTables() {
  try {
    log(colors.cyan, '🔍 Vérification des tables dans Neon DB...\n');

    // Se connecter à la DB
    await sequelize.authenticate();
    
    // Lister les tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    log(colors.blue, '📊 Tables présentes:');
    if (results.length === 0) {
      log(colors.yellow, '   ⚠️ Aucune table trouvée');
    } else {
      results.forEach(row => {
        log(colors.green, `   ✅ ${row.table_name}`);
      });
    }

    // Vérifier les tables spécifiques du projet
    console.log('');
    log(colors.blue, '🎯 Tables du projet (Prisma):');
    
    const expectedTables = ['User', 'Cart', 'CartItem'];
    
    for (const tableName of expectedTables) {
      const found = results.some(row => row.table_name.toLowerCase() === tableName.toLowerCase());
      log(found ? colors.green : colors.yellow, `   ${found ? '✅' : '⚠️'} ${tableName}`);
      
      if (found) {
        // Compter les enregistrements
        try {
          const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          log(colors.cyan, `      → ${countResult[0].count} enregistrements`);
        } catch (error) {
          log(colors.yellow, `      → Erreur lecture: ${error.message}`);
        }
      }
    }

    console.log('');
    log(colors.green, '🎉 Base de données Neon DB configurée avec succès !');
    log(colors.cyan, '\n📋 Informations de connexion:');
    log(colors.cyan, `   Host: ${process.env.DB_HOST}`);
    log(colors.cyan, `   Database: ${process.env.DB_NAME}`);
    log(colors.cyan, `   SSL: ${process.env.DB_SSL === 'true' ? 'Activé' : 'Désactivé'}`);

  } catch (error) {
    log(colors.red, `❌ Erreur: ${error.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkTables();