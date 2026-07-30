const express = require('express');
const OrderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Routes de gestion des commandes avec machine à états
 * FonctionnalitéHaute#1777
 * 
 * Base URL: /api/orders
 * Toutes les routes requièrent une authentification JWT
 */

/**
 * @route   POST /api/orders
 * @desc    Créer une nouvelle commande depuis le panier utilisateur
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @body    {
 *            shippingAddress?: object,
 *            billingAddress?: object,
 *            paymentMethod?: string,
 *            notes?: string
 *          }
 * @returns {
 *            success: boolean,
 *            message: string,
 *            data: {
 *              orderId: string,
 *              id: string,
 *              status: "pending",
 *              totalAmount: number,
 *              itemsCount: number,
 *              items: array,
 *              availableTransitions: array,
 *              createdAt: datetime
 *            }
 *          }
 * 
 * Comportement:
 * - Copie tous les items du panier vers une nouvelle commande
 * - Calcule le montant total automatiquement
 * - Génère un orderId unique (ex: ORD-ABC123-DEF456)
 * - Initialise le statut à "pending"
 * - Vide le panier après création réussie
 * - Retourne les transitions disponibles depuis "pending"
 */
router.post('/', verifyToken, OrderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Lister les commandes de l'utilisateur connecté
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @query   {
 *            status?: "pending"|"confirmed"|"shipped"|"delivered",
 *            limit?: number (default: 50),
 *            offset?: number (default: 0)
 *          }
 * @returns {
 *            success: boolean,
 *            data: {
 *              orders: array,
 *              pagination: object
 *            }
 *          }
 * 
 * Comportement:
 * - Filtre par statut si spécifié
 * - Trie par date de création (plus récentes en premier)
 * - Pagination avec limit/offset
 * - Inclut les transitions disponibles pour chaque commande
 */
router.get('/', verifyToken, OrderController.getUserOrders);

/**
 * @route   GET /api/orders/statuses
 * @desc    Obtenir tous les statuts disponibles et leurs transitions
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @returns {
 *            success: boolean,
 *            data: {
 *              statuses: array,
 *              transitions: object,
 *              statusDescriptions: object
 *            }
 *          }
 * 
 * Utile pour construire des interfaces utilisateur avec les statuts valides
 */
router.get('/statuses', verifyToken, OrderController.getAvailableStatuses);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Récupérer une commande spécifique par son orderId
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @params  { orderId: string } (ex: ORD-ABC123-DEF456)
 * @returns {
 *            success: boolean,
 *            data: {
 *              orderId: string,
 *              id: string,
 *              status: string,
 *              totalAmount: number,
 *              items: array,
 *              shippingAddress: object,
 *              billingAddress: object,
 *              paymentMethod: string,
 *              trackingNumber: string,
 *              notes: string,
 *              availableTransitions: array,
 *              isModifiable: boolean,
 *              isCompleted: boolean,
 *              user: object,
 *              createdAt: datetime,
 *              updatedAt: datetime
 *            }
 *          }
 * 
 * Comportement:
 * - Vérifie que la commande appartient à l'utilisateur connecté
 * - Inclut tous les détails de la commande
 * - Retourne les transitions disponibles
 */
router.get('/:orderId', verifyToken, OrderController.getOrderById);

/**
 * @route   GET /api/orders/:orderId/transitions
 * @desc    Obtenir les transitions possibles pour une commande spécifique
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @params  { orderId: string }
 * @returns {
 *            success: boolean,
 *            data: {
 *              orderId: string,
 *              currentStatus: string,
 *              availableTransitions: array,
 *              allStatuses: array,
 *              isModifiable: boolean,
 *              isCompleted: boolean
 *            }
 *          }
 * 
 * Utile pour des interfaces utilisateur dynamiques qui s'adaptent
 * aux actions possibles selon l'état actuel de la commande
 */
router.get('/:orderId/transitions', verifyToken, OrderController.getOrderTransitions);

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Mettre à jour le statut d'une commande (machine à états)
 * @access  Private (JWT required)
 * @headers Authorization: Bearer <accessToken>
 * @params  { orderId: string }
 * @body    { newStatus: "pending"|"confirmed"|"shipped"|"delivered" }
 * @returns {
 *            success: boolean,
 *            message: string,
 *            data: {
 *              orderId: string,
 *              previousStatus: string,
 *              currentStatus: string,
 *              availableTransitions: array,
 *              trackingNumber?: string,
 *              updatedAt: datetime
 *            }
 *          }
 * 
 * Machine à États (Transitions Valides):
 * - pending → confirmed
 * - confirmed → shipped  
 * - shipped → delivered
 * - delivered → [] (état final)
 * 
 * Comportement:
 * - Valide que la transition est autorisée selon la machine à états
 * - Rejette avec erreur 400 les transitions invalides
 * - Génère automatiquement un trackingNumber si passage à "shipped"
 * - Ajoute des notes automatiques pour certains statuts
 * 
 * Erreurs Possibles:
 * - 400: Statut invalide ou transition non autorisée
 * - 404: Commande non trouvée
 * - 401: Token manquant/invalide
 */
router.put('/:orderId/status', verifyToken, OrderController.updateOrderStatus);

module.exports = router;