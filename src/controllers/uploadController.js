'use strict';

/**
 * Contrôleur d'upload d'images de produits
 *
 * Route ADMIN uniquement (middleware verifyAdmin requis):
 * - POST /api/admin/products/upload-image : uploader une image de produit
 *
 * Retourne l'URL publique de l'image, qui sera ensuite ajoutée au tableau
 * `images` du produit lors du POST/PUT.
 */

class UploadController {

  /**
   * POST /api/admin/products/upload-image
   *
   * Multipart/form-data, champ `image` (un seul fichier).
   * Storage disque configuré dans src/config/multer.js.
   *
   * Returns: { success: true, data: { url } } avec status 200
   */
  static async uploadProductImage(req, res) {
    try {
      // Vérifier qu'un fichier a bien été envoyé
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier image fourni. Utilisez le champ "image" (multipart/form-data).'
        });
      }

      // Construire l'URL publique
      const url = `/uploads/products/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: 'Image uploadée avec succès',
        data: {
          url
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);

      // Gestion des erreurs Multer (taille dépassée, type invalide)
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'La taille de l\'image ne doit pas dépasser 5 Mo.'
        });
      }

      if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: error.message || 'Type de fichier invalide. Seuls les formats JPEG, PNG et WEBP sont acceptés.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'upload de l\'image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UploadController;
