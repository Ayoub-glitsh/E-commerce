import { Loader2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Modal de confirmation de suppression d'un produit.
 * - isOpen      : booléen, contrôle l'affichage
 * - product     : objet produit à supprimer (ou null)
 * - isDeleting  : booléen, état de chargement pendant l'appel API
 * - onClose     : ferme la modal sans action
 * - onConfirm   : déclenche la suppression effective
 */
function ConfirmDeleteModal({ isOpen, product, isDeleting, onClose, onConfirm }) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Contenu du modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        {/* En-tête */}
        <div className="flex items-start justify-between px-6 pt-6 pb-0">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={22} className="text-red-600" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 pt-4">
          <h2 className="text-lg font-bold text-gray-900">Supprimer ce produit ?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Vous êtes sur le point de supprimer <span className="font-semibold text-gray-900">« {product.name} »</span> du catalogue.
          </p>
          <p className="mt-2 text-sm text-red-600 font-medium">
            Cette action est irréversible. Le produit sera définitivement supprimé du catalogue.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 px-6 py-5 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
