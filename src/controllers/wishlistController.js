const { Wishlist, WishlistItem, Product, Category } = require('../../models');

/**
 * Contrôleur pour la gestion de la wishlist (favoris)
 * 
 * Fonctionnalités:
 * - GET /wishlist : Récupérer la wishlist utilisateur
 * - POST /wishlist : Ajouter un produit aux favoris
 * - DELETE /wishlist/:productId : Retirer un produit des favoris
 */

class WishlistController {

  /**
   * Fonction helper pour trouver la wishlist par userId
   * 
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<Object|null>} Wishlist avec items ou null
   */
  static async findByUserId(userId) {
    return await Wishlist.findOne({
      where: { userId: userId },
      include: [{
        model: WishlistItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'description']
          }],
          attributes: ['id', 'name', 'description', 'price', 'stock', 'images', 'tags', 'isActive', 'ratingAvg', 'ratingCount']
        }],
        order: [['added_at', 'DESC']] // Les plus récents en premier
      }]
    });
  }

  /**
   * GET /api/wishlist - Récupérer la wishlist de l'utilisateur connecté
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getWishlist(req, res) {
    try {
      const userId = req.user.id; // Récupéré du token JWT

      let wishlist = await WishlistController.findByUserId(userId);

      // Si aucune wishlist n'existe, créer une wishlist vide
      if (!wishlist) {
        wishlist = await Wishlist.create({
          userId: userId
        });
        
        // Recharger avec les associations
        wishlist = await WishlistController.findByUserId(userId);
      }

      // Formatage de la réponse avec informations enrichies
      const formattedItems = wishlist.items.map(item => ({
        id: item.id,
        productId: item.productId,
        addedAt: item.addedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: parseFloat(item.product.price),
          stock: item.product.stock,
          images: item.product.images || [],
          tags: item.product.tags || [],
          isActive: item.product.isActive,
          ratingAvg: parseFloat(item.product.ratingAvg || 0),
          ratingCount: item.product.ratingCount || 0,
          category: item.product.category ? {
            id: item.product.category.id,
            name: item.product.category.name,
            description: item.product.category.description
          } : null
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          wishlistId: wishlist.id,
          userId: wishlist.userId,
          itemsCount: formattedItems.length,
          items: formattedItems,
          createdAt: wishlist.created_at,
          updatedAt: wishlist.updated_at
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de la wishlist:', error);
      res.status(500).json({ 
        success: false,
        message: "Erreur interne du serveur lors de la récupération des favoris"
      });
    }
  }

  /**
   * POST /api/wishlist - Ajouter un produit à la wishlist
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async addToWishlist(req, res) {
    try {
      const userId = req.user.id; // Récupéré du token JWT
      const { productId } = req.body;

      // Validation : productId doit être un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!productId || !uuidRegex.test(productId)) {
        return res.status(400).json({ 
          success: false,
          message: "Product ID invalide (UUID requis)" 
        });
      }

// Vérifier que le produit existe et est actif directement en base
      console.log(`🎯 Ajout aux favoris: Vérification produit ${productId}`);
      
      let catalogProduct;
      try {
        catalogProduct = await Product.findOne({
          where: { id: productId },
          attributes: ['id', 'name', 'price', 'images', 'isActive', 'stock']
        });

        if (!catalogProduct) {
          return res.status(404).json({
            success: false,
            message: "Produit non trouvé dans le catalogue"
          });
        }

        if (!catalogProduct.isActive) {
          return res.status(400).json({
            success: false,
            message: "Ce produit n'est plus disponible et ne peut être ajouté aux favoris"
          });
        }

        // Formater comme attendu par le reste du contrôleur
        catalogProduct = {
          id: catalogProduct.id,
          name: catalogProduct.name,
          price: parseFloat(catalogProduct.price),
          images: catalogProduct.images || [],
          isActive: catalogProduct.isActive
        };

      } catch (error) {
        console.error('Erreur lors de la vérification du produit:', error);
        return res.status(400).json({
          success: false,
          message: error.message || "Produit non trouvé dans le catalogue"
        });
      }

      let wishlist = await WishlistController.findByUserId(userId);

      // Créer la wishlist si elle n'existe pas
      if (!wishlist) {
        wishlist = await Wishlist.create({
          userId: userId
        });
      }

      // Vérifier si le produit n'est pas déjà dans la wishlist (éviter les doublons)
      const existingItem = await WishlistItem.findOne({
        where: {
          wishlistId: wishlist.id,
          productId: productId
        }
      });

      if (existingItem) {
        return res.status(409).json({
          success: false,
          message: "Ce produit est déjà dans vos favoris",
          data: {
            productId: productId,
            productName: catalogProduct.name,
            addedAt: existingItem.addedAt
          }
        });
      }

      // Ajouter le produit à la wishlist
      await WishlistItem.create({
        wishlistId: wishlist.id,
        productId: productId,
        addedAt: new Date()
      });

      console.log(`✅ Produit ajouté aux favoris: ${catalogProduct.name}`);

      // Récupérer la wishlist mise à jour
      const updatedWishlist = await WishlistController.findByUserId(userId);
      
      // Trouver l'item ajouté pour la réponse
      const addedItem = updatedWishlist.items.find(item => item.productId === productId);

      res.status(201).json({
        success: true,
        message: `${catalogProduct.name} ajouté aux favoris avec succès`,
        data: {
          wishlistId: updatedWishlist.id,
          itemsCount: updatedWishlist.items.length,
          addedItem: {
            id: addedItem.id,
            productId: addedItem.productId,
            addedAt: addedItem.addedAt,
            product: {
              id: catalogProduct.id,
              name: catalogProduct.name,
              price: catalogProduct.price,
              images: catalogProduct.images
            }
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      
      // Gestion des erreurs de contrainte unique (doublon)
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Ce produit est déjà dans vos favoris"
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: "Erreur interne du serveur lors de l'ajout aux favoris"
      });
    }
  }

  /**
   * DELETE /api/wishlist/:productId - Retirer un produit de la wishlist
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async removeFromWishlist(req, res) {
    try {
      const userId = req.user.id; // Récupéré du token JWT
      const { productId } = req.params;

      // Validation : productId doit être un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        return res.status(400).json({ 
          success: false,
          message: "Product ID invalide (UUID requis)" 
        });
      }

      const wishlist = await WishlistController.findByUserId(userId);

      if (!wishlist) {
        return res.status(404).json({ 
          success: false,
          message: "Aucune liste de favoris trouvée" 
        });
      }

      // Chercher l'item dans la wishlist
      const existingItem = await WishlistItem.findOne({
        where: {
          wishlistId: wishlist.id,
          productId: productId
        },
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name']
        }]
      });

      if (!existingItem) {
        return res.status(404).json({ 
          success: false,
          message: "Ce produit n'est pas dans vos favoris" 
        });
      }

      const productName = existingItem.product ? existingItem.product.name : 'Produit';

      // Supprimer l'item
      await existingItem.destroy();

      console.log(`🗑️ Produit retiré des favoris: ${productName}`);

      // Récupérer la wishlist mise à jour
      const updatedWishlist = await WishlistController.findByUserId(userId);

      res.status(200).json({
        success: true,
        message: `${productName} retiré des favoris avec succès`,
        data: {
          wishlistId: updatedWishlist.id,
          itemsCount: updatedWishlist.items.length,
          removedProductId: productId
        }
      });

    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error);
      res.status(500).json({ 
        success: false,
        message: "Erreur interne du serveur lors de la suppression des favoris"
      });
    }
  }

  /**
   * DELETE /api/wishlist - Vider complètement la wishlist (bonus)
   * 
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async clearWishlist(req, res) {
    try {
      const userId = req.user.id; // Récupéré du token JWT

      let wishlist = await WishlistController.findByUserId(userId);

      if (!wishlist) {
        // Créer une wishlist vide s'il n'en existe pas
        wishlist = await Wishlist.create({
          userId: userId
        });
      } else {
        // Supprimer tous les items
        await WishlistItem.destroy({
          where: { wishlistId: wishlist.id }
        });
      }

      console.log(`🧹 Favoris vidés pour l'utilisateur ${userId}`);

      res.status(200).json({
        success: true,
        message: "Liste des favoris vidée avec succès",
        data: {
          wishlistId: wishlist.id,
          itemsCount: 0,
          items: []
        }
      });

    } catch (error) {
      console.error('Erreur lors du vidage des favoris:', error);
      res.status(500).json({ 
        success: false,
        message: "Erreur interne du serveur lors du vidage des favoris"
      });
    }
  }

  /**
   * GET /api/wishlist/check/:productId - Vérifier si un produit est dans la wishlist (bonus)
   * 
   * @param {Object} req - Requête Express  
   * @param {Object} res - Réponse Express
   */
  static async checkProductInWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        return res.status(400).json({ 
          success: false,
          message: "Product ID invalide (UUID requis)" 
        });
      }

      const wishlist = await WishlistController.findByUserId(userId);
      
      if (!wishlist) {
        return res.status(200).json({
          success: true,
          data: {
            productId: productId,
            inWishlist: false
          }
        });
      }

      const existingItem = await WishlistItem.findOne({
        where: {
          wishlistId: wishlist.id,
          productId: productId
        }
      });

      res.status(200).json({
        success: true,
        data: {
          productId: productId,
          inWishlist: !!existingItem,
          addedAt: existingItem ? existingItem.addedAt : null
        }
      });

    } catch (error) {
      console.error('Erreur lors de la vérification wishlist:', error);
      res.status(500).json({ 
        success: false,
        message: "Erreur interne du serveur"
      });
    }
  }
}

module.exports = WishlistController;