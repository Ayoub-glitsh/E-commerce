#!/usr/bin/env node

/**
 * Script pour créer des utilisateurs de test (admin et standard)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function createTestUsers() {
  console.log('🚀 Création des utilisateurs de test...\n');

  try {
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données : OK\n');

    // === CRÉATION D'UN UTILISATEUR ADMIN ===
    console.log('👑 Création de l\'utilisateur ADMIN...');
    
    const saltRounds = 12;
    const adminPassword = 'AdminPassword123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = await User.create({
      id: uuidv4(),
      email: 'admin@3lm-solutions.com',
      password: adminPasswordHash,
      role: 'admin',
      name: 'Administrateur 3LM'
    });

    console.log(`✅ Utilisateur admin créé : ${adminUser.email} (ID: ${adminUser.id})`);
    console.log(`🔑 Mot de passe admin : ${adminPassword}\n`);

    // === CRÉATION D'UN UTILISATEUR STANDARD ===
    console.log('👤 Création de l\'utilisateur STANDARD...');
    
    const userPassword = 'UserPassword123';
    const userPasswordHash = await bcrypt.hash(userPassword, saltRounds);

    const standardUser = await User.create({
      id: uuidv4(),
      email: 'user@example.com',
      password: userPasswordHash,
      role: 'client',
      name: 'Utilisateur Test'
    });

    console.log(`✅ Utilisateur standard créé : ${standardUser.email} (ID: ${standardUser.id})`);
    console.log(`🔑 Mot de passe user : ${userPassword}\n`);

    // === RÉSUMÉ DES COMPTES CRÉÉS ===
    console.log('📊 === COMPTES DE TEST CRÉÉS ===');
    console.log('');
    console.log('👑 COMPTE ADMIN:');
    console.log(`   Email: admin@3lm-solutions.com`);
    console.log(`   Mot de passe: ${adminPassword}`);
    console.log(`   Rôle: admin`);
    console.log(`   Accès: Toutes les routes + administration`);
    console.log('');
    console.log('👤 COMPTE UTILISATEUR:');
    console.log(`   Email: user@example.com`);
    console.log(`   Mot de passe: ${userPassword}`);
    console.log(`   Rôle: user`);
    console.log(`   Accès: Routes publiques uniquement`);
    console.log('');

    // === INSTRUCTIONS DE TEST ===
    console.log('🧪 === INSTRUCTIONS DE TEST ===');
    console.log('');
    console.log('1. Connectez-vous en tant qu\'ADMIN :');
    console.log('   POST /api/auth/login');
    console.log('   Body: { "email": "admin@3lm-solutions.com", "password": "AdminPassword123" }');
    console.log('');
    console.log('2. Connectez-vous en tant qu\'UTILISATEUR :');
    console.log('   POST /api/auth/login');
    console.log('   Body: { "email": "user@example.com", "password": "UserPassword123" }');
    console.log('');
    console.log('3. Testez les routes admin avec le token admin (succès) :');
    console.log('   GET /api/admin/products');
    console.log('   POST /api/admin/products');
    console.log('   PUT /api/admin/products/:id');
    console.log('   DELETE /api/admin/products/:id');
    console.log('');
    console.log('4. Testez les routes admin avec le token user (erreur 403) :');
    console.log('   Même routes → devrait retourner "Accès refusé - privilèges admin requis"');
    console.log('');
    console.log('✅ Utilisateurs de test prêts ! Démarrez le serveur avec : npm run dev');

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('⚠️ Les utilisateurs de test existent déjà dans la base de données');
      console.log('');
      console.log('📋 COMPTES EXISTANTS:');
      console.log('👑 Admin: admin@3lm-solutions.com / AdminPassword123');
      console.log('👤 User: user@example.com / UserPassword123');
    } else {
      console.error('❌ Erreur lors de la création des utilisateurs :', error.message);
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createTestUsers().catch(error => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });
}

module.exports = createTestUsers;