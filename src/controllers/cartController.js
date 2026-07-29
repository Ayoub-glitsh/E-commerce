const { Cart, CartItem, Product } = require('../../models');

/**
 * Contrôleur pour la gestion du panier
 * Implémente les 5 fonctions métier avec relation 1-N CartItem
 */

// Fonction helper pour trouver le panier par userId
const findByUserId = async (userId) => {
  return await Cart.findOne({
    where: { userId: userId },
    include: [{
      model: CartItem,
      as: 'items',
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'imageUrl']
      }]
    }],
    order: [[{ model: CartItem, as: 'items' }, 'created_at', 'ASC']]
  });
};

// 1. Récupérer le panier de l'utilisateur connecté
const getCart = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT

    let cart = await findByUserId(userId);

    // Si aucun panier n'existe, créer un panier vide
    if (!cart) {
      cart = await Cart.create({
        userId: userId
      });
      
      // Recharger avec les associations
      cart = await findByUserId(userId);
    }

    res.status(200).json({
      success: true,
      data: {
        userId: cart.userId,
        items: cart.items || [],
        createdAt: cart.created_at,
        updatedAt: cart.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur interne du serveur"
    });
  }
};

// 2. Ajouter un produit au panier
const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT
    const { product_id, quantity } = req.body;

    // Validation : product_id doit être un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!product_id || !uuidRegex.test(product_id)) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID invalide (UUID requis)" 
      });
    }

    // Validation : quantité doit être strictement positive
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ 
        success: false,
        message: "La quantité doit être un entier supérieur à 0" 
      });
    }

    // Vérifier que le produit existe
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    const price = parseFloat(product.price);

    let cart = await findByUserId(userId);

    // Créer le panier s'il n'existe pas
    if (!cart) {
      cart = await Cart.create({
        userId: userId
      });
    }

    // Chercher si le produit existe déjà dans le panier
    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId: product_id
      }
    });

    if (existingItem) {
      // Produit existe déjà : incrémenter la quantité
      await existingItem.update({
        quantity: existingItem.quantity + quantity
      });
    } else {
      // Produit n'existe pas : l'ajouter
      await CartItem.create({
        cartId: cart.id,
        productId: product_id,
        quantity: quantity,
        price: price
      });
    }

    // Récupérer le panier mis à jour
    const updatedCart = await findByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        userId: updatedCart.userId,
        items: updatedCart.items,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur interne du serveur" 
    });
  }
};

// 3. Modifier la quantité d'un produit spécifique
const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT
    const product_id = req.params.product_id;
    const { quantity } = req.body;

    // Validation : product_id doit être un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(product_id)) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID invalide (UUID requis)" 
      });
    }

    // Validation : quantité doit être strictement positive
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ 
        success: false,
        message: "La quantité doit être un entier supérieur à 0" 
      });
    }

    const cart = await findByUserId(userId);

    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: "Panier non trouvé" 
      });
    }

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId: product_id
      }
    });

    if (!existingItem) {
      return res.status(404).json({ 
        success: false,
        message: "Produit non trouvé dans le panier" 
      });
    }

    // Mettre à jour la quantité
    await existingItem.update({ quantity: quantity });

    // Récupérer le panier mis à jour
    const updatedCart = await findByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        userId: updatedCart.userId,
        items: updatedCart.items,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur lors de la modification de quantité:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur interne du serveur" 
    });
  }
};

// 4. Retirer un produit spécifique du panier
const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT
    const product_id = req.params.product_id;

    // Validation : product_id doit être un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(product_id)) {
      return res.status(400).json({ 
        success: false,
        message: "Product ID invalide (UUID requis)" 
      });
    }

    const cart = await findByUserId(userId);

    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: "Panier non trouvé" 
      });
    }

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId: product_id
      }
    });

    if (!existingItem) {
      return res.status(404).json({ 
        success: false,
        message: "Produit non trouvé dans le panier" 
      });
    }

    // Supprimer l'article
    await existingItem.destroy();

    // Récupérer le panier mis à jour
    const updatedCart = await findByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        userId: updatedCart.userId,
        items: updatedCart.items,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur interne du serveur" 
    });
  }
};

// 5. Vider complètement le panier
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT

    let cart = await findByUserId(userId);

    if (!cart) {
      // Créer un panier vide s'il n'existe pas
      cart = await Cart.create({
        userId: userId
      });
      
      // Recharger avec les associations
      cart = await findByUserId(userId);
    } else {
      // Supprimer tous les items
      await CartItem.destroy({
        where: { cartId: cart.id }
      });
    }

    // Récupérer le panier vide
    const emptyCart = await findByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        userId: emptyCart.userId,
        items: emptyCart.items,
        createdAt: emptyCart.created_at,
        updatedAt: emptyCart.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur lors du vidage du panier:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur interne du serveur" 
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  findByUserId // Export pour tests
};
