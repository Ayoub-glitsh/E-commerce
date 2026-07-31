const express = require('express');
const PaymentController = require('../controllers/paymentController');

const router = express.Router();

/**
 * Routes de gestion des webhooks
 * FonctionnalitéHaute#1781 - Intégration webhook Stripe pour confirmation paiement
 * 
 * Base URL: /webhooks
 * Ces endpoints reçoivent des données de services externes
 */

/**
 * @route   POST /webhooks/stripe
 * @desc    Webhook Stripe pour traiter les événements de paiement (FonctionnalitéHaute#1781)
 * @access  Public (signature Stripe requise)
 * @headers stripe-signature: <signature>
 * @body    Raw Stripe webhook payload (JSON)
 * @returns {
 *            success: boolean,
 *            received: boolean,
 *            event_type?: string
 *          }
 * 
 * Spécification FonctionnalitéHaute#1781:
 * - Sous-tâche 1: stripe.webhooks.constructEvent() pour validation signature
 * - Sous-tâche 3: Écoute 'payment_intent.succeeded' -> order.updateStatus('confirmed')
 * - Validation: Signature Stripe avec signing secret pour éviter faux webhooks
 * - Comportement: Récupère orderId depuis metadata et confirme la commande
 * 
 * Événements gérés:
 * - payment_intent.succeeded: Paiement réussi -> commande confirmée
 * - payment_intent.payment_failed: Paiement échoué -> note ajoutée
 * - payment_intent.canceled: Paiement annulé -> note ajoutée
 * 
 * Sécurité:
 * - Validation obligatoire de la signature Stripe
 * - Vérification des metadata (orderId, userId)
 * - Gestion des erreurs et logging détaillé
 * - Protection contre les webhooks falsifiés
 * 
 * Configuration requise:
 * - STRIPE_WEBHOOK_SECRET dans les variables d'environnement
 * - Endpoint configuré dans le dashboard Stripe
 * - Raw body middleware pour validation signature
 */
router.post('/stripe', PaymentController.handleStripeWebhook);

module.exports = router;