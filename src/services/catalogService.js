const axios = require('axios');

/**
 * Service pour l'intégration avec l'API Catalogue
 * 
 * Ce service permet de vérifier les stocks et récupérer les prix
 * actuels depuis l'API Catalogue lors des opérations panier
 */

class CatalogService {
  
  constructor() {
    this.baseURL = process.env.CATALOG_API_URL || 'http://localhost:3000/api';
    this.timeout = parseInt(process.env.CATALOG_API_TIMEOUT) || 5000; // 5 secondes par défaut
    
    // Configuration axios pour l'API Catalogue
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'E-commerce-Cart-Service/1.0'
      }
    });
    
    // Cache simple en mémoire pour les produits (TTL: 5 minutes)
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes en millisecondes
  }
  
  /**
   * Récupérer un produit depuis l'API Catalogue
   * 
   * @param {string} productId - UUID du produit
   * @returns {Promise<Object>} Données du produit avec stock et prix
   * @throws {Error} Si le produit n'existe pas ou est indisponible
   */
  async getProduct(productId) {
    try {
      // Validation de l'UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!productId || !uuidRegex.test(productId)) {
        throw new Error('ID de produit invalide');
      }
      
      // Vérifier le cache d'abord
      const cacheKey = `product:${productId}`;
      const cached = this.getCachedProduct(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Appel à l'API Catalogue
      console.log(`📦 Appel API Catalogue: GET /products/${productId}`);
      
      const response = await this.client.get(`/products/${productId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Réponse API invalide');
      }
      
      const product = response.data.data.product;
      
      // Validation des données requises
      if (!product || !product.id) {
        throw new Error('Données produit invalides');
      }
      
      if (typeof product.price !== 'number' || product.price < 0) {
        throw new Error('Prix produit invalide');
      }
      
      if (typeof product.stock !== 'number' || product.stock < 0) {
        throw new Error('Stock produit invalide');
      }
      
      if (!product.isActive) {
        throw new Error('Produit inactif ou indisponible');
      }
      
      // Formatage des données pour le panier
      const formattedProduct = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        isActive: product.isActive,
        description: product.description,
        images: product.images || [],
        category: product.category,
        ratingAvg: parseFloat(product.ratingAvg || 0),
        updatedAt: product.updatedAt
      };
      
      // Mise en cache
      this.setCachedProduct(cacheKey, formattedProduct);
      
      console.log(`✅ Produit récupéré: ${product.name} - Prix: ${product.price}€ - Stock: ${product.stock}`);
      
      return formattedProduct;
      
    } catch (error) {
      // Gestion des erreurs spécifiques
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Erreur API Catalogue';
        
        if (status === 404) {
          throw new Error('Produit non trouvé dans le catalogue');
        } else if (status >= 500) {
          throw new Error('Service catalogue temporairement indisponible');
        } else {
          throw new Error(`Erreur catalogue: ${message}`);
        }
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('Service catalogue inaccessible');
      } else {
        console.error('Erreur CatalogService.getProduct:', error);
        throw new Error(error.message || 'Erreur lors de la récupération du produit');
      }
    }
  }
  
  /**
   * Vérifier la disponibilité du stock pour un produit
   * 
   * @param {string} productId - UUID du produit
   * @param {number} requestedQuantity - Quantité demandée
   * @returns {Promise<Object>} Résultat de vérification avec détails
   */
  async checkStockAvailability(productId, requestedQuantity) {
    try {
      const product = await this.getProduct(productId);
      
      const available = product.stock >= requestedQuantity;
      const shortfall = available ? 0 : requestedQuantity - product.stock;
      
      return {
        available,
        product,
        requestedQuantity,
        availableStock: product.stock,
        shortfall
      };
      
    } catch (error) {
      throw new Error(`Vérification stock impossible: ${error.message}`);
    }
  }
  
  /**
   * Alias pour checkStockAvailability (compatibilité)
   */
  async checkStock(productId, requestedQuantity) {
    return await this.checkStockAvailability(productId, requestedQuantity);
  }
  
  /**
   * Vérifier le stock pour plusieurs produits
   * 
   * @param {Array} items - Array de { productId, quantity }
   * @returns {Promise<Object>} Résultat de la vérification pour chaque produit
   */
  async checkMultipleStock(items) {
    try {
      const results = {};
      const errors = [];
      
      // Vérification en parallèle pour de meilleures performances
      const checkPromises = items.map(async (item) => {
        try {
          const result = await this.checkStock(item.productId, item.quantity);
          results[item.productId] = result;
        } catch (error) {
          errors.push({
            productId: item.productId,
            error: error.message
          });
        }
      });
      
      await Promise.all(checkPromises);
      
      return {
        results,
        errors,
        hasErrors: errors.length > 0
      };
      
    } catch (error) {
      throw new Error(`Vérification multiple impossible: ${error.message}`);
    }
  }
  
  /**
   * Récupérer un produit depuis le cache
   * 
   * @param {string} cacheKey - Clé de cache
   * @returns {Object|null} Produit en cache ou null si expiré/inexistant
   */
  getCachedProduct(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    console.log(`🚀 Produit récupéré depuis le cache: ${cacheKey}`);
    return cached.data;
  }
  
  /**
   * Mettre un produit en cache
   * 
   * @param {string} cacheKey - Clé de cache
   * @param {Object} product - Données du produit
   */
  setCachedProduct(cacheKey, product) {
    this.cache.set(cacheKey, {
      data: product,
      timestamp: Date.now()
    });
    
    // Nettoyage périodique du cache (simple LRU)
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Vider le cache (utile pour les tests)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache catalogue vidé');
  }
  
  /**
   * Statistiques du cache
   * 
   * @returns {Object} Statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 1000,
      ttl: this.cacheTTL
    };
  }
  
  /**
   * Vérifier la santé du service catalogue
   * 
   * @returns {Promise<Object>} Statut du service
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      const response = await this.client.get('/health');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        baseURL: this.baseURL,
        cache: this.getCacheStats()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        baseURL: this.baseURL,
        cache: this.getCacheStats()
      };
    }
  }
}

// Singleton instance
const catalogService = new CatalogService();

module.exports = catalogService;