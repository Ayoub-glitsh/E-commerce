import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import RatingStars from './RatingStars'
import Badge from './Badge'
import { useCartStore } from '../../stores/cartStore'
import { useWishlistStore } from '../../stores/wishlistStore'
import { formatPrice } from '../../lib/utils'

function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem)
  const toggleItem = useWishlistStore((s) => s.toggleItem)
  const isInWishlist = useWishlistStore((s) => s.items.some((i) => i.id === product.id))

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="group bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-primary)]/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-square">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && <Badge variant="new">Nouveau</Badge>}
          {product.isOnSale && <Badge variant="sale">-{discount}%</Badge>}
          {product.stock === 0 && <Badge variant="outOfStock">Rupture</Badge>}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleItem(product)
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isInWishlist
              ? 'bg-red-500/20 text-red-400'
              : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
          } hover:scale-110`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-[var(--color-primary-light)] font-medium mb-1">
          {product.category}
        </p>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-white mb-2 line-clamp-1 hover:text-[var(--color-primary-light)] transition-colors">
            {product.name}
          </h3>
        </Link>

        <RatingStars rating={product.rating} />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-[var(--color-text-muted)] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="p-2 rounded-lg gradient-primary text-white hover:opacity-90 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ajouter au panier"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
