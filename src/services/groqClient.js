const Groq = require('groq-sdk');

    const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

    let client = null;

    function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error(
        'GROQ_API_KEY manquante. Ajoutez-la dans votre fichier .env ' +
        '(obtenez une clé gratuite sur https://console.groq.com/keys)'
        );
    }

    if (!client) {
        client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    return client;
    }

    function getGroqModel() {
    return process.env.GROQ_MODEL || DEFAULT_MODEL;
    }
//test connection
    async function testGroqConnection() {
    try {
        const groq = getGroqClient();
        const model = getGroqModel();

        const completion = await groq.chat.completions.create({
        model,
        messages: [
            { role: 'user', content: 'Réponds uniquement par le mot "OK".' }
        ],
        max_tokens: 5,
        temperature: 0
        });

        const responseText = completion.choices?.[0]?.message?.content?.trim();

        return {
        success: true,
        model,
        response: responseText
        };
    } catch (error) {
        return {
        success: false,
        model: getGroqModel(),
        error: error.message
        };
    }
    }

    module.exports = {
    getGroqClient,
    getGroqModel,
    testGroqConnection,
    DEFAULT_MODEL
    };