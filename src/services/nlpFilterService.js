    const { getGroqClient, getGroqModel } = require('./groqClient');

    /**
     * Service d'extraction de filtres de recherche à partir d'une requête en
     * langage naturel (français ou anglais), via l'API Groq.
     *
     * Exemple : "laptop moins de 500 euros" ->
     *   { category: "laptop", max_price: 500, tags: [] }
     */

    const SYSTEM_PROMPT = `Tu es un extracteur de filtres de recherche pour un site e-commerce.

    À partir de la requête en langage naturel d'un utilisateur, tu dois extraire UNIQUEMENT les informations suivantes et répondre EXCLUSIVEMENT au format JSON, sans aucun texte avant ou après :

    {
    "category": string ou null,   // Le type/catégorie de produit recherché (ex: "laptop", "souris", "écran"). null si aucune catégorie n'est identifiable.
    "max_price": number ou null,  // Le prix maximum mentionné, converti en nombre (ex: "500 euros" -> 500, "moins de 20€" -> 20). null si aucun prix n'est mentionné.
    "tags": string[]              // Liste de caractéristiques/mots-clés pertinents mentionnés (ex: "sans fil", "rapide", "4K", "gaming"). Tableau vide si aucun.
    }

    Règles strictes :
    - Réponds UNIQUEMENT avec l'objet JSON, rien d'autre (pas de markdown, pas d'explication).
    - "category" doit être un nom de produit générique en minuscules, au singulier.
    - "max_price" doit être un nombre pur (sans devise, sans texte), ou null.
    - "tags" doit contenir des mots-clés courts et pertinents en minuscules, sans doublons.
    - Si la requête ne contient aucune information exploitable, réponds { "category": null, "max_price": null, "tags": [] }.

    Exemples :
    Requête: "laptop moins de 500 euros"
    Réponse: {"category": "laptop", "max_price": 500, "tags": []}

    Requête: "souris sans fil rapide"
    Réponse: {"category": "souris", "max_price": null, "tags": ["sans fil", "rapide"]}

    Requête: "écran 4K pas cher"
    Réponse: {"category": "écran", "max_price": null, "tags": ["4k", "pas cher"]}`;

    function normalizeFilters(rawFilters) {
    const filters = rawFilters && typeof rawFilters === 'object' ? rawFilters : {};

    // category : string non vide en minuscules, sinon null
    let category = null;
    if (typeof filters.category === 'string' && filters.category.trim().length > 0) {
        category = filters.category.trim().toLowerCase();
    }

    // max_price : nombre positif, sinon null
    let maxPrice = null;
    const parsedPrice = parseFloat(filters.max_price);
    if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        maxPrice = parsedPrice;
    }

    // tags : tableau de strings non vides, dédupliqué
    let tags = [];
    if (Array.isArray(filters.tags)) {
        const cleaned = filters.tags
        .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag) => tag.trim().toLowerCase());
        tags = [...new Set(cleaned)];
    }

    return { category, max_price: maxPrice, tags };
    }

    async function extractFiltersFromQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('La requête ne peut pas être vide');
    }

    const groq = getGroqClient();
    const model = getGroqModel();

    let completion;
    try {
        completion = await groq.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: query.trim() }
        ],
        temperature: 0, // déterministe : on veut une extraction fiable, pas créative
        max_tokens: 200,
        response_format: { type: 'json_object' } // force une sortie JSON valide
        });
    } catch (error) {
        throw new Error(`Échec de l'appel à l'API Groq : ${error.message}`);
    }

    const rawContent = completion.choices?.[0]?.message?.content;

    if (!rawContent) {
        throw new Error('Réponse vide de l\'API Groq');
    }

    let parsed;
    try {
        parsed = JSON.parse(rawContent);
    } catch (error) {
        throw new Error(`Réponse de Groq non-JSON : ${rawContent}`);
    }

    return normalizeFilters(parsed);
    }

    module.exports = {
    extractFiltersFromQuery,
    normalizeFilters, // exposé pour les tests unitaires
    SYSTEM_PROMPT
    };