    const { Op, fn, col, literal } = require('sequelize');
    const { Product, UserEvent, Category } = require('../../models');

    const DEFAULT_DAYS = 7;
    const DEFAULT_LIMIT = 10;

    async function getTrendingProducts(days = DEFAULT_DAYS, limit = DEFAULT_LIMIT) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    //  compter les vues par produit sur la fenêtre temporelle
    const viewCounts = await UserEvent.findAll({
        attributes: [
        'productId',
        [fn('COUNT', col('id')), 'viewCount']
        ],
        where: {
        eventType: 'view',
        productId: { [Op.ne]: null },
        created_at: { [Op.gte]: since }
        },
        group: ['productId'],
        order: [[literal('"viewCount"'), 'DESC']],
        limit,
        raw: true
    });

    if (viewCounts.length === 0) {
        return [];
    }

    // récupérer les détails des produits correspondants
    const productIds = viewCounts.map((row) => row.productId);
    const products = await Product.findAll({
        where: { id: productIds, isActive: true },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });

    const productById = new Map(products.map((p) => [p.id, p]));

    //  recomposer la liste dans l'ordre du classement (nombre de vues
    // décroissant), en ignorant les produits désactivés/supprimés entre-temps
    const trending = viewCounts
        .filter((row) => productById.has(row.productId))
        .map((row) => ({
        product: productById.get(row.productId),
        viewCount: parseInt(row.viewCount, 10)
        }));

    return trending;
    }

    module.exports = {
    getTrendingProducts,
    DEFAULT_DAYS,
    DEFAULT_LIMIT
    };