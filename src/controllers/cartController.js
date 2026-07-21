const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Contrôleur pour la gestion du panier
 * Implémente les 5 fonctions métier avec relation 1-N CartItem
 */

// Fonction helper pour trouver le panier par userId
const findByUserId = async (userId) => {
  return await prisma.cart.findUnique({
    where: { userId: userId },
    include: { 
      items: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
};

// 1. Récupérer le panier de l'utilisateur connecté
const getCart = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT

    let cart = await findByUserId(userId);

    // Si aucun panier n'existe, créer un panier vide
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId },
        include: { items: true }
      });
    }

    res.status(200).json({
      userId: cart.userId,
      items: cart.items,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
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
      return res.status(400).json({ error: "Product ID invalide (UUID requis)" });
    }

    // Validation : quantité doit être strictement positive
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: "La quantité doit être un entier supérieur à 0" });
    }

    // TODO: Récupérer le prix actuel du produit depuis l'API Catalogue
    const price = 10.00; // À remplacer par appel API Catalogue

    let cart = await findByUserId(userId);

    // Créer le panier s'il n'existe pas
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId },
        include: { items: true }
      });
    }

    // Chercher si le produit existe déjà dans le panier
    const existingItem = cart.items.find(item => item.productId === product_id);

    if (existingItem) {
      // Produit existe déjà : incrémenter la quantité
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      // Produit n'existe pas : l'ajouter
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product_id,
          quantity: quantity,
          price: price
        }
      });
    }

    // Récupérer le panier mis à jour
    const updatedCart = await findByUserId(userId);

    res.status(200).json({
      userId: updatedCart.userId,
      items: updatedCart.items,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
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
      return res.status(400).json({ error: "Product ID invalide (UUID requis)" });
    }

    // Validation : quantité doit être strictement positive
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: "La quantité doit être un entier supérieur à 0" });
    }

    const cart = await findByUserId(userId);

    if (!cart) {
      return res.status(404).json({ error: "Panier non trouvé" });
    }

    const existingItem = cart.items.find(item => item.productId === product_id);

    if (!existingItem) {
      return res.status(404).json({ error: "Produit non trouvé dans le panier" });
    }

    // Mettre à jour la quantité
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: quantity }
    });

    // Récupérer le panier mis à jour
    const updatedCart = await findByUserId(userId);

    res.status(200).json({
      userId: updatedCart.userId,
      items: updatedCart.items,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de la modification de quantité:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
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
      return res.status(400).json({ error: "Product ID invalide (UUID requis)" });
    }

    const cart = await findByUserId(userId);

    if (!cart) {
      return res.status(404).json({ error: "Panier non trouvé" });
    }

    const existingItem = cart.items.find(item => item.productId === product_id);

    if (!existingItem) {
      return res.status(404).json({ error: "Produit non trouvé dans le panier" });
    }

    // Supprimer l'article (onDelete: Cascade gère automatiquement)
    await prisma.cartItem.delete({
      where: { id: existingItem.id }
    });

    // Récupérer le panier mis à jour
    const updatedCart = await findByUserId(userId);

    res.status(200).json({
      userId: updatedCart.userId,
      items: updatedCart.items,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// 5. Vider complètement le panier
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré du token JWT

    let cart = await findByUserId(userId);

    if (!cart) {
      // Créer un panier vide s'il n'existe pas
      cart = await prisma.cart.create({
        data: { userId: userId },
        include: { items: true }
      });
    } else {
      // Supprimer tous les items (onDelete: Cascade)
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    // Récupérer le panier vide
    const emptyCart = await findByUserId(userId);

    res.status(200).json({
      userId: emptyCart.userId,
      items: emptyCart.items,
      createdAt: emptyCart.createdAt,
      updatedAt: emptyCart.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors du vidage du panier:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
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