import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, ShieldCheck } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { formatPrice } from '../lib/utils'

function Checkout() {
  const { items, getTotal, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState({ name: '', street: '', city: '', zipCode: '' })
  const [cardNumber, setCardNumber] = useState('')
  const [errors, setErrors] = useState({})

  const total = getTotal()
  const shipping = total > 500 ? 0 : 49
  const finalTotal = total + shipping

  const validate = () => {
    const errs = {}
    if (!address.name.trim()) errs.name = 'Requis'
    if (!address.street.trim()) errs.street = 'Requis'
    if (!address.city.trim()) errs.city = 'Requis'
    if (!address.zipCode.trim()) errs.zipCode = 'Requis'
    if (!cardNumber.trim()) errs.card = 'Requis'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.images[0],
          })),
          address,
          total: finalTotal,
        }),
      })
      const order = await res.json()
      clearCart()
      navigate(`/order-confirmation/${order.id}`)
    } catch {
      setErrors({ general: 'Erreur lors de la commande' })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

      {errors.general && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-5">
                <MapPin className="w-5 h-5 text-[var(--color-primary-light)]" />
                Adresse de livraison
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Nom complet', placeholder: 'Votre nom', colSpan: true },
                  { key: 'street', label: 'Adresse', placeholder: '12 Rue Mohammed V', colSpan: true },
                  { key: 'city', label: 'Ville', placeholder: 'Casablanca' },
                  { key: 'zipCode', label: 'Code postal', placeholder: '20000' },
                ].map((field) => (
                  <div key={field.key} className={field.colSpan ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={address[field.key]}
                      onChange={(e) => setAddress((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border text-white placeholder-[var(--color-text-muted)] focus:outline-none transition-colors ${
                        errors[field.key] ? 'border-red-500' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
                      }`}
                    />
                    {errors[field.key] && <p className="mt-1 text-xs text-red-400">{errors[field.key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-5">
                <CreditCard className="w-5 h-5 text-[var(--color-primary-light)]" />
                Paiement
              </h2>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border text-white placeholder-[var(--color-text-muted)] focus:outline-none transition-colors ${
                    errors.card ? 'border-red-500' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
                  }`}
                />
                {errors.card && <p className="mt-1 text-xs text-red-400">{errors.card}</p>}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-[var(--color-text-muted)]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Simulation de paiement — aucune donnée réelle n'est traitée
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-white mb-4">Récapitulatif</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        x{item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                  <span>Sous-total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                  <span>Livraison</span>
                  <span className={shipping === 0 ? 'text-emerald-400' : ''}>
                    {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-[var(--color-border)] pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-xl font-bold text-white">{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Confirmer la commande'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout
