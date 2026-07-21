#!/usr/bin/env node

/**
 * Script pour afficher le schéma complet des 8 tables e-commerce
 */

require('dotenv').config();
const { sequelize } = require('../config/sequelize');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

async function showCompleteSchema() {
  try {
    log(colors.cyan, '🏗️  SCHÉMA COMPLET E-COMMERCE - 8 TABLES');
    log(colors.cyan, '='.repeat(60));

    await sequelize.authenticate();

    // Liste des 8 tables dans l'ordre logique
    const tables = [
      'users', 
      'categories', 
      'products', 
      'reviews', 
      'carts', 
      'cart_items', 
      'orders', 
      'user_events'
    ];

    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i];
      log(colors.magenta, `\n${i + 1}. TABLE: ${tableName.toUpperCase()}`);
      log(colors.magenta, '='.repeat(50));

      await describeTableColumns(tableName);
    }

    // Résumé des relations
    await showRelationsSummary();

  } catch (error) {
    log(colors.red, `❌ Erreur: ${error.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function describeTableColumns(tableName) {
  const [columns] = await sequelize.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      udt_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `);

  log(colors.yellow, '📋 COLONNES:');
  columns.forEach(col => {
    let typeInfo = col.data_type;
    
    // Type spécifique
    if (col.udt_name === '_text') {
      typeInfo = 'TEXT[]';
    } else if (col.udt_name === '_varchar') {
      typeInfo = 'STRING[]';
    } else if (col.character_maximum_length) {
      typeInfo += `(${col.character_maximum_length})`;
    } else if (col.numeric_precision) {
      typeInfo += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
    }
    
    const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    
    log(colors.green, `   ✓ ${col.column_name.padEnd(20)} | ${typeInfo}${nullable}${defaultVal}`);
  });

  // Compter les enregistrements
  try {
    const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    log(colors.cyan, `\n📊 DONNÉES: ${countResult[0].count} enregistrements`);
  } catch (error) {
    log(colors.red, `📊 DONNÉES: Erreur - ${error.message}`);
  }
}

async function showRelationsSummary() {
  log(colors.magenta, '\n🔗 RÉSUMÉ DES RELATIONS');
  log(colors.magenta, '='.repeat(50));

  const relations = [
    'users (1) ←→ (1) carts',
    'users (1) ←→ (N) reviews',
    'users (1) ←→ (N) orders', 
    'users (1) ←→ (N) user_events',
    'categories (1) ←→ (N) products',
    'products (1) ←→ (N) reviews',
    'products (1) ←→ (N) cart_items',
    'products (1) ←→ (N) user_events',
    'carts (1) ←→ (N) cart_items',
  ];

  relations.forEach(rel => {
    log(colors.cyan, `   📎 ${rel}`);
  });

  log(colors.yellow, '\n🔒 CONTRAINTES IMPORTANTES:');
  log(colors.green, '   ✓ users.email: UNIQUE');
  log(colors.green, '   ✓ carts.user_id: UNIQUE (1:1 avec users)');
  log(colors.green, '   ✓ cart_items: UNIQUE(cart_id, product_id)');
  log(colors.green, '   ✓ reviews.rating: 1-5 seulement');
  log(colors.green, '   ✓ cart_items.quantity: > 0');
  log(colors.green, '   ✓ CASCADE DELETE: cart → cart_items');

  log(colors.yellow, '\n📋 ENUMS:');
  log(colors.green, '   ✓ users.role: client | admin');
  log(colors.green, '   ✓ orders.status: pending | confirmed | processing | shipped | delivered | cancelled');
}

showCompleteSchema();