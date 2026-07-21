const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Contrôleur pour la gestion du panier
 * Implémente les 5 fonctions métier : récupérer, ajouter, modifier, supprimer, vider
 */

// 1. Récupérer le panier de l'utilisateur connecté
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.cart.findUnique({
      where: { userId: userId }
    });

    // Si aucun panier n'existe, créer un panier vide
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId,
          items: []
        }
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
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    // Validation : quantité doit être strictement positive
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "La quantité doit être supérieure à 0" });
    }

    if (!product_id) {
      return res.status(400).json({ error: "Product ID invalide" });
    }

    // TODO: Récupérer le prix actuel du produit depuis l'API Catalogue
    // Pour l'instant, on utilise un prix par défaut
    const price = 10.00; // À remplacer par appel API Catalogue

    let cart = await prisma.cart.findUnique({
      where: { userId: userId }
    });

    // Créer le panier s'il n'existe pas
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId,
          items: []
        }
      });
    }

    let items = cart.items || [];
    
    // Chercher si le produit existe déjà dans le panier
    const existingItemIndex = items.findIndex(item => item.product_id === product_id);

    if (existingItemIndex !== -1) {
      // Produit existe déjà : incrémenter la quantité
      items[existingItemIndex].quantity += quantity;
    } else {
      // Produit n'existe pas : l'ajouter
      items.push({
        product_id: product_id,
        quantity: quantity,
        price: price
      });
    }

    // Mettre à jour le panier
    cart = await prisma.cart.update({
      where: { userId: userId },
      data: { items: items }
    });

    res.status(200).json({
      userId: cart.userId,
      items: cart.items,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// 3. Modifier la quantité d'un produit spécifique
const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const product_id = parseInt(req.params.product_id);
    const { quantity } = req.body;

    // Validation : quantité doit être strictement positive
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "La quantité doit être supérieure à 0" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: userId }
    });

    if (!cart) {
      return res.status(404).json({ error: "Panier non trouvé" });
    }

    let items = cart.items || [];
    const itemIndex = items.findIndex(item => item.product_id === product_id);

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Produit non trouvé dans le panier" });
    }

    // Mettre à jour la quantité
    items[itemIndex].quantity = quantity;

    // Sauvegarder les changements
    const updatedCart = await prisma.cart.update({
      where: { userId: userId },
      data: { items: items }
    });

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
    const userId = req.user.id;
    const product_id = parseInt(req.params.product_id);

    const cart = await prisma.cart.findUnique({
      where: { userId: userId }
    });

    if (!cart) {
      return res.status(404).json({ error: "Panier non trouvé" });
    }

    let items = cart.items || [];
    const itemIndex = items.findIndex(item => item.product_id === product_id);

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Produit non trouvé dans le panier" });
    }

    // Retirer l'article du tableau
    items.splice(itemIndex, 1);

    // Sauvegarder les changements
    const updatedCart = await prisma.cart.update({
      where: { userId: userId },
      data: { items: items }
    });

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
    const userId = req.user.id;

    const cart = await prisma.cart.findUnique({
      where: { userId: userId }
    });

    if (!cart) {
      // Créer un panier vide s'il n'existe pas
      const newCart = await prisma.cart.create({
        data: {
          userId: userId,
          items: []
        }
      });

      return res.status(200).json({
        userId: newCart.userId,
        items: newCart.items,
        createdAt: newCart.createdAt,
        updatedAt: newCart.updatedAt
      });
    }

    // Vider le panier (items = [])
    const updatedCart = await prisma.cart.update({
      where: { userId: userId },
      data: { items: [] }
    });

    res.status(200).json({
      userId: updatedCart.userId,
      items: updatedCart.items,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt
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
  clearCart
};