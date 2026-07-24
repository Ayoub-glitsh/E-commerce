const { Product, Category } = require('../../models');
const { Op } = require('sequelize');

/**
 * Contrôleur simplifié du catalogue
 */

class CatalogSimpleController {

  /**
   * GET /api/products - Liste des produits simplifiée
   */
  static async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categoryId
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const offset = (pageNum - 1) * limitNum;

      // Construction des conditions WHERE simples
      const whereConditions = {
        isActive: true
      };

      // Filtre par catégorie
      if (categoryId) {
        whereConditions.categoryId = categoryId;
      }

      // Filtre de recherche textuelle
      if (search && search.trim()) {
        const searchTerm = search.trim();
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ];
      }

      // Requête avec inclusion de catégorie
      const result = await Product.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'description']
          }
        ],
        attributes: ['id', 'name', 'description', 'price', 'stock', 'categoryId', 'images', 'tags', 'isActive'],
        order: [['created_at', 'DESC']],
        limit: limitNum,
        offset: offset,
        distinct: true
      });

      // Formatage de la réponse avec catégorie
      const formattedProducts = result.rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        stock: product.stock,
        images: product.images || [],
        tags: product.tags || [],
        isActive: product.isActive,
        categoryId: product.categoryId,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          description: product.category.description
        } : null
      }));

      const totalPages = Math.ceil(result.count / limitNum);

      res.status(200).json({
        success: true,
        data: {
          products: formattedProducts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.count,
            pages: totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des produits',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/products/:id - Détail d'un produit
   */
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      // Validation de l'UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de produit invalide'
        });
      }

      const product = await Product.findOne({
        where: { 
          id,
          isActive: true
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'description']
          }
        ],
        attributes: ['id', 'name', 'description', 'price', 'stock', 'images', 'tags', 'isActive']
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé ou inactif'
        });
      }

      const formattedProduct = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        stock: product.stock,
        images: product.images || [],
        tags: product.tags || [],
        isActive: product.isActive,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          description: product.category.description
        } : null
      };

      res.status(200).json({
        success: true,
        data: {
          product: formattedProduct
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du produit',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /api/categories - Liste des catégories
   */
  static async getCategories(req, res) {
    try {
      const categories = await Category.findAll({
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']]
      });

      const formattedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description
      }));

      res.status(200).json({
        success: true,
        data: {
          categories: formattedCategories
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des catégories',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = CatalogSimpleController;