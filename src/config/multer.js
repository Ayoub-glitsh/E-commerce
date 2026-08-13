'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Configuration Multer pour l'upload d'images de produits
 *
 * - Stockage sur disque dans `public/uploads/products/`
 * - Nom de fichier unique : uuid + extension
 * - Types MIME acceptés : jpeg, png, webp
 * - Taille maximale : 5 Mo
 */

// Dossier de destination des images produits
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/products');

// Types MIME autorisés → extension correspondante
const MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

// Stockage sur disque
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Créer le dossier s'il n'existe pas (au cas où)
    const fs = require('fs');
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const extension = MIME_TYPES[file.mimetype] || '.bin';
    const uniqueName = `${uuidv4()}${extension}`;
    cb(null, uniqueName);
  }
});

// Filtre des fichiers : uniquement les images autorisées
const fileFilter = (req, file, cb) => {
  if (MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    const error = new Error('Type de fichier invalide. Seuls les formats JPEG, PNG et WEBP sont acceptés.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Instance Multer configurée
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Mo
  }
});

module.exports = {
  upload,
  UPLOAD_DIR,
  MIME_TYPES
};
