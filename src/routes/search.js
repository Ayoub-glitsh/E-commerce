const express = require('express');
const SearchController = require('../controllers/searchController');

const router = express.Router();

router.post('/nlp', SearchController.searchNLP);

router.get('/', SearchController.searchClassic);

module.exports = router;