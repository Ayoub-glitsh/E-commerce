const { sequelize, Product } = require('../models');
const { getSimilarProducts } = require('../src/services/similarityService');

(async () => {
  try {
    await sequelize.authenticate();
    console.log(' Connexion à la base réussie');

    // Jib awwel produit actif
    const product = await Product.findOne({
      where: { isActive: true }
    });

    if (!product) {
      console.log(' Aucun produit actif trouvé');
      process.exit(0);
    }

    console.log('Produit testé :', product.name);
    console.log('ID :', product.id);

    const result = await getSimilarProducts(product.id);

    console.log('\n=== Produits similaires ===');

    result.similarProducts.forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.product.name} | Score: ${item.score} | Prix: ${item.product.price}`
      );
    });

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
})();