'use strict';

/**
 * Script de vérification des tests du chatbot (FonctionnalitéHaute #1670)
 * Charge directement les modules testés et vérifie leur comportement
 * (équivalent des assertions Jest, sans lancer la suite complète).
 */

const assert = require('assert');

const {
  buildSystemPrompt,
  buildMessagesForClaude,
  MAX_HISTORY_MESSAGES
} = require('../src/services/chatbotPrompt');

const {
  formatProductForChatbot,
  formatProductsAsText
} = require('../src/services/productCatalogService');

const catalogueText = 'T-shirt Bleu - 199.99 MAD - Vêtements - Stock: 15';

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// --- Tests buildSystemPrompt ---
check('buildSystemPrompt inclut le texte du catalogue', () => {
  assert.ok(buildSystemPrompt(catalogueText).includes(catalogueText));
});

check('buildSystemPrompt contient le rôle assistant e-commerce', () => {
  const p = buildSystemPrompt(catalogueText);
  assert.ok(p.toLowerCase().includes('assistant e-commerce'));
  assert.ok(p.includes('boutique en ligne'));
});

check('buildSystemPrompt contient la limite anti-invention', () => {
  const p = buildSystemPrompt(catalogueText);
  assert.ok(p.toLowerCase().includes('jamais inventer'));
  assert.ok(p.includes('ne figure pas dans le catalogue'));
});

check('buildSystemPrompt mentionne les statuts de commande', () => {
  const p = buildSystemPrompt(catalogueText);
  ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].forEach((s) => {
    assert.ok(p.includes(s), `statut ${s} manquant`);
  });
});

check('buildSystemPrompt gère un catalogue vide', () => {
  assert.ok(buildSystemPrompt(null).includes('Le catalogue est actuellement indisponible.'));
});

// --- Tests buildMessagesForClaude ---
check('buildMessagesForClaude retourne { system, messages }', () => {
  const r = buildMessagesForClaude([], catalogueText);
  assert.strictEqual(typeof r.system, 'string');
  assert.ok(Array.isArray(r.messages));
});

check('buildMessagesForClaude injecte le catalogue dans system', () => {
  const r = buildMessagesForClaude([], catalogueText);
  assert.ok(r.system.includes(catalogueText));
});

check('buildMessagesForClaude reconstruit l historique', () => {
  const history = [
    { role: 'user', content: 'Bonjour' },
    { role: 'assistant', content: 'Bonjour !' }
  ];
  const r = buildMessagesForClaude(history, catalogueText);
  assert.strictEqual(r.messages.length, 2);
  assert.deepStrictEqual(r.messages[0], { role: 'user', content: 'Bonjour' });
});

check('buildMessagesForClaude limite à 10 messages', () => {
  const longHistory = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`
  }));
  const r = buildMessagesForClaude(longHistory, catalogueText);
  assert.strictEqual(r.messages.length, MAX_HISTORY_MESSAGES);
  assert.strictEqual(r.messages.length, 10);
  assert.deepStrictEqual(r.messages[0], { role: 'user', content: 'Message 21' });
});

check('buildMessagesForClaude retourne [] si historique invalide', () => {
  assert.deepStrictEqual(buildMessagesForClaude(null, catalogueText).messages, []);
  assert.deepStrictEqual(buildMessagesForClaude('x', catalogueText).messages, []);
});

check('buildMessagesForClaude filtre les messages invalides', () => {
  const r = buildMessagesForClaude([
    { role: 'user', content: 'Bonjour' },
    { role: 'system', content: 'X' },
    null,
    { role: 'assistant', content: 'Salut !' }
  ], catalogueText);
  assert.strictEqual(r.messages.length, 2);
});

// --- Tests formatage catalogue ---
check('formatProductForChatbot arrondit prix et normalise stock', () => {
  const f = formatProductForChatbot({
    name: 'Casque Gaming',
    price: '49.999',
    stock: '7',
    category: { name: 'Audio' }
  });
  assert.deepStrictEqual(f, { name: 'Casque Gaming', price: 50, category: 'Audio', stock: 7 });
});

check('formatProductForChatbot gère le format raw (catégorie aplatie)', () => {
  const f = formatProductForChatbot({
    name: 'MacBook Pro',
    price: '2499.99',
    stock: 10,
    'category.name': 'Électronique'
  });
  assert.deepStrictEqual(f, { name: 'MacBook Pro', price: 2499.99, category: 'Électronique', stock: 10 });
});

check('formatProductForChatbot utilise Non catégorisé sans catégorie', () => {
  const f = formatProductForChatbot({ name: 'Produit Orphelin', price: '5.50', stock: 2 });
  assert.strictEqual(f.category, 'Non catégorisé');
});

check('formatProductsAsText produit une liste numérotée', () => {
  const text = formatProductsAsText([
    { name: 'Produit A', price: 10.5, category: 'Cat A', stock: 3 },
    { name: 'Produit B', price: 20.25, category: 'Cat B', stock: 0 }
  ]);
  assert.strictEqual(text, '1. Produit A - 10.50 MAD - Cat A - Stock: 3\n2. Produit B - 20.25 MAD - Cat B - Stock: 0');
});

console.log(`\n📊 Résultat: ${passed} tests réussis, ${failed} tests échoués`);
if (failed > 0) {
  process.exit(1);
}

