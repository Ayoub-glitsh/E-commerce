require('dotenv').config();
const express = require('express');
const { Review, Product, User } = require('../models');

const app = express();

// Test endpoint simple
app.get('/test-reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log('Testing reviews for product:', productId);
    
    const reviews = await Review.findAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log('Found reviews:', reviews.length);
    
    const stats = await Review.findAll({
      where: { productId },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });
    
    const response = {
      success: true,
      data: {
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at,
          user: {
            id: review.user.id,
            name: review.user.name || 'Utilisateur anonyme',
            email: review.user.email ? review.user.email.replace(/(.{2}).*@/, '$1***@') : null
          }
        })),
        stats: {
          averageRating: parseFloat(stats[0]?.averageRating || 0).toFixed(2),
          totalReviews: parseInt(stats[0]?.totalReviews || 0)
        }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test-reviews/0cc8991c-ebbf-4a1a-8cce-306d07371592`);
});