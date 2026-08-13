'use strict';

const { Product, Category } = require('../../models');

/**
 * Service de récupération et formatage du catalogue produits pour le chatbot IA
 *
 * FonctionnalitéHaute #1670 - Prompt système avec contexte produit
 *
 * Ce service interroge la base de données (via Sequelize) pour récupérer les
 * produits actifs les plus pertinents, puis les formate en un texte lisible
 * en français, prêt à être injecté dans le prompt système du chatbot.
 */

// Nombre maximum de produits injectés dans le contexte du chatbot
const MAX_CATALOG_PRODUCTS = 20;

// Devise utilisée pour l'affichage des prix dans le catalogue
const CURRENCY = 'MAD';

// Message de fallback renvoyé si la requête échoue
const FALLBACK_CATALOG_TEXT =
  'Le catalogue est temporairement indisponible. Veuillez rediriger le client vers le support humain pour toute demande concernant les produits, les prix ou les stocks.';

/**
 * Récupérer le nom de la catégorie d'un produit (gère raw: true et instances Sequelize).
 *
 * Avec `raw: true`, les colonnes de l'association sont aplaties
 * (`product['category.name']`), alors qu'une instance Sequelize expose
 * `product.category.name`.
 *
 * @param {Object} product - Produit brut (raw) ou instance Sequelize
 * @returns {string} Nom de la catégorie (ou libellé par défaut)
 */
function getCategoryName(product) {
  if (product.category && product.category.name) {
    return product.category.name;
  }
  if (product['category.name']) {
    return product['category.name'];
  }
  return 'Non catégorisé';
}

/**
 * Formater un produit brut Sequelize en objet simple et lisible
 *
 * @param {Object} product - Instance Sequelize d'un produit (avec catégorie incluse)
 * @returns {{ name: string, price: number, category: string, stock: number }}
 */
function formatProductForChatbot(product) {
  const rawPrice = product.price;
  const parsedPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;

  return {
    name: product.name,
    price: Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) / 100 : 0,
    category: getCategoryName(product),
    stock: Number.isInteger(product.stock) ? product.stock : parseInt(product.stock, 10) || 0
  };
}

/**
 * Transformer une liste de produits formatés en texte lisible (français)
 *
 * @param {Array<{ name: string, price: number, category: string, stock: number }>} products
 * @returns {string} Liste numérotée prête à être injectée dans un prompt
 */
function formatProductsAsText(products) {
  if (!products || products.length === 0) {
    return 'Le catalogue ne contient actuellement aucun produit disponible.';
  }

  const lines = products.map((product, index) => {
    const price = product.price.toFixed(2);
    return `${index + 1}. ${product.name} - ${price} ${CURRENCY} - ${product.category} - Stock: ${product.stock}`;
  });

  return lines.join('\n');
}

/**
 * Récupérer les produits actifs les plus pertinents et les formater
 * en un texte lisible prêt à être injecté dans le prompt du chatbot.
 *
 * - Filtre les produits actifs (isActive: true)
 * - Inclut la catégorie pour obtenir son nom
 * - Tri par note moyenne décroissante (pertinence), puis nom
 * - Limite à 20 produits
 * - Arrondit les prix à 2 décimales et force le stock en entier
 *
 * @async
 * @returns {Promise<string>} Texte formaté du catalogue (liste en français)
 */
async function getProductCatalogForChatbot() {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name'],
          required: false // LEFT JOIN : un produit sans catégorie reste affiché
        }
      ],
      attributes: ['name', 'price', 'stock'],
      order: [
        ['ratingAvg', 'DESC'],
        ['name', 'ASC']
      ],
      limit: MAX_CATALOG_PRODUCTS,
      raw: true
    });

    const formattedProducts = products.map(formatProductForChatbot);

    return formatProductsAsText(formattedProducts);
  } catch (error) {
    console.error('Erreur lors de la récupération du catalogue pour le chatbot:', error);
    return FALLBACK_CATALOG_TEXT;
  }
}

module.exports = {
  getProductCatalogForChatbot,
  formatProductForChatbot,
  formatProductsAsText,
  MAX_CATALOG_PRODUCTS
};

