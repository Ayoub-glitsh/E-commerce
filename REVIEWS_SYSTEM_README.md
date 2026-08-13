# 🌟 Système d'avis sur produits - Guide complet

## 🚀 Démarrage rapide

### Installation et configuration

```bash
# 1. Migration base de données (OBLIGATOIRE)
npm run db:migrate

# 2. Démarrer le serveur
npm start

# 3. Test de santé
curl http://localhost:3000/health
```

### Premier test

```bash
# Récupérer les avis d'un produit (accès public)
curl "http://localhost:3000/api/products/PRODUCT_UUID/reviews"

# Créer un avis (authentification requise)
curl -X POST "http://localhost:3000/api/products/PRODUCT_UUID/reviews" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Excellent produit !"}'
```

## 📚 API Documentation

### 🔍 GET /api/products/:id/reviews - Lire les avis

**Accès :** Public (pas d'authentification)

#### Paramètres de requête
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | integer | 1 | Numéro de page |
| `limit` | integer | 10 | Avis par page |
| `sortBy` | string | `created_at` | Champ de tri (`created_at`, `rating`) |
| `sortOrder` | string | `DESC` | Ordre (`ASC`, `DESC`) |

#### Exemple de réponse
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid-avis",
        "rating": 4,
        "comment": "Très bon produit !",
        "createdAt": "2026-07-28T21:12:53.066Z",
        "user": {
          "id": "uuid-user",
          "name": "Utilisateur Test",
          "email": "us***@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalReviews": 15,
      "limit": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "stats": {
      "averageRating": "4.20",
      "totalReviews": 15
    }
  }
}
```

### ✏️ POST /api/products/:id/reviews - Créer un avis

**Accès :** Privé (authentification JWT requise)

#### Headers requis
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

#### Corps de la requête
```json
{
  "rating": 4,           // Integer 1-5 (obligatoire)
  "comment": "..."       // String max 500 chars (optionnel)
}
```

#### Réponse de succès (HTTP 201)
```json
{
  "success": true,
  "message": "Avis créé avec succès",
  "data": {
    "review": {
      "id": "nouveau-uuid",
      "rating": 4,
      "comment": "Commentaire de l'utilisateur",
      "createdAt": "2026-07-28T21:12:53.066Z",
      "user": {
        "id": "uuid-user",
        "name": "Nom Utilisateur"
      }
    }
  }
}
```

#### Codes d'erreur possibles
| Code | Message | Cause |
|------|---------|--------|
| 400 | "Données invalides" | Rating hors 1-5, comment trop long |
| 401 | "Token d'accès requis" | Pas d'authentification |
| 404 | "Produit non trouvé" | Product ID inexistant |
| 409 | "Vous avez déjà laissé un avis sur ce produit" | Contrainte unique |

## 🏗️ Architecture technique

### Structure des fichiers
```
📁 Système d'avis
├── 🗄️ models/Review.js                    # Modèle Sequelize
├── 🔄 migrations/20260728140000-*.js       # Schéma base de données
├── 🎛️ src/controllers/reviewController.js  # Logique métier
├── 🛡️ src/validators/reviewValidator.js    # Validations
├── 🛣️ src/routes/reviews.js               # Routes API
└── 🔗 src/app.js                          # Intégration (modifié)
```

### Base de données

#### Table `reviews`
```sql
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,                    -- UUID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,                          -- Max 500 caractères
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Contrainte unique : un avis par utilisateur par produit
  CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

-- Index pour performance
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

#### Relations
- `Review` **belongsTo** `User` (many-to-one)
- `Review` **belongsTo** `Product` (many-to-one)
- `User` **hasMany** `Review` (one-to-many)
- `Product` **hasMany** `Review` (one-to-many)

## 🔒 Sécurité

### Authentification
- **JWT requis** pour POST /reviews
- **Token vérifié** avec signature + expiration
- **User ID extrait** du token (pas du body)

### Validation des données
- **Rating** : Obligatoire, entier entre 1 et 5
- **Comment** : Optionnel, max 500 caractères, échappé pour XSS
- **Product ID** : Vérifié format UUID v4

### Protection de la confidentialité
- **Emails masqués** dans réponses publiques (`ad***@domain.com`)
- **Utilisateurs anonymes** si pas de nom défini
- **Pas de mots de passe** dans les réponses

### Contraintes métier
- **Un seul avis** par utilisateur par produit (contrainte DB unique)
- **Produit doit exister** avant création d'avis
- **Cascade DELETE** si utilisateur/produit supprimé

## 📊 Performance et optimisations

### Base de données
- ✅ **Index stratégiques** sur colonnes fréquemment requêtées
- ✅ **JOIN optimisés** : une requête pour reviews + users  
- ✅ **Pagination efficace** avec OFFSET/LIMIT
- ✅ **Statistiques cachées** : calcul à la demande

### API
- ✅ **Réponses paginées** évitent surcharge mémoire
- ✅ **Validation côté serveur** avec messages localisés
- ✅ **Gestion d'erreurs** complète et cohérente
- ✅ **Format standard** `{ success, data, message?, error? }`

## 🧪 Tests et validation

### Tests automatisés disponibles

```bash
# Test du modèle et associations
node scripts/test-review-model.js

# Création d'avis d'exemple 
node scripts/create-sample-review.js

# Test complet du système
node scripts/test-review-system.js

# Génération token JWT de test
node scripts/generate-test-token.js
```

### Scénarios validés ✅

1. **Création d'avis** avec authentification
2. **Récupération paginée** avec statistiques
3. **Contrainte unique** (impossible double avis)
4. **Validation des données** (rating, comment)
5. **Gestion d'erreurs** (401, 404, 409, 400)
6. **Performance** (requêtes optimisées)
7. **Sécurité** (JWT, XSS, confidentialité)

## 🚀 Guide de production

### Checklist déploiement

- [ ] Migration base de données exécutée
- [ ] Variables d'environnement configurées (`JWT_SECRET`)
- [ ] Tests de santé passés
- [ ] Monitoring configuré
- [ ] Logs d'erreurs activés

### Monitoring recommandé

```bash
# Métriques clés à surveiller
- Temps de réponse GET/POST /reviews
- Taux d'erreur contrainte unique (tentatives multi-avis)  
- Nombre d'avis créés par jour
- Distribution des ratings (1-5 étoiles)
```

### Maintenance

```sql
-- Requêtes utiles pour le monitoring

-- Top produits par nombre d'avis
SELECT p.name, COUNT(r.id) as avis_count, AVG(r.rating) as note_moyenne
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id  
GROUP BY p.id, p.name
ORDER BY avis_count DESC
LIMIT 10;

-- Avis récents
SELECT r.rating, r.comment, u.name, p.name, r.created_at
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN products p ON r.product_id = p.id
ORDER BY r.created_at DESC
LIMIT 20;

-- Statistiques globales
SELECT 
  COUNT(*) as total_avis,
  AVG(rating) as note_moyenne_globale,
  COUNT(DISTINCT user_id) as utilisateurs_actifs,
  COUNT(DISTINCT product_id) as produits_evalues
FROM reviews;
```

## 🆘 Dépannage

### Erreurs courantes

#### "Token d'accès requis"
```bash
# Solution : Ajouter header Authorization
curl -H "Authorization: Bearer YOUR_TOKEN" ...
```

#### "Vous avez déjà laissé un avis sur ce produit"  
```bash
# Normal : contrainte unique respectée
# Un utilisateur = un seul avis par produit
```

#### "La note doit être un entier entre 1 et 5"
```json
// Solution : Corriger le rating
{ "rating": 4, "comment": "..." }  // ✅ Valide
{ "rating": 6, "comment": "..." }  // ❌ Invalide
```

#### Table reviews n'existe pas
```bash
# Solution : Exécuter la migration
npm run db:migrate
```

### Debug

```bash
# Vérifier l'état de la base
npm run db:check-tables

# Logs du serveur
npm run dev  # Mode développement avec logs détaillés

# Test direct du modèle  
node -e "
const {Review} = require('./models'); 
Review.findAll().then(r => console.log(r.length + ' avis trouvés'));
"
```

---

## 📞 Support

Pour toute question ou problème :

1. Vérifier cette documentation
2. Consulter les logs d'erreur du serveur  
3. Tester avec les scripts fournis dans `/scripts/`
4. Vérifier les tests automatisés

**🎉 Système d'avis prêt pour la production !** 🚀