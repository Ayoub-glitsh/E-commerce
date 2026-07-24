const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, RefreshToken } = require('../../models');

/**
 * Contrôleur d'authentification selon CDC 01_Auth_Catalogue
 * 
 * Fonctionnalités:
 * - POST /auth/register : Inscription utilisateur
 * - POST /auth/login : Connexion utilisateur  
 * - POST /auth/logout : Déconnexion (invalidation refresh token)
 * - GET /auth/me : Récupération profil utilisateur connecté
 */

class AuthController {
  
  /**
   * POST /auth/register - Inscription d'un nouvel utilisateur
   * 
   * Body: { email, password, role? }
   * Returns: { user, accessToken, refreshToken }
   */
  static async register(req, res) {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password, role = 'user' } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Hasher le mot de passe avec bcrypt (12 rounds selon CDC)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password: passwordHash, // Note: sera mappé vers passwordHash
        role
      });

      // Générer les tokens JWT
      const { accessToken, refreshToken } = await AuthController.generateTokens(user);

      // Retourner la réponse (sans le mot de passe)
      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'inscription'
      });
    }
  }

  /**
   * POST /auth/login - Connexion utilisateur
   * 
   * Body: { email, password }
   * Returns: { user, accessToken, refreshToken }
   */
  static async login(req, res) {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur par email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }

      // Invalider les anciens refresh tokens (optionnel, pour sécurité)
      await RefreshToken.update(
        { isActive: false },
        { where: { userId: user.id, isActive: true } }
      );

      // Générer nouveaux tokens
      const { accessToken, refreshToken } = await AuthController.generateTokens(user);

      // Retourner la réponse
      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la connexion'
      });
    }
  }

  /**
   * POST /auth/logout - Déconnexion utilisateur
   * 
   * Body: { refreshToken }
   * Returns: { message }
   */
  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requis'
        });
      }

      // Trouver et invalider le refresh token
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken, isActive: true }
      });

      if (tokenRecord) {
        await tokenRecord.update({ isActive: false });
      }

      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la déconnexion'
      });
    }
  }

  /**
   * GET /auth/me - Récupération du profil utilisateur connecté
   * 
   * Requires: Authorization header avec JWT
   * Returns: { user }
   */
  static async me(req, res) {
    try {
      // L'utilisateur est injecté par le middleware verifyToken
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  /**
   * Générer les tokens JWT (access + refresh)
   * 
   * @param {Object} user - L'utilisateur pour lequel générer les tokens
   * @returns {Object} { accessToken, refreshToken }
   */
  static async generateTokens(user) {
    const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    
    // Payload pour les tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    // Access token (15 minutes selon CDC)
    const accessToken = jwt.sign(payload, jwtSecret, { 
      expiresIn: '15m' 
    });

    // Refresh token (7 jours selon CDC)
    const refreshTokenValue = jwt.sign(
      { userId: user.id, type: 'refresh' }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );

    // Stocker le refresh token en base
    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      isActive: true
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue
    };
  }

  /**
   * POST /auth/refresh - Renouveller l'access token
   * 
   * Body: { refreshToken }
   * Returns: { accessToken, refreshToken }
   */
  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requis'
        });
      }

      // Vérifier le refresh token en base
      const tokenRecord = await RefreshToken.findOne({
        where: { token: refreshToken, isActive: true },
        include: [{ model: User, as: 'user' }]
      });

      if (!tokenRecord || tokenRecord.isExpired()) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token invalide ou expiré'
        });
      }

      // Générer nouveaux tokens
      const { accessToken, refreshToken: newRefreshToken } = await AuthController.generateTokens(tokenRecord.user);

      // Invalider l'ancien refresh token
      await tokenRecord.update({ isActive: false });

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });

    } catch (error) {
      console.error('Erreur lors du refresh:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}

/**
 * Middlewares de validation pour les routes d'authentification
 */
AuthController.validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Le rôle doit être "user" ou "admin"')
];

AuthController.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

module.exports = AuthController;