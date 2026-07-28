require('dotenv').config();
const { Review, Product, User } = require('../models');

async function testReviewEndpoint() {
  console.log('🧪 Test direct de l\'endpoint avis');
  
  try {
    // 1. Récupérer le produit avec des avis
    const productId = '0cc8991c-ebbf-4a1a-8cce-306d07371592';
    
    console.log('1. Test de requête simple...');
    const reviews = await Review.findAll({
      where: { productId },
      limit: 5
    });
    console.log(`   ✅ ${reviews.length} avis trouvés`);
    
    console.log('2. Test avec association User...');
    const reviewsWithUser = await Review.findAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: 5
    });
    console.log(`   ✅ ${reviewsWithUser.length} avis avec utilisateur`);
    
    if (reviewsWithUser.length > 0) {
      const review = reviewsWithUser[0];
      console.log('   Exemple d\'avis:');
      console.log(`     ID: ${review.id}`);
      console.log(`     Rating: ${review.rating}`);
      console.log(`     Comment: ${review.comment}`);
      console.log(`     Created: ${review.created_at}`);
      console.log(`     User: ${review.user?.name || 'N/A'}`);
    }
    
    console.log('3. Test des statistiques...');
    const stats = await Review.findAll({
      where: { productId },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });
    console.log('   Stats:', stats[0]);
    
    console.log('🎉 Tests réussis !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testReviewEndpoint();