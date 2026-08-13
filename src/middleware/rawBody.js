/**
 * Middleware pour traiter le raw body requis par les webhooks Stripe
 * FonctionnalitéHaute#1781
 * 
 * Stripe nécessite le body brut pour valider la signature du webhook.
 * Ce middleware capture le raw body avant que express.json() ne le parse.
 */

const rawBody = (req, res, next) => {
  // Ne traiter que les webhooks Stripe
  if (req.originalUrl === '/webhooks/stripe') {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      
      // Parser aussi en JSON pour faciliter l'utilisation
      try {
        req.body = JSON.parse(data);
      } catch (error) {
        console.error('Erreur parsing JSON webhook:', error);
        req.body = {};
      }
      
      next();
    });
  } else {
    next();
  }
};

module.exports = rawBody;