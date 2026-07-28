require('dotenv').config();
const { Review, User, Product } = require('../models');

async function testReviewModel() {
  console.log('🧪 Test du modèle Review');
  
  try {
    // Test 1: Requête simple sur reviews
    console.log('1. Test de requête simple...');
    const reviews = await Review.findAll({
      limit: 5
    });
    console.log(`   ✅ ${reviews.length} avis trouvés`);
    
    // Test 2: Tester l'association avec User
    console.log('2. Test des associations...');
    const reviewWithUser = await Review.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      limit: 1
    });
    console.log(`   ✅ ${reviewWithUser.length} avis avec utilisateur trouvés`);
    
    // Test 3: Vérifier la structure des colonnes
    console.log('3. Test de la structure...');
    const reviewDescription = Review.describe();
    console.log('   Colonnes du modèle:', Object.keys(reviewDescription));
    
    // Test 4: Tester l'association avec Product
    console.log('4. Test association Product...');
    const reviewWithProduct = await Review.findAll({
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }],
      limit: 1
    });
    console.log(`   ✅ ${reviewWithProduct.length} avis avec produit trouvés`);
    
    console.log('🎉 Tests du modèle terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
  }
}

// Exécuter les tests
testReviewModel();