require('dotenv').config();
const { Review, Product, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function createSampleReview() {
  console.log('🧪 Création d\'avis d\'exemple');
  
  try {
    // 1. Récupérer l'utilisateur admin existant
    const user = await User.findOne();
    if (!user) {
      console.error('❌ Aucun utilisateur trouvé');
      return;
    }
    console.log(`✅ Utilisateur trouvé: ${user.name} (${user.email})`);
    
    // 2. Récupérer le premier produit
    const product = await Product.findOne();
    if (!product) {
      console.error('❌ Aucun produit trouvé');
      return;
    }
    console.log(`✅ Produit trouvé: ${product.name}`);
    
    // 3. Vérifier si un avis existe déjà
    const existingReview = await Review.findOne({
      where: {
        userId: user.id,
        productId: product.id
      }
    });
    
    if (existingReview) {
      console.log('ℹ️  Un avis existe déjà pour ce produit par cet utilisateur');
      return;
    }
    
    // 4. Créer un avis d'exemple
    const reviewId = uuidv4();
    const newReview = await Review.create({
      id: reviewId,
      userId: user.id,
      productId: product.id,
      rating: 5,
      comment: 'Excellent produit ! Je le recommande vivement. Interface très intuitive et fonctionnalités complètes.'
    });
    
    console.log('✅ Avis créé avec succès:');
    console.log(`   ID: ${newReview.id}`);
    console.log(`   Rating: ${newReview.rating}/5`);
    console.log(`   Commentaire: ${newReview.comment}`);
    
    // 5. Créer quelques avis supplémentaires avec des utilisateurs fictifs
    for (let i = 0; i < 3; i++) {
      const userId = uuidv4();
      const reviewId2 = uuidv4();
      
      // Créer un utilisateur fictif temporaire (juste pour les avis)
      const fakeUser = await User.create({
        id: userId,
        email: `user${i}@example.com`,
        password: '$2b$12$dummy.hash.for.test.user.only',
        name: `Utilisateur Test ${i + 1}`,
        role: 'client'
      });
      
      const rating = Math.floor(Math.random() * 5) + 1;
      const comments = [
        'Très satisfait de mon achat. Livraison rapide et produit conforme.',
        'Bon rapport qualité-prix. Quelques améliorations à prévoir.',
        'Parfait ! Exactement ce que je cherchais. Recommande fortement.',
        'Produit correct, mais j\'attendais mieux pour ce prix.',
        'Excellent service client et produit de qualité supérieure.'
      ];
      
      await Review.create({
        id: reviewId2,
        userId: userId,
        productId: product.id,
        rating: rating,
        comment: comments[i]
      });
      
      console.log(`✅ Avis ${i + 1} supplémentaire créé (${rating}/5)`);
    }
    
    // 6. Vérifier les avis créés
    const allReviews = await Review.findAll({
      where: { productId: product.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });
    
    console.log(`\n📊 Total des avis pour ${product.name}: ${allReviews.length}`);
    allReviews.forEach((review, index) => {
      console.log(`   ${index + 1}. ${review.user.name}: ${review.rating}/5 - "${review.comment.substring(0, 50)}..."`);
    });
    
    console.log('\n🎉 Avis d\'exemple créés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la création des avis d'exemple
createSampleReview();