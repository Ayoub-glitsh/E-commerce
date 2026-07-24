/**
 * Décide comment répondre à une requête non autorisée :
 * - si le client attend du HTML (navigation navigateur classique) -> redirection vers /login
 * - si le client attend du JSON (appel API / fetch depuis le dashboard React) -> réponse d'erreur JSON
 */
const handleAuthFailure = (req, res, status, message) => {
  // IMPORTANT : 'json' en premier. Quand le client n'envoie pas d'Accept
  // header explicite (cas des appels API, fetch, curl, tests), Express
  // choisit le premier type de la liste en cas d'ambiguïté (*/*).
  // Un vrai navigateur qui navigue envoie "text/html" avec une priorité
  // plus haute que le wildcard, donc 'html' est correctement détecté
  // pour la redirection dans ce cas.
  const wantsHTML = req.accepts(['json', 'html']) === 'html';

  if (wantsHTML) {
    return res.redirect('/login');
  }

  return res.status(status).json({ error: message });
};

module.exports = handleAuthFailure;