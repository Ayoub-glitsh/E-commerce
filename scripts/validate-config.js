#!/usr/bin/env node

/**
 * Script de validation de la configuration DB
 * Valide la structure et les fichiers sans se connecter à la DB
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${color}${message}${colors.reset}`);

function validateConfiguration() {
  log(colors.cyan, '🔧 Validation de la configuration base de données...\n');

  const checks = [];

  // 1. Vérifier les fichiers de configuration
  log(colors.blue, '📂 Vérification des fichiers:');
  
  const requiredFiles = [
    'config/database.js',
    'config/sequelize.js',
    'models/index.js',
    '.sequelizerc',
    'package.json'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    log(exists ? colors.green : colors.red, `   ${exists ? '✅' : '❌'} ${file}`);
    checks.push({ name: file, success: exists });
  });

  // 2. Vérifier les dossiers
  log(colors.blue, '\n📁 Vérification des dossiers:');
  
  const requiredDirs = [
    'config',
    'models', 
    'migrations',
    'seeders',
    'scripts'
  ];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const exists = fs.existsSync(dirPath);
    log(exists ? colors.green : colors.red, `   ${exists ? '✅' : '❌'} ${dir}/`);
    checks.push({ name: `${dir}/`, success: exists });
  });

  // 3. Vérifier les variables d'environnement
  log(colors.blue, '\n🔧 Variables d\'environnement:');
  
  const envVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_NAME',
    'DB_USERNAME',
    'DB_PASSWORD'
  ];

  envVars.forEach(envVar => {
    const value = process.env[envVar];
    const exists = !!value;
    log(exists ? colors.green : colors.yellow, `   ${exists ? '✅' : '⚠️'} ${envVar}: ${exists ? (envVar.includes('PASSWORD') ? '***définie***' : value) : 'Non définie'}`);
    checks.push({ name: envVar, success: exists });
  });

  // 4. Vérifier les packages npm
  log(colors.blue, '\n📦 Dépendances npm:');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'sequelize',
      'pg',
      '@prisma/client'
    ];
    
    const requiredDevDeps = [
      'sequelize-cli',
      'prisma',
      'nodemon'
    ];

    requiredDeps.forEach(dep => {
      const exists = packageJson.dependencies && packageJson.dependencies[dep];
      log(exists ? colors.green : colors.red, `   ${exists ? '✅' : '❌'} ${dep}${exists ? ` (${exists})` : ''}`);
      checks.push({ name: `dep:${dep}`, success: !!exists });
    });

    requiredDevDeps.forEach(dep => {
      const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
      log(exists ? colors.green : colors.red, `   ${exists ? '✅' : '❌'} ${dep} (dev)${exists ? ` (${exists})` : ''}`);
      checks.push({ name: `devDep:${dep}`, success: !!exists });
    });

  } catch (error) {
    log(colors.red, '   ❌ Erreur lecture package.json');
    checks.push({ name: 'package.json', success: false });
  }

  // 5. Vérifier les scripts npm
  log(colors.blue, '\n⚙️ Scripts npm:');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = [
      'db:migrate',
      'db:seed', 
      'db:create',
      'db:test-connection'
    ];

    requiredScripts.forEach(script => {
      const exists = packageJson.scripts && packageJson.scripts[script];
      log(exists ? colors.green : colors.red, `   ${exists ? '✅' : '❌'} npm run ${script}`);
      checks.push({ name: `script:${script}`, success: !!exists });
    });

  } catch (error) {
    log(colors.red, '   ❌ Erreur lecture scripts package.json');
  }

  // 6. Résumé
  console.log('');
  const totalChecks = checks.length;
  const successfulChecks = checks.filter(c => c.success).length;
  const successRate = Math.round((successfulChecks / totalChecks) * 100);

  log(colors.cyan, '📊 Résumé de validation:');
  log(colors.blue, `   Total des vérifications: ${totalChecks}`);
  log(colors.green, `   Réussies: ${successfulChecks}`);
  log(successfulChecks === totalChecks ? colors.green : colors.yellow, `   Taux de réussite: ${successRate}%`);

  console.log('');

  if (successRate >= 90) {
    log(colors.green, '🎉 Configuration excellente ! Prêt pour la base de données.');
    log(colors.cyan, '\n📋 Prochaines étapes:');
    log(colors.cyan, '   1. Démarrer PostgreSQL');
    log(colors.cyan, '   2. npm run db:test-connection');
    log(colors.cyan, '   3. npm run db:create');
    log(colors.cyan, '   4. npm run db:migrate');
    return true;
  } else if (successRate >= 75) {
    log(colors.yellow, '⚠️ Configuration majoritairement OK, quelques ajustements nécessaires.');
    return false;
  } else {
    log(colors.red, '❌ Configuration incomplète, plusieurs éléments manquants.');
    return false;
  }
}

// Lancer la validation
const success = validateConfiguration();
process.exit(success ? 0 : 1);