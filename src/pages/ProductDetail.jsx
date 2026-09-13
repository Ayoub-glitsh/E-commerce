import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Heart, Minus, Plus, Star, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react'
import RatingStars from '../components/product/RatingStars'
import ProductCard from '../components/product/ProductCard'
import Badge from '../components/product/Badge'
import { useCartStore } from '../stores/cartStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { formatPrice } from '../lib/utils'

function ProductDetail() {
  const { id } = useParams()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [chatOpen, setChatOpen] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const isInWishlist = useWishlistStore((s) => s.items.some((i) => i.id === Number(id)))

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetch(`/api/products/${id}`).then((r) => r.json()),
  })

  const { data: reviewData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetch(`/api/reviews/${id}`).then((r) => r.json()),
  })

  const { data: similar } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => fetch(`/api/recommendations/similar/${id}`).then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/4" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-12 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Image Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-[var(--color-surface)] aspect-square mb-4">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.isNew && (
              <div className="absolute top-4 left-4">
                <Badge variant="new">Nouveau</Badge>
              </div>
            )}
            {product.isOnSale && (
              <div className="absolute top-4 right-4">
                <Badge variant="sale">-{discount}%</Badge>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? 'border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-[var(--color-primary-light)] text-sm font-medium mb-2">
            {product.category}
          </p>
          <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={product.rating} size="md" />
            <span className="text-[var(--color-text-muted)] text-sm">
              ({product.reviewCount} avis)
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xl text-[var(--color-text-muted)] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-emerald-400 text-sm font-medium">
                ✓ En stock ({product.stock} disponibles)
              </span>
            ) : (
              <span className="text-red-400 text-sm font-medium">
                ✕ Rupture de stock
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-[var(--color-text-secondary)]">Quantité:</span>
            <div className="flex items-center gap-0 border border-[var(--color-border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text-muted)]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-white font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text-muted)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => addItem(product, quantity)}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Ajouter au panier
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-xl border transition-all hover:scale-105 ${
                isInWishlist
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-400 hover:border-red-500/30'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {reviewData && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">
            Avis clients ({reviewData.totalReviews})
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Rating Summary */}
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {reviewData.averageRating}
              </div>
              <RatingStars rating={reviewData.averageRating} size="lg" showValue={false} />
              <p className="text-[var(--color-text-muted)] text-sm mt-2">
                {reviewData.totalReviews} avis
              </p>
            </div>

            {/* AI Summary */}
            {reviewData.aiSummary && (
              <div className="md:col-span-2 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
                <h3 className="text-sm font-semibold text-[var(--color-primary-light)] mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Résumé IA des avis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Points forts
                    </h4>
                    <ul className="space-y-1">
                      {reviewData.aiSummary.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                          • {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Points faibles
                    </h4>
                    <ul className="space-y-1">
                      {reviewData.aiSummary.cons.map((con, i) => (
                        <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                          • {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewData.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                      {review.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{review.userName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{review.date}</p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} size="sm" showValue={false} />
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Products */}
      {similar && similar.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="mb-4 w-80 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-xl overflow-hidden animate-scale-in">
            <div className="gradient-primary p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Assistant 3LM</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
              <div className="bg-[var(--color-surface)] rounded-lg p-3 mb-3 text-sm text-[var(--color-text-secondary)]">
                Bonjour ! 👋 Comment puis-je vous aider ? Posez-moi une question sur nos produits.
              </div>
            </div>
            <div className="p-3 border-t border-[var(--color-border)]">
              <input
                type="text"
                placeholder="Tapez votre message..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full gradient-primary text-white shadow-lg shadow-indigo-500/30 hover:scale-110 transition-transform flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

export default ProductDetail
