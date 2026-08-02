    const { Op } = require('sequelize');
    const { Product, Category } = require('../../models');

    /*
      Service de recherche produits
     
      - filterProducts(filters) : applique des filtres structurés
        { category, max_price, tags } issus de l'extraction NLP (Groq)
      - classicSearch(query) : recherche texte classique (fallback si Groq échoue)
     */

    const DEFAULT_LIMIT = 20;


    async function filterProducts(filters, limit = DEFAULT_LIMIT) {
    const { category, max_price, tags } = filters || {};

    const priceCondition = {};
    if (max_price !== null && max_price !== undefined && !isNaN(max_price)) {
        priceCondition.price = { [Op.lte]: max_price };
    }

    const includeConditions = [
        { model: Category, as: 'category', attributes: ['id', 'name'] }
    ];

    const allCandidates = await Product.findAll({
        where: { isActive: true, ...priceCondition },
        include: includeConditions,
        order: [['ratingAvg', 'DESC'], ['ratingCount', 'DESC']]
    });

    const matchesCategory = (product, term) => {
        const lowerTerm = term.toLowerCase();
        const nameMatch = (product.name || '').toLowerCase().includes(lowerTerm);
        const descMatch = (product.description || '').toLowerCase().includes(lowerTerm);
        const categoryNameMatch = product.category
        ? product.category.name.toLowerCase().includes(lowerTerm)
        : false;
        const tagsMatch = Array.isArray(product.tags)
        ? product.tags.some((tag) => tag.toLowerCase().includes(lowerTerm))
        : false;
        return nameMatch || descMatch || categoryNameMatch || tagsMatch;
    };

    let candidates = allCandidates;
    let categoryRelaxed = false;

    if (category) {
        const strictMatches = allCandidates.filter((p) => matchesCategory(p, category));

        if (strictMatches.length > 0) {
        candidates = strictMatches;
        } else {
        categoryRelaxed = true;
        candidates = allCandidates;
        }
    }

    if (Array.isArray(tags) && tags.length > 0) {
        const normalizedTargetTags = tags.map((t) => t.toLowerCase().trim());

        candidates = candidates.filter((product) => {
        const productTags = Array.isArray(product.tags)
            ? product.tags.map((t) => t.toLowerCase().trim())
            : [];
        return normalizedTargetTags.some((tag) => productTags.includes(tag));
        });
    }

    return { products: candidates.slice(0, limit), categoryRelaxed };
    }

    async function searchProductsByText(query, limit = DEFAULT_LIMIT) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return [];
    }

    const searchTerm = query.trim();

    // On récupère tous les candidats correspondants (sans limite ici), pour
    // pouvoir ensuite les reclasser par pertinence avant de tronquer.
    const candidates = await Product.findAll({
        where: {
        isActive: true,
        [Op.or]: [
            { name: { [Op.iLike]: `%${searchTerm}%` } },
            { description: { [Op.iLike]: `%${searchTerm}%` } }
        ]
        },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
    });

    const lowerTerm = searchTerm.toLowerCase();

    const scored = candidates.map((product) => {
        const nameLower = (product.name || '').toLowerCase();
        const nameStartsWithTerm = nameLower.startsWith(lowerTerm);
        const nameContainsTerm = nameLower.includes(lowerTerm);

        // Score de pertinence : le nom compte plus que la description,
        // et un match en début de nom compte plus qu'un match au milieu.
        let relevanceScore = 0;
        if (nameStartsWithTerm) {
        relevanceScore = 3;
        } else if (nameContainsTerm) {
        relevanceScore = 2;
        } else {
        relevanceScore = 1; // ne matche que la description
        }

        return { product, relevanceScore };
    });

    // Tri : pertinence décroissante, puis popularité (note moyenne, puis nombre d'avis)
    scored.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
        }
        const ratingA = parseFloat(a.product.ratingAvg) || 0;
        const ratingB = parseFloat(b.product.ratingAvg) || 0;
        if (ratingB !== ratingA) {
        return ratingB - ratingA;
        }
        const countA = parseInt(a.product.ratingCount) || 0;
        const countB = parseInt(b.product.ratingCount) || 0;
        return countB - countA;
    });

    return scored.slice(0, limit).map((entry) => entry.product);
    }

    // Alias conservé pour compatibilité (utilisé comme fallback de la recherche NLP)
    const classicSearch = searchProductsByText;

    /* Formate un produit Sequelize pour la réponse JSON de l'API de recherche.
     */
    function formatProduct(product) {
    return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        category: product.category ? product.category.name : null,
        tags: product.tags || [],
        ratingAvg: parseFloat(product.ratingAvg || 0)
    };
    }

    module.exports = {
    filterProducts,
    searchProductsByText,
    classicSearch,
    formatProduct
    };