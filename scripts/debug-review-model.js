require('dotenv').config();
const { Review, User, Product } = require('../models');

async function debugReviewModel() {
  try {
    console.log('🔍 Test du modèle Review...');
    
    // Test 1: Tenter de récupérer les avis
    console.log('1. Test de findAll...');
    const reviews = await Review.findAll({
      limit: 1,
      attributes: ['id', 'rating', 'comment', 'createdAt'] // Spécifier explicitement les colonnes
    });
    console.log('✅ findAll réussi, nombre d\'avis:', reviews.length);
    
    // Test 2: Tester avec include
    console.log('2. Test avec include User...');
    const reviewsWithUser = await Review.findAll({
      limit: 1,
      attributes: ['id', 'rating', 'comment', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    console.log('✅ include User réussi');
    
    console.log('🎉 Modèle Review fonctionne correctement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugReviewModel();