const express = require('express');
const RecommendationController = require('../controllers/recommendationController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/for-you', verifyToken, RecommendationController.getForYou);

router.get('/similar/:product_id', RecommendationController.getSimilarProducts);

router.get('/trending', RecommendationController.getTrending);

module.exports = router;