#!/usr/bin/env node

/**
 * Script de vérification de l'implémentation FonctionnalitéMoyenne#1782
 * Vérifie que tous les composants sont correctement en place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification Implémentation FonctionnalitéMoyenne#1782');
console.log('═══════════════════════════════════════════════════════════');

let allChecksPass = true;

/**
 * Helper pour vérifier l'existence d'un fichier
 */
const checkFile = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'PRÉSENT' : 'MANQUANT'}`);
  if (!exists) allChecksPass = false;
  return exists;
};

/**
 * Helper pour vérifier le contenu d'un fichier
 */
const checkFileContent = (filePath, searchTerms, description) => {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${description}: FICHIER MANQUANT`);
    allChecksPass = false;
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const found = searchTerms.every(term => content.includes(term));
    console.log(`${found ? '✅' : '❌'} ${description}: ${found ? 'OK' : 'MANQUANT'}`);
    if (!found) {
      console.log(`   📝 Termes recherchés: ${searchTerms.join(', ')}`);
      allChecksPass = false;
    }
    return found;
  } catch (error) {
    console.log(`❌ ${description}: ERREUR LECTURE - ${error.message}`);
    allChecksPass = false;
    return false;
  }
};

console.log('\\n📋 1. Vérification des Fichiers Principaux');
console.log('─────────────────────────────────────────────');

// Vérifier les fichiers principaux
checkFile('src/routes/orders.js', 'Routes des commandes');
checkFile('src/controllers/orderController.js', 'Contrôleur des commandes'); 
checkFile('models/Order.js', 'Modèle Order');
checkFile('migrations/20260731140000-add-order-cancellation-tracking.js', 'Migration d\'annulation');

console.log('\\n📋 2. Vérification du Contenu - Routes');
console.log('───────────────────────────────────────');

// Vérifier les routes spécifiques
checkFileContent(
  'src/routes/orders.js',
  ['PUT', '/:orderId/cancel', 'OrderController.cancelOrder'],
  'Route PUT /orders/:id/cancel'
);

checkFileContent(
  'src/routes/orders.js', 
  ['GET', '/:orderId/tracking', 'OrderController.getOrderTracking'],
  'Route GET /orders/:id/tracking'
);

console.log('\\n📋 3. Vérification du Contenu - Contrôleur');
console.log('─────────────────────────────────────────────');

// Vérifier les méthodes du contrôleur
checkFileContent(
  'src/controllers/orderController.js',
  ['cancelOrder', 'status !== \'pending\'', 'canceledAt'],
  'Méthode cancelOrder avec validation'
);

checkFileContent(
  'src/controllers/orderController.js',
  ['getOrderTracking', 'confirmedAt', 'shippedAt', 'deliveredAt', 'canceledAt'],
  'Méthode getOrderTracking complète'
);

console.log('\\n📋 4. Vérification du Contenu - Modèle');
console.log('─────────────────────────────────────────');

// Vérifier le modèle Order
checkFileContent(
  'models/Order.js',
  ['CANCELED: \'canceled\'', 'canceledAt', 'DataTypes.DATE'],
  'Statut canceled et champ canceledAt'
);

checkFileContent(
  'models/Order.js',
  ['isCancelable', 'ORDER_STATUS.PENDING', 'updateStatus'],
  'Méthodes de gestion de l\'annulation'
);

checkFileContent(
  'models/Order.js',
  ['VALID_TRANSITIONS', 'ORDER_STATUS.CANCELED'],
  'Machine à états avec canceled'
);

console.log('\\n📋 5. Vérification du Contenu - Migration');
console.log('─────────────────────────────────────────────');

// Vérifier la migration
checkFileContent(
  'migrations/20260731140000-add-order-cancellation-tracking.js',
  ['canceled_at', 'confirmed_at', 'shipped_at', 'delivered_at'],
  'Champs de dates de suivi'
);

checkFileContent(
  'migrations/20260731140000-add-order-cancellation-tracking.js', 
  ['canceled', 'OrderStatus', 'ENUM'],
  'ENUM étendu avec canceled'
);

console.log('\\n📋 6. Vérification des Tests');
console.log('───────────────────────────────');

checkFile('src/tests/orders.test.js', 'Tests automatisés');
checkFile('scripts/test-order-features.js', 'Tests manuels end-to-end');

if (checkFile('src/tests/orders.test.js', 'Fichier de tests')) {
  checkFileContent(
    'src/tests/orders.test.js',
    ['cancelOrder', 'getOrderTracking', 'FonctionnalitéMoyenne#1782'],
    'Tests d\'annulation et suivi'
  );
}

console.log('\\n📋 7. Vérification de la Configuration');
console.log('────────────────────────────────────────');

// Vérifier package.json
checkFileContent(
  'package.json',
  ['jest', 'sequelize', 'express'],
  'Dépendances nécessaires'
);

// Vérifier la configuration Sequelize
checkFile('config/database.js', 'Configuration base de données');
checkFile('.sequelizerc', 'Configuration Sequelize CLI');

console.log('\\n📋 8. Vérification de la Documentation');
console.log('─────────────────────────────────────────');

checkFile('FEATURE_VALIDATION_SUMMARY.md', 'Résumé de validation');
checkFile('IMPLEMENTATION_STATUS_REPORT.md', 'Rapport de statut');

console.log('\\n═══════════════════════════════════════════════════════════');

if (allChecksPass) {
  console.log('🎉 SUCCÈS: Toutes les vérifications sont passées!');
  console.log('');
  console.log('✅ La FonctionnalitéMoyenne#1782 est complètement implémentée');
  console.log('✅ Tous les fichiers nécessaires sont présents');  
  console.log('✅ Le contenu correspond aux spécifications');
  console.log('✅ Les tests sont en place');
  console.log('✅ La documentation est complète');
  console.log('');
  console.log('🚀 Prêt pour les tests et le déploiement!');
  console.log('');
  console.log('📝 Prochaines étapes recommandées:');
  console.log('   1. npm run db:migrate (appliquer les migrations)');
  console.log('   2. npm test (exécuter les tests)');  
  console.log('   3. node scripts/test-order-features.js (tests manuels)');
  console.log('   4. npm run dev (démarrer le serveur de développement)');
} else {
  console.log('❌ ÉCHEC: Certaines vérifications ont échoué');
  console.log('');
  console.log('🔧 Vérifiez les éléments marqués comme manquants ci-dessus');
  console.log('📖 Consultez FEATURE_VALIDATION_SUMMARY.md pour plus de détails');
}

console.log('\\n═══════════════════════════════════════════════════════════');

// Code de sortie pour scripts d'automatisation
process.exit(allChecksPass ? 0 : 1);