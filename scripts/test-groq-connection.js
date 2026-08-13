    require('dotenv').config();
    const { testGroqConnection, getGroqModel } = require('../src/services/groqClient');

    async function main() {
    console.log(' Test de connexion à l\'API Groq');
    console.log('===================================\n');

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key-here') {
        console.error(' GROQ_API_KEY non configurée dans .env');
        console.error('   Ajoutez GROQ_API_KEY=votre_clé dans le fichier .env');
        console.error('   Obtenez une clé gratuite sur https://console.groq.com/keys');
        process.exit(1);
    }

    console.log(`Modèle configuré : ${getGroqModel()}\n`);

    const result = await testGroqConnection();

    if (result.success) {
        console.log(' Connexion réussie !');
        console.log(`   Modèle : ${result.model}`);
        console.log(`   Réponse reçue : "${result.response}"`);
    } else {
        console.error(' Échec de la connexion');
        console.error(`   Modèle : ${result.model}`);
        console.error(`   Erreur : ${result.error}`);
        process.exit(1);
    }
    }

    main();