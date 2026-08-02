const express = require('express');
const EventController = require('../controllers/eventController');
const { validateLogView, validateLogPurchase } = require('../validators/eventValidator');

const router = express.Router();

router.post('/view', validateLogView, EventController.logView);

router.post('/purchase', validateLogPurchase, EventController.logPurchase);

module.exports = router;