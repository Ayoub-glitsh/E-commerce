import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getOrderStatusBadge } from '../components/product/Badge'
import { formatPrice } from '../lib/utils'

function OrderDetail() {
  const { id } = useParams()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetch(`/api/orders/${id}`).then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-40 mb-6" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux commandes
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{order.id}</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Passée le {order.date}
          </p>
        </div>
        {getOrderStatusBadge(order.status)}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Products */}
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 mb-6">
            <h2 className="font-semibold text-white mb-4">Produits</h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Qté: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-white">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Address */}
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-primary-light)]" />
              Adresse de livraison
            </h2>
            <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
              <p>{order.address.name}</p>
              <p>{order.address.street}</p>
              <p>{order.address.city}, {order.address.zipCode}</p>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
            <h2 className="font-semibold text-white mb-3">Montant</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Sous-total</span>
                <span>{formatPrice(order.total - order.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Livraison</span>
                <span className={order.shippingCost === 0 ? 'text-emerald-400' : ''}>
                  {order.shippingCost === 0 ? 'Gratuite' : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-white">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
