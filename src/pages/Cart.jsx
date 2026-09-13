import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { formatPrice } from '../lib/utils'

function Cart() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()
  const total = getTotal()
  const shipping = total > 500 ? 0 : 49
  const finalTotal = total + shipping

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
        <ShoppingBag className="w-20 h-20 mx-auto text-[var(--color-text-muted)] mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Votre panier est vide</h1>
        <p className="text-[var(--color-text-muted)] mb-6">
          Découvrez nos produits et ajoutez-les à votre panier !
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all"
        >
          Voir les produits
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">Mon Panier</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4 flex gap-4 hover:border-[var(--color-primary)]/30 transition-all"
            >
              <Link to={`/products/${item.id}`} className="shrink-0">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.id}`}>
                  <h3 className="font-semibold text-white hover:text-[var(--color-primary-light)] transition-colors truncate">
                    {item.name}
                  </h3>
                </Link>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{item.category}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-0 border border-[var(--color-border)] rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text-muted)]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-white text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text-muted)]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="self-start p-2 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 sticky top-20">
            <h2 className="text-lg font-semibold text-white mb-4">Résumé de la commande</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                <span>Sous-total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                <span>Livraison</span>
                <span className={shipping === 0 ? 'text-emerald-400' : ''}>
                  {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Livraison gratuite à partir de 500 MAD
                </p>
              )}
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-white">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all"
            >
              Commander
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
