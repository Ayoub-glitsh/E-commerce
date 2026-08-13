require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

async function testReviewSystem() {
  console.log('🧪 Test du système d\'avis sur produits\n');

  try {
    // 1. Créer un utilisateur de test
    console.log('1. Création d\'un utilisateur de test...');
    const userResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `test-reviewer-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Test Reviewer'
    });

    if (userResponse.data.success) {
      console.log('   ✅ Utilisateur créé avec succès');
    }

    // 2. Se connecter pour obtenir un token
    console.log('2. Connexion de l\'utilisateur...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: userResponse.data.data.user.email,
      password: 'Password123!'
    });

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('   ✅ Connexion réussie, token obtenu');

    // Headers avec authentification
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 3. Récupérer la liste des produits pour obtenir un ID
    console.log('3. Récupération de la liste des produits...');
    const productsResponse = await axios.get(`${API_BASE_URL}/products`);
    
    if (productsResponse.data.success && productsResponse.data.data.products.length > 0) {
      const firstProduct = productsResponse.data.data.products[0];
      const productId = firstProduct.id;
      console.log(`   ✅ Produit trouvé: ${firstProduct.name} (ID: ${productId})`);

      // 4. Tester GET /products/:id/reviews (sans avis au début)
      console.log('4. Test de récupération des avis (liste vide attendue)...');
      const emptyReviewsResponse = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`);
      
      if (emptyReviewsResponse.data.success) {
        console.log(`   ✅ Avis récupérés: ${emptyReviewsResponse.data.data.reviews.length} avis`);
        console.log(`   ✅ Note moyenne: ${emptyReviewsResponse.data.data.stats.averageRating}`);
      }

      // 5. Créer le premier avis
      console.log('5. Création du premier avis...');
      const review1Response = await axios.post(
        `${API_BASE_URL}/products/${productId}/reviews`,
        {
          rating: 5,
          comment: 'Excellent produit ! Je le recommande vivement.'
        },
        { headers: authHeaders }
      );

      if (review1Response.data.success) {
        console.log('   ✅ Premier avis créé avec succès');
        console.log(`   📝 Rating: ${review1Response.data.data.review.rating}`);
        console.log(`   💬 Commentaire: ${review1Response.data.data.review.comment}`);
      }

      // 6. Créer un second utilisateur et avis
      console.log('6. Création d\'un second utilisateur et avis...');
      const user2Response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `test-reviewer2-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test Reviewer 2'
      });

      const login2Response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: user2Response.data.data.user.email,
        password: 'Password123!'
      });

      const token2 = login2Response.data.data.tokens.accessToken;
      const authHeaders2 = {
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      };

      const review2Response = await axios.post(
        `${API_BASE_URL}/products/${productId}/reviews`,
        {
          rating: 4,
          comment: 'Bon produit, mais pourrait être amélioré.'
        },
        { headers: authHeaders2 }
      );

      if (review2Response.data.success) {
        console.log('   ✅ Second avis créé avec succès');
      }

      // 7. Tenter de créer un second avis avec le même utilisateur (doit échouer)
      console.log('7. Test de contrainte unique (second avis du même utilisateur)...');
      try {
        await axios.post(
          `${API_BASE_URL}/products/${productId}/reviews`,
          {
            rating: 3,
            comment: 'Second avis du même utilisateur'
          },
          { headers: authHeaders }
        );
        console.log('   ❌ La contrainte unique n\'a pas fonctionné !');
      } catch (error) {
        if (error.response && error.response.status === 409) {
          console.log('   ✅ Contrainte unique respectée - second avis refusé');
        } else {
          console.log(`   ⚠️  Erreur inattendue: ${error.response?.data?.message || error.message}`);
        }
      }

      // 8. Récupérer la liste des avis mis à jour
      console.log('8. Récupération des avis mis à jour...');
      const updatedReviewsResponse = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`);
      
      if (updatedReviewsResponse.data.success) {
        const { reviews, stats } = updatedReviewsResponse.data.data;
        console.log(`   ✅ ${reviews.length} avis récupérés`);
        console.log(`   📊 Note moyenne: ${stats.averageRating}/5`);
        console.log(`   👥 Total des avis: ${stats.totalReviews}`);
        
        reviews.forEach((review, index) => {
          console.log(`   📝 Avis ${index + 1}:`);
          console.log(`      - Utilisateur: ${review.user.name}`);
          console.log(`      - Note: ${review.rating}/5`);
          console.log(`      - Commentaire: ${review.comment}`);
          console.log(`      - Date: ${new Date(review.createdAt).toLocaleString()}`);
        });
      }

      // 9. Test de pagination
      console.log('9. Test de pagination (limit=1)...');
      const paginatedResponse = await axios.get(`${API_BASE_URL}/products/${productId}/reviews?limit=1&page=1`);
      
      if (paginatedResponse.data.success) {
        const { reviews, pagination } = paginatedResponse.data.data;
        console.log(`   ✅ Pagination testée:`);
        console.log(`      - Avis par page: ${reviews.length}`);
        console.log(`      - Page courante: ${pagination.currentPage}`);
        console.log(`      - Pages totales: ${pagination.totalPages}`);
        console.log(`      - Page suivante disponible: ${pagination.hasNextPage}`);
      }

      // 10. Test avec un produit inexistant
      console.log('10. Test avec un produit inexistant...');
      try {
        await axios.get(`${API_BASE_URL}/products/00000000-0000-0000-0000-000000000000/reviews`);
        console.log('   ❌ La validation de produit inexistant n\'a pas fonctionné !');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('   ✅ Gestion du produit inexistant correcte');
        } else {
          console.log(`   ⚠️  Erreur inattendue: ${error.response?.data?.message || error.message}`);
        }
      }

    } else {
      console.log('   ❌ Aucun produit trouvé dans la base de données');
    }

    console.log('\n🎉 Tests du système d\'avis terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error.response?.data || error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testReviewSystem();
}

module.exports = { testReviewSystem };