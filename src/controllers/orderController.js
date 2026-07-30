const { Order, Cart, CartItem, User } = require('../../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Contrôleur de gestion des commandes
 * FonctionnalitéHaute#1778 (POST /orders) + FonctionnalitéHaute#1777 (machine à états) + FonctionnalitéHaute#1779 (historique)
 * 
 * Fonctionnalités:
 * - Création de commandes depuis le panier (FonctionnalitéHaute#1778)
 * - Gestion machine à états (pending -> confirmed -> shipped -> delivered) (FonctionnalitéHaute#1777)
 * - Historique et consultation des commandes (FonctionnalitéHaute#1779)
 * - Validation des transitions de statut
 * - Sécurité : utilisateurs n'accèdent qu'à leurs propres commandes
 */

class OrderController {

  /**
   * POST /api/orders - Créer une commande depuis le panier
   * FonctionnalitéHaute#1778
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

      console.log(`📦 Création de commande pour l'utilisateur ${userId}`);

      // Sous-tâche 1: Récupérer le panier de l'utilisateur via findByUserId
      const cart = await Cart.findByUserId(userId);
      
      if (!cart) {
        return res.status(400).json({
          success: false,
          message: 'Aucun panier trouvé pour cet utilisateur'
        });
      }

      // Sous-tâche 2: Vérifier que panier.items.length > 0
      if (!cart.items || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Le panier est vide. Ajoutez des produits avant de passer commande.'
        });
      }

      console.log(`🛒 Panier trouvé avec ${cart.items.length} items`);

      // Copier les items du panier dans la commande
      const orderItems = cart.items.map(item => ({
        productId: item.productId,
        name: item.name || 'Produit',
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
        total: (parseFloat(item.price) || 0) * (item.quantity || 1)
      }));

      // Calculer le totalAmount
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

      console.log(`💰 Total calculé: ${totalAmount}€`);

      // Créer la commande avec status=pending
      const order = await Order.create({
        id: uuidv4(),
        orderId: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId: userId,
        items: orderItems,
        totalAmount: totalAmount,
        status: 'pending', // Status initial selon spécification FonctionnalitéHaute#1778
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null
      });

      console.log(`✅ Commande créée: ${order.orderId} (Status: ${order.status})`);

      // Sous-tâche 3: Appeler cart.clear() pour vider le panier
      await cart.clear();

      // Retourner la réponse selon la spécification: { orderId, total, status: 'pending' }
      res.status(201).json({
        success: true,
        message: 'Commande créée avec succès',
        data: {
          orderId: order.orderId,
          total: parseFloat(totalAmount),
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Erreur lors de la création de commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la création de la commande'
      });
    }
  }

  /**
   * PUT /api/orders/:orderId/status - Mettre à jour le statut d'une commande
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { newStatus } = req.body;
      const userId = req.user.id;

      console.log(`🔄 Tentative de mise à jour statut commande ${orderId}: -> ${newStatus}`);

      // Validation du nouveau statut
      if (!newStatus) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau statut est requis'
        });
      }

      if (!Object.values(Order.STATUS).includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Statuts autorisés: [${Object.values(Order.STATUS).join(', ')}]`
        });
      }

      // Trouver la commande
      const order = await Order.findOne({
        where: { 
          orderId: orderId,
          userId: userId // S'assurer que l'utilisateur possède cette commande
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      // Tenter la mise à jour du statut (avec validation automatique)
      try {
        await order.updateStatus(newStatus);

        res.status(200).json({
          success: true,
          message: `Statut de la commande mis à jour vers "${newStatus}"`,
          data: {
            orderId: order.orderId,
            previousStatus: order._previousDataValues?.status,
            currentStatus: order.status,
            availableTransitions: order.getAvailableTransitions(),
            trackingNumber: order.trackingNumber,
            updatedAt: order.updated_at
          }
        });

      } catch (transitionError) {
        // Erreur de transition invalide
        console.log(`❌ Transition refusée: ${transitionError.message}`);
        
        return res.status(400).json({
          success: false,
          message: transitionError.message,
          data: {
            currentStatus: order.status,
            requestedStatus: newStatus,
            availableTransitions: order.getAvailableTransitions()
          }
        });
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la mise à jour du statut'
      });
    }
  }

  /**
   * GET /api/orders - Lister les commandes de l'utilisateur (FonctionnalitéHaute#1779)
   * Sous-tâche 1: Implémenter GET /orders : requête find({ userId }) avec tri par date décroissante
   * 
   * @param {Object} req - Requête Express  
   * @param {Object} res - Réponse Express
   */
  static async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 50, offset = 0, page = 1 } = req.query;

      console.log(`📋 FonctionnalitéHaute#1779 - Récupération historique commandes utilisateur ${userId}`);

      // Sous-tâche 1: Construire les conditions de recherche find({ userId })
      const whereConditions = { userId: userId };
      if (status && Object.values(Order.STATUS).includes(status)) {
        whereConditions.status = status;
      }

      // Calcul de pagination
      const limitInt = Math.min(parseInt(limit) || 50, 100); // Limite max de 100
      const pageInt = Math.max(parseInt(page) || 1, 1); // Page min de 1
      const offsetCalculated = offset ? parseInt(offset) : (pageInt - 1) * limitInt;

      // Sous-tâche 1: Requête avec tri par date décroissante
      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereConditions,
        order: [['created_at', 'DESC']], // Tri par date décroissante selon spécification
        limit: limitInt,
        offset: offsetCalculated,
        attributes: [
          'id', 'orderId', 'userId', 'status', 'totalAmount', 'items',
          'shippingAddress', 'billingAddress', 'paymentMethod', 
          'trackingNumber', 'notes', 'created_at', 'updated_at'
        ]
      });

      console.log(`📋 ${orders.length} commandes trouvées sur ${count} total`);

      // Formatter les résultats avec tous les détails selon spécification
      const formattedOrders = orders.map(order => ({
        orderId: order.orderId,
        id: order.id,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        itemsCount: order.items?.length || 0,
        // Sous-tâche 3: Retourner les détails complets
        items: order.items?.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total || (item.price * item.quantity))
        })) || [],
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        paymentMethod: order.paymentMethod,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        // Informations sur les transitions et état
        availableTransitions: order.getAvailableTransitions(),
        isModifiable: order.isModifiable(),
        isCompleted: order.isCompleted(),
        // Sous-tâche 3: Dates complètes
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }));

      // Pagination détaillée
      const hasNextPage = (offsetCalculated + limitInt) < count;
      const hasPrevPage = offsetCalculated > 0;
      const totalPages = Math.ceil(count / limitInt);

      res.status(200).json({
        success: true,
        message: `${count} commandes trouvées pour l'utilisateur`,
        data: {
          orders: formattedOrders,
          pagination: {
            total: count,
            count: formattedOrders.length,
            page: pageInt,
            totalPages: totalPages,
            limit: limitInt,
            offset: offsetCalculated,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? pageInt + 1 : null,
            prevPage: hasPrevPage ? pageInt - 1 : null
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la récupération des commandes'
      });
    }
  }

  /**
   * GET /api/orders/:orderId - Récupérer une commande spécifique (FonctionnalitéHaute#1779)
   * Sous-tâche 2: Implémenter GET /orders/:id : récupérer l'order par id et vérifier userId === user.id du token
   * Sous-tâche 3: Retourner les détails complets (items avec product_id/quantity/price, total, status, dates)
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id; // user.id du token JWT

      console.log(`📦 FonctionnalitéHaute#1779 - Récupération commande ${orderId} pour utilisateur ${userId}`);

      // Sous-tâche 2: Récupérer l'order par id et vérifier userId === user.id du token
      const order = await Order.findOne({
        where: { 
          orderId: orderId,
          userId: userId // Vérification de sécurité: l'utilisateur n'accède qu'à ses propres commandes
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }],
        attributes: [
          'id', 'orderId', 'userId', 'status', 'totalAmount', 'items',
          'shippingAddress', 'billingAddress', 'paymentMethod', 
          'trackingNumber', 'notes', 'created_at', 'updated_at'
        ]
      });

      if (!order) {
        console.log(`❌ Commande ${orderId} non trouvée ou n'appartient pas à l'utilisateur ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée ou accès non autorisé'
        });
      }

      console.log(`✅ Commande ${orderId} trouvée avec ${order.items?.length || 0} items`);

      // Sous-tâche 3: Retourner les détails complets
      const detailedResponse = {
        orderId: order.orderId,
        id: order.id,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        
        // Items avec product_id/quantity/price selon spécification
        items: order.items?.map(item => ({
          productId: item.productId, // product_id selon spécification
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total || (item.price * item.quantity))
        })) || [],
        
        // Détails d'adresse et paiement complets
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        paymentMethod: order.paymentMethod,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        
        // Informations sur les transitions et état
        availableTransitions: order.getAvailableTransitions(),
        isModifiable: order.isModifiable(),
        isCompleted: order.isCompleted(),
        
        // Informations utilisateur (sans données sensibles)
        user: order.user ? {
          id: order.user.id,
          email: order.user.email,
          name: order.user.name
        } : null,
        
        // Dates complètes selon spécification
        createdAt: order.created_at,
        updatedAt: order.updated_at
      };

      // Log des détails pour debugging
      console.log(`📦 Détails commande ${orderId}:`);
      console.log(`   - Status: ${detailedResponse.status}`);
      console.log(`   - Total: ${detailedResponse.totalAmount}€`);
      console.log(`   - Items: ${detailedResponse.items.length}`);
      console.log(`   - Paiement: ${detailedResponse.paymentMethod || 'Non spécifié'}`);
      console.log(`   - Créée le: ${detailedResponse.createdAt}`);

      res.status(200).json({
        success: true,
        message: 'Commande récupérée avec succès',
        data: detailedResponse
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de la récupération de la commande'
      });
    }
  }

  /**
   * GET /api/orders/:orderId/transitions - Obtenir les transitions possibles
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getOrderTransitions(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { 
          orderId: orderId,
          userId: userId
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          orderId: order.orderId,
          currentStatus: order.status,
          availableTransitions: order.getAvailableTransitions(),
          allStatuses: Object.values(Order.STATUS),
          isModifiable: order.isModifiable(),
          isCompleted: order.isCompleted()
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des transitions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * GET /api/orders/statuses - Obtenir tous les statuts disponibles
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getAvailableStatuses(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          statuses: Object.values(Order.STATUS),
          transitions: Order.VALID_TRANSITIONS,
          statusDescriptions: {
            [Order.STATUS.PENDING]: 'En attente de confirmation',
            [Order.STATUS.CONFIRMED]: 'Confirmée et en préparation',
            [Order.STATUS.SHIPPED]: 'Expédiée',
            [Order.STATUS.DELIVERED]: 'Livrée'
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = OrderController;