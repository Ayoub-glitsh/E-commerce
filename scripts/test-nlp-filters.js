    require('dotenv').config();
    const { extractFiltersFromQuery } = require('../src/services/nlpFilterService');

    // 5 requêtes réelles couvrant différents cas : prix, tags multiples,
    // catégorie seule, formulation FR variée, produit non lié à l'électronique.
    const TEST_QUERIES = [
    'laptop moins de 500 euros',
    'souris sans fil rapide',
    'écran 4K pas cher',
    'clavier mécanique RGB pour gaming',
    'un t-shirt en coton bio pour moins de 30 euros'
    ];

    function printResult(query, result) {
    console.log(`Requête : "${query}"`);
    console.log(`  category  : ${result.category === null ? 'null' : `"${result.category}"`}`);
    console.log(`  max_price : ${result.max_price === null ? 'null' : result.max_price}`);
    console.log(`  tags      : [${result.tags.map((t) => `"${t}"`).join(', ')}]`);
    console.log();
    }

    async function main() {
    console.log(' Test de extractFiltersFromQuery() avec 5 requêtes réelles');
    console.log('==============================================================\n');

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key-here') {
        console.error(' GROQ_API_KEY non configurée dans .env');
        process.exit(1);
    }

    let successCount = 0;

    for (const query of TEST_QUERIES) {
        try {
        const result = await extractFiltersFromQuery(query);
        printResult(query, result);

        // Validation basique de la structure retournée
        const hasValidShape =
            (result.category === null || typeof result.category === 'string') &&
            (result.max_price === null || typeof result.max_price === 'number') &&
            Array.isArray(result.tags);

        if (hasValidShape) {
            successCount++;
        } else {
            console.log('    Structure de réponse invalide\n');
        }
        } catch (error) {
        console.error(`   Erreur pour cette requête : ${error.message}\n`);
        }
    }

    console.log('==============================================================');
    console.log(`${successCount}/${TEST_QUERIES.length} requêtes traitées avec une structure valide`);
    }

    main();