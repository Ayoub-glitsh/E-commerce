#!/usr/bin/env node

/**
 * Script pour décrire complètement la structure de la base de données
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

async function describeDatabase() {
  try {
    log(colors.cyan, '🗃️  STRUCTURE COMPLÈTE DE LA BASE DE DONNÉES\n');

    await sequelize.authenticate();
    
    // 1. Lister toutes les tables
    const [tables] = await sequelize.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    log(colors.blue, '📋 TABLES DISPONIBLES:');
    tables.forEach(table => {
      log(colors.green, `   ✅ ${table.table_name} (${table.table_type})`);
    });

    console.log('');

    // 2. Décrire chaque table en détail
    for (const table of tables) {
      if (table.table_type === 'BASE TABLE') {
        await describeTable(table.table_name);
      }
    }

    // 3. Lister les relations/contraintes
    await describeRelations();

  } catch (error) {
    log(colors.red, `❌ Erreur: ${error.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function describeTable(tableName) {
  log(colors.magenta, `\n📊 TABLE: ${tableName}`);
  log(colors.magenta, '='.repeat(50));

  // Colonnes de la table
  const [columns] = await sequelize.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
    ORDER BY ordinal_position;
  `);

  log(colors.yellow, '\n🔧 COLONNES:');
  columns.forEach(col => {
    let typeInfo = col.data_type;
    if (col.character_maximum_length) {
      typeInfo += `(${col.character_maximum_length})`;
    } else if (col.numeric_precision) {
      typeInfo += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
    }
    
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    
    log(colors.cyan, `   📌 ${col.column_name}`);
    log(colors.white, `      Type: ${typeInfo} | ${nullable}${defaultVal}`);
  });

  // Contraintes (clés primaires, étrangères, etc.)
  const [constraints] = await sequelize.query(`
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = '${tableName}'
    ORDER BY tc.constraint_type, tc.constraint_name;
  `);

  if (constraints.length > 0) {
    log(colors.yellow, '\n🔗 CONTRAINTES:');
    constraints.forEach(constraint => {
      let description = `${constraint.constraint_type}: ${constraint.column_name}`;
      if (constraint.foreign_table_name) {
        description += ` → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`;
      }
      log(colors.cyan, `   🔒 ${description}`);
    });
  }

  // Compter les enregistrements
  try {
    const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    log(colors.yellow, `\n📊 DONNÉES: ${countResult[0].count} enregistrements`);
  } catch (error) {
    log(colors.red, `\n📊 DONNÉES: Erreur lecture - ${error.message}`);
  }
}

async function describeRelations() {
  log(colors.magenta, '\n🔗 RELATIONS ENTRE TABLES');
  log(colors.magenta, '='.repeat(50));

  const [relations] = await sequelize.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);

  if (relations.length === 0) {
    log(colors.yellow, '   ⚠️ Aucune relation définie');
  } else {
    relations.forEach(rel => {
      log(colors.green, `   📎 ${rel.table_name}.${rel.column_name}`);
      log(colors.cyan, `      ↳ RÉFÉRENCE ${rel.foreign_table_name}.${rel.foreign_column_name}`);
      log(colors.yellow, `      ↳ ON DELETE: ${rel.delete_rule} | ON UPDATE: ${rel.update_rule}`);
      console.log('');
    });
  }
}

describeDatabase();