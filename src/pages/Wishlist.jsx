import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCartStore } from '../stores/cartStore'
import { formatPrice } from '../lib/utils'

function Wishlist() {
  const { items, removeItem } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
        <Heart className="w-20 h-20 mx-auto text-[var(--color-text-muted)] mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Votre wishlist est vide</h1>
        <p className="text-[var(--color-text-muted)] mb-6">
          Parcourez nos produits et ajoutez vos favoris ici !
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all"
        >
          Voir les produits
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">
        Ma Wishlist ({items.length})
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-primary)]/30 transition-all"
          >
            <Link to={`/products/${item.id}`} className="block aspect-square overflow-hidden">
              <img
                src={item.images[0]}
                alt={item.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <div className="p-4">
              <Link to={`/products/${item.id}`}>
                <h3 className="font-semibold text-white mb-1 hover:text-[var(--color-primary-light)] transition-colors truncate">
                  {item.name}
                </h3>
              </Link>
              <p className="text-lg font-bold text-white mb-3">
                {formatPrice(item.price)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => addToCart(item)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter au panier
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Wishlist
