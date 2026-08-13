'use strict';

/**
 * Exécute les vérifications du chatbot et écrit le résultat dans un fichier
 * (car le terminal ne renvoie pas la sortie dans cet environnement).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'chatbot-verification-result.txt');
const results = [];

function record(name, ok, detail) {
  results.push(`${ok ? '✅' : '❌'} ${name}${detail ? ` - ${detail}` : ''}`);
}

try {
  // 1. Vérifier que les modules se chargent sans erreur
  record('Chargement des modules', true);

  const chatbotPrompt = require('../src/services/chatbotPrompt');
  const productCatalogService = require('../src/services/productCatalogService');

  record('exports chatbotPrompt', typeof chatbotPrompt.buildSystemPrompt === 'function' && typeof chatbotPrompt.buildMessagesForClaude === 'function');
  record('exports productCatalogService', typeof productCatalogService.getProductCatalogForChatbot === 'function');

  // 2. buildSystemPrompt
  const catalogueText = 'T-shirt Bleu - 199.99 MAD - Vêtements - Stock: 15';
  const prompt = chatbotPrompt.buildSystemPrompt(catalogueText);

  record('catalogue injecté dans le prompt', prompt.includes(catalogueText));
  record('rôle assistant e-commerce', prompt.includes('assistant e-commerce'));
  record('limite anti-invention', prompt.includes('jamais inventer'));
  ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].forEach((s) => {
    record(`statut ${s} présent`, prompt.includes(s));
  });

  // 3. buildMessagesForClaude
  const history = [
    { role: 'user', content: 'Bonjour' },
    { role: 'assistant', content: 'Bonjour ! Comment puis-je vous aider ?' }
  ];
  const messages = chatbotPrompt.buildMessagesForClaude(history, catalogueText);

  record('structure { system, messages }', typeof messages.system === 'string' && Array.isArray(messages.messages));
  record('catalogue injecté dans system', messages.system.includes(catalogueText));
  record('historique reconstruit', messages.messages.length === 2 && messages.messages[0].content === 'Bonjour');

  const longHistory = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`
  }));
  const trimmed = chatbotPrompt.buildMessagesForClaude(longHistory, catalogueText);
  record('limite à 10 messages', trimmed.messages.length === 10);
  record('garde les 10 derniers', trimmed.messages[0].content === 'Message 21' && trimmed.messages[9].content === 'Message 30');

  record('historique non tableau → []', chatbotPrompt.buildMessagesForClaude(null, catalogueText).messages.length === 0);
  record('historique string → []', chatbotPrompt.buildMessagesForClaude('x', catalogueText).messages.length === 0);

  // 4. formatage catalogue
  const formatted = productCatalogService.formatProductForChatbot({
    name: 'Casque Gaming',
    price: '49.999',
    stock: '7',
    category: { name: 'Audio' }
  });
  record('formatProductForChatbot (nested)', JSON.stringify(formatted) === JSON.stringify({ name: 'Casque Gaming', price: 50, category: 'Audio', stock: 7 }));

  const rawFormatted = productCatalogService.formatProductForChatbot({
    name: 'MacBook Pro',
    price: '2499.99',
    stock: 10,
    'category.name': 'Électronique'
  });
  record('formatProductForChatbot (raw aplati)', JSON.stringify(rawFormatted) === JSON.stringify({ name: 'MacBook Pro', price: 2499.99, category: 'Électronique', stock: 10 }));

  const text = productCatalogService.formatProductsAsText([
    { name: 'Produit A', price: 10.5, category: 'Cat A', stock: 3 },
    { name: 'Produit B', price: 20.25, category: 'Cat B', stock: 0 }
  ]);
  record('formatProductsAsText', text === '1. Produit A - 10.50 MAD - Cat A - Stock: 3\n2. Produit B - 20.25 MAD - Cat B - Stock: 0');
} catch (error) {
  record('ERREUR GLOBALE', false, error.message);
}

fs.writeFileSync(outputFile, results.join('\n'), 'utf8');
console.log(`Résultat écrit dans ${outputFile}`);

