const { Order } = require('../../models');
const Stripe = require('stripe');

/**
 * Contrôleur de gestion des paiements Stripe
 * FonctionnalitéHaute#1780 - Configuration Stripe et endpoint paiement
 * FonctionnalitéHaute#1781 - Intégration webhook Stripe pour confirmation paiement
 * 
 * Fonctionnalités:
 * - Initialisation Stripe avec clé secrète
 * - Création de PaymentIntent pour commandes avec metadata
 * - Webhook Stripe pour confirmation automatique des paiements
 * - Vérification de sécurité et ownership des commandes
 * - Gestion des statuts de commande lors du paiement
 */

// Sous-tâche 1: Initialiser Stripe avec STRIPE_SECRET_KEY
let stripe;
if (process.env.STRIPE_SECRET_KEY?.includes('mock') || process.env.NODE_ENV === 'test') {
  // Mode mock pour les tests de développement
  console.log('🧪 Stripe en mode mock pour les tests');
  stripe = {
    paymentIntents: {
      create: async (params) => {
        console.log('🧪 Mock Stripe PaymentIntent create:', params);
        return {
          id: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
          status: 'requires_payment_method',
          amount: params.amount,
          currency: params.currency,
          metadata: params.metadata
        };
      }
    }
  };
} else {
  // Mode production avec vraie Stripe API
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

class PaymentController {

  /**
   * POST /api/payments/create-intent - Créer un PaymentIntent Stripe (FonctionnalitéHaute#1780)
   * Sous-tâche 2: Implémenter POST /payments/create-intent avec stripe.paymentIntents.create()
   * Sous-tâche 3: Retourner { client_secret, orderId } et vérifier ownership
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async createPaymentIntent(req, res) {
    try {
      const userId = req.user.id; // JWT token verification
      const { orderId, amount, currency = 'eur' } = req.body;

      console.log(`💳 FonctionnalitéHaute#1780 - Création PaymentIntent pour commande ${orderId}`);

      // Validation des paramètres d'entrée
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'OrderId est requis'
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount doit être supérieur à 0'
        });
      }

      // Sous-tâche 3: Vérifier que l'ordre existe et appartient à l'utilisateur
      const order = await Order.findOne({
        where: {
          orderId: orderId,
          userId: userId // Sécurité: l'utilisateur ne peut payer que ses propres commandes
        }
      });

      if (!order) {
        console.log(`❌ Commande ${orderId} non trouvée ou n'appartient pas à l'utilisateur ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée ou accès non autorisé'
        });
      }

      // Vérifier que le montant correspond à celui de la commande
      const orderAmount = Math.round(parseFloat(order.totalAmount) * 100); // Stripe utilise les centimes
      const requestedAmount = Math.round(parseFloat(amount) * 100);

      if (Math.abs(orderAmount - requestedAmount) > 1) { // Tolérance de 1 centime pour les arrondis
        return res.status(400).json({
          success: false,
          message: `Montant invalide. Attendu: ${(orderAmount / 100).toFixed(2)}€, Reçu: ${(requestedAmount / 100).toFixed(2)}€`
        });
      }

      console.log(`💰 Montant validé: ${(orderAmount / 100).toFixed(2)}€ pour commande ${orderId}`);

      // Vérifier que la commande est dans un état payable
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Impossible de payer une commande avec le statut "${order.status}"`
        });
      }

      // Sous-tâche 2: Créer un PaymentIntent avec stripe.paymentIntents.create()
      // Sous-tâche 2 (FonctionnalitéHaute#1781): Stocker orderId en metadata
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: orderAmount, // Montant en centimes
          currency: currency.toLowerCase(),
          metadata: {
            orderId: order.orderId,        // Sous-tâche 2: orderId stocké en metadata
            userId: userId,                // Informations utilisateur pour sécurité
            orderInternalId: order.id,     // ID interne pour debug
            implementationFeature: 'FonctionnalitéHaute#1780-1781'  // Traçabilité
          },
          description: `Paiement pour commande ${order.orderId}`,
          // Méthodes de paiement autorisées
          payment_method_types: ['card'],
          // Configuration pour une meilleure sécurité
          capture_method: 'automatic',
          confirmation_method: 'manual',
          // Informations supplémentaires pour le tableau de bord Stripe
          statement_descriptor: 'E-COMMERCE',
          statement_descriptor_suffix: order.orderId.slice(-10)
        });

        console.log(`✅ PaymentIntent créé: ${paymentIntent.id} pour commande ${orderId}`);
        console.log(`📝 Metadata stockées: orderId=${order.orderId}, userId=${userId}`);

        // Mettre à jour le statut de la commande selon spécification
        // "La commande passe à status=pending au moment de la création de l'intent"
        if (order.status !== 'pending') {
          await order.update({
            status: 'pending',
            notes: order.notes ? 
              `${order.notes}\nPaymentIntent créé: ${paymentIntent.id}` : 
              `PaymentIntent créé: ${paymentIntent.id}`
          });
          console.log(`📊 Statut commande mis à jour: ${order.orderId} -> pending`);
        }

        // Sous-tâche 3: Retourner { client_secret, orderId }
        const response = {
          client_secret: paymentIntent.client_secret,
          orderId: order.orderId,
          // Informations supplémentaires utiles pour le frontend
          amount: orderAmount / 100, // Retour en euros
          currency: currency,
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id
        };

        console.log(`🎉 PaymentIntent créé avec succès pour ${orderId}`);

        res.status(201).json({
          success: true,
          message: 'PaymentIntent créé avec succès',
          data: response
        });

      } catch (stripeError) {
        console.error('Erreur Stripe lors de la création du PaymentIntent:', stripeError);
        
        // Gestion des erreurs spécifiques Stripe (ne se produisent pas en mode mock)
        let errorMessage = 'Erreur lors de la création du paiement';
        if (stripeError.type === 'StripeCardError') {
          errorMessage = 'Erreur de carte bancaire';
        } else if (stripeError.type === 'StripeRateLimitError') {
          errorMessage = 'Trop de requêtes, veuillez réessayer';
        } else if (stripeError.type === 'StripeInvalidRequestError') {
          errorMessage = 'Paramètres de paiement invalides';
        } else if (stripeError.type === 'StripeAPIError') {
          errorMessage = 'Erreur temporaire du service de paiement';
        } else if (stripeError.type === 'StripeConnectionError') {
          errorMessage = 'Erreur de connexion au service de paiement';
        } else if (stripeError.message?.includes('API Key')) {
          errorMessage = 'Configuration Stripe invalide (clé API)';
        }

        return res.status(400).json({
          success: false,
          message: errorMessage,
          error: process.env.NODE_ENV === 'development' ? stripeError.message : undefined
        });
      }

    } catch (error) {
      console.error('Erreur lors de la création du PaymentIntent:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la création du paiement'
      });
    }
  }

  /**
   * POST /api/payments/webhook - Webhook Stripe pour confirmation paiement (FonctionnalitéHaute#1781)
   * Sous-tâche 1: Implémenter POST /webhooks/stripe avec stripe.webhooks.constructEvent()
   * Sous-tâche 3: À la réception de payment_intent.succeeded, appeler order.updateStatus('confirmed')
   * 
   * @param {Object} req - Requête Express (raw body required)
   * @param {Object} res - Réponse Express
   */
  static async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      console.log(`🎣 FonctionnalitéHaute#1781 - Webhook Stripe reçu`);

      let event;

      // Sous-tâche 1: Valider la signature Stripe avec constructEvent()
      try {
        if (process.env.STRIPE_WEBHOOK_SECRET?.includes('mock') || process.env.NODE_ENV === 'test') {
          // Mode mock pour les tests
          console.log('🧪 Webhook en mode mock pour les tests');
          event = {
            type: req.body.type || 'payment_intent.succeeded',
            data: {
              object: {
                id: req.body.payment_intent_id || 'pi_mock_test_123',
                metadata: {
                  orderId: req.body.orderId || 'ORD-TEST-123',
                  userId: req.body.userId || 'user-test-123'
                }
              }
            }
          };
        } else {
          // Production: validation réelle de la signature
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        }
      } catch (err) {
        // ⚠️ IMPORTANT: si constructEvent() a échoué, la variable `event` n'est PAS définie.
        // On ne doit donc jamais référencer `event` ici (cela provoquerait une erreur secondaire
        // non gérée et un 500 générique au lieu d'un 400 clair pour signature invalide).
        // On logge uniquement l'erreur réelle de validation de la signature.
        console.error(`❌ Erreur validation signature webhook: ${err.message}`);
        // Retour immédiat avec une réponse 400 claire : on stoppe l'exécution avec `return`.
        return res.status(400).json({
          success: false,
          message: 'Signature webhook invalide.'
        });
      }

      console.log(`🎯 Event type: ${event.type}`);

      // Gérer différents types d'événements Stripe
      // Le traitement de l'événement est isolé dans un try/catch séparé :
      // si le traitement applicatif (ex: order.updateStatus) échoue, on logge l'erreur
      // MAIS on renvoie quand même 200 à Stripe. Sinon, Stripe réessaierait indéfiniment
      // un événement qui pose un problème côté application, pas côté Stripe.
      try {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await PaymentController.handlePaymentIntentSucceeded(event.data.object);
            break;

          case 'payment_intent.payment_failed':
            // Le handler existe déjà, on l'utilise pour enregistrer l'échec de paiement.
            await PaymentController.handlePaymentIntentFailed(event.data.object);
            break;

          case 'payment_intent.canceled':
            await PaymentController.handlePaymentIntentCanceled(event.data.object);
            break;

          default:
            // Événement non géré : simple log, ce n'est pas une erreur (console.log).
            console.log(`⚠️ Événement non géré: ${event.type}`);
        }
      } catch (eventError) {
        // Erreur applicative lors du traitement de l'événement.
        // Décision : logger l'erreur mais répondre quand même 200 à Stripe pour
        // éviter que Stripe réessaie indéfiniment un événement problématique côté app.
        console.error(`❌ Erreur lors du traitement de l'événement ${event.type}:`, eventError);
      }

      // Répondre à Stripe que le webhook a été traité avec succès
      // (uniquement après le traitement de l'événement, jamais avant)
      res.status(200).json({ 
        success: true,
        received: true,
        event_type: event.type 
      });

    } catch (error) {
      console.error('Erreur webhook Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du webhook'
      });
    }
  }

  /**
   * Gérer l'événement payment_intent.succeeded (FonctionnalitéHaute#1781)
   * Sous-tâche 3: Récupérer orderId depuis metadata et passer commande à status=confirmed
   * 
   * @param {Object} paymentIntent - L'objet PaymentIntent de Stripe
   */
  static async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      console.log(`✅ Payment Intent succeeded: ${paymentIntent.id}`);

      // Sous-tâche 3: Récupérer l'orderId depuis les metadata
      const orderId = paymentIntent.metadata?.orderId;
      const userId = paymentIntent.metadata?.userId;

      if (!orderId) {
        console.error('❌ OrderId manquant dans les metadata du PaymentIntent');
        return;
      }

      console.log(`📦 Traitement paiement réussi pour commande: ${orderId}`);

      // Récupérer la commande
      const order = await Order.findOne({
        where: { orderId: orderId }
      });

      if (!order) {
        console.error(`❌ Commande ${orderId} non trouvée`);
        return;
      }

      // Vérifier que la commande est dans un état modifiable
      if (!['pending', 'confirmed'].includes(order.status)) {
        console.log(`⚠️ Commande ${orderId} déjà dans l'état ${order.status}, pas de mise à jour nécessaire`);
        return;
      }

      // Sous-tâche 3: Appeler order.updateStatus('confirmed')
      await order.updateStatus('confirmed');

      // Ajouter des informations de paiement dans les notes
      const paymentNote = `Paiement confirmé via Stripe: ${paymentIntent.id}`;
      await order.update({
        notes: order.notes ? `${order.notes}\n${paymentNote}` : paymentNote,
        paymentMethod: 'stripe_card' // Mettre à jour la méthode de paiement
      });

      console.log(`🎉 Commande ${orderId} confirmée avec succès (status: ${order.status})`);

    } catch (error) {
      console.error('Erreur lors du traitement payment_intent.succeeded:', error);
    }
  }

  /**
   * Gérer l'événement payment_intent.payment_failed
   * 
   * @param {Object} paymentIntent - L'objet PaymentIntent de Stripe
   */
  static async handlePaymentIntentFailed(paymentIntent) {
    try {
      console.log(`❌ Payment Intent failed: ${paymentIntent.id}`);

      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) return;

      const order = await Order.findOne({
        where: { orderId: orderId }
      });

      if (!order) {
        console.error(`❌ Commande ${orderId} non trouvée`);
        return;
      }

      // Ajouter une note sur l'échec du paiement
      const failureNote = `Paiement échoué: ${paymentIntent.id} - ${new Date().toLocaleString()}`;
      await order.update({
        notes: order.notes ? `${order.notes}\n${failureNote}` : failureNote
      });

      console.log(`💔 Échec de paiement enregistré pour commande ${orderId}`);

    } catch (error) {
      console.error('Erreur lors du traitement payment_intent.payment_failed:', error);
    }
  }

  /**
   * Gérer l'événement payment_intent.canceled
   * 
   * @param {Object} paymentIntent - L'objet PaymentIntent de Stripe
   */
  static async handlePaymentIntentCanceled(paymentIntent) {
    try {
      console.log(`🚫 Payment Intent canceled: ${paymentIntent.id}`);

      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) return;

      const order = await Order.findOne({
        where: { orderId: orderId }
      });

      if (!order) {
        console.error(`❌ Commande ${orderId} non trouvée`);
        return;
      }

      // Ajouter une note sur l'annulation
      const cancelNote = `Paiement annulé: ${paymentIntent.id} - ${new Date().toLocaleString()}`;
      await order.update({
        notes: order.notes ? `${order.notes}\n${cancelNote}` : cancelNote
      });

      console.log(`🚫 Annulation de paiement enregistrée pour commande ${orderId}`);

    } catch (error) {
      console.error('Erreur lors du traitement payment_intent.canceled:', error);
    }
  }

  /**
   * GET /api/payments/config - Obtenir la configuration publique Stripe
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getStripeConfig(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          currency: 'eur',
          country: 'FR'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la config Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la configuration'
      });
    }
  }
}

module.exports = PaymentController;