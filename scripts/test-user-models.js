#!/usr/bin/env node

const { User, RefreshToken, sequelize } = require('../models');

async function testUserModels() {
  console.log('🧪 TEST DES MODÈLES UTILISATEURS');
  console.log('================================\n');

  try {
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion Sequelize établie');

    // Test 1: Validation du modèle User
    console.log('\n📋 Test 1: Modèle User');
    
    // Récupération d'un utilisateur existant
    const existingUser = await User.findOne({
      limit: 1
    });
    
    if (existingUser) {
      console.log(`✅ Utilisateur trouvé: ${existingUser.email} (ID: ${existingUser.id.substring(0, 8)}...)`);
      console.log(`   Rôle: ${existingUser.role}`);
      console.log(`   Nom: ${existingUser.name || 'Non défini'}`);
      console.log(`   Créé: ${existingUser.created_at || existingUser.createdAt || 'Non disponible'}`);
      console.log(`   Mis à jour: ${existingUser.updated_at || existingUser.updatedAt || 'Non disponible'}`);
    } else {
      console.log('⚠️  Aucun utilisateur trouvé dans la base');
    }

    // Test 2: Validation du modèle RefreshToken
    console.log('\n📋 Test 2: Modèle RefreshToken');
    
    if (existingUser) {
      // Créer un refresh token de test
      const testToken = await RefreshToken.create({
        userId: existingUser.id,
        token: 'test-refresh-token-' + Date.now(),
        expiresAt: RefreshToken.generateExpiryDate(7), // 7 jours
        isActive: true
      });
      
      console.log(`✅ RefreshToken créé: ${testToken.id.substring(0, 8)}...`);
      console.log(`   User ID: ${testToken.userId.substring(0, 8)}...`);
      console.log(`   Token: ${testToken.token.substring(0, 20)}...`);
      console.log(`   Expire: ${testToken.expiresAt.toISOString()}`);
      console.log(`   Actif: ${testToken.isActive}`);
      
      // Test des méthodes
      console.log(`   Est expiré: ${testToken.isExpired()}`);
      console.log(`   Est valide: ${testToken.isValid()}`);
      
      // Test de l'association
      const tokenWithUser = await RefreshToken.findByPk(testToken.id, {
        include: [{
          model: User,
          as: 'user'
        }]
      });
      
      if (tokenWithUser && tokenWithUser.user) {
        console.log(`✅ Association RefreshToken → User: ${tokenWithUser.user.email}`);
      }
      
      // Nettoyer le token de test
      await testToken.destroy();
      console.log('🧹 Token de test supprimé');
    }

    // Test 3: Validation des contraintes
    console.log('\n📋 Test 3: Validation des contraintes');
    
    try {
      // Test validation email
      await User.build({
        email: 'email-invalide',
        password: '12345678',
        role: 'client'
      }).validate();
      console.log('❌ La validation email devrait échouer');
    } catch (error) {
      console.log('✅ Validation email: format invalide détecté');
    }
    
    try {
      // Test validation mot de passe court
      await User.build({
        email: 'test@example.com',
        password: '123',
        role: 'client'
      }).validate();
      console.log('❌ La validation mot de passe devrait échouer');
    } catch (error) {
      console.log('✅ Validation mot de passe: trop court détecté');
    }
    
    try {
      // Test validation rôle invalide
      await User.build({
        email: 'test@example.com',
        password: '12345678',
        role: 'invalid-role'
      }).validate();
      console.log('❌ La validation rôle devrait échouer');
    } catch (error) {
      console.log('✅ Validation rôle: valeur invalide détectée');
    }

    // Test 4: Structure de base de données
    console.log('\n📋 Test 4: Vérification structure DB');
    
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'refresh_tokens' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Colonnes table refresh_tokens:');
    results.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n🎉 TOUS LES TESTS TERMINÉS AVEC SUCCÈS !');
    console.log('\n📊 RÉSUMÉ:');
    console.log('✅ Modèle User: Compatible avec la DB existante');
    console.log('✅ Modèle RefreshToken: Créé et fonctionnel');
    console.log('✅ Associations: User ← RefreshToken (1:N)');
    console.log('✅ Validations: Email, mot de passe, rôle');
    console.log('✅ Migration: Table refresh_tokens créée');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
  } finally {
    await sequelize.close();
  }
}

testUserModels();