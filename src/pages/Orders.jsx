import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { getOrderStatusBadge } from '../components/product/Badge'
import { formatPrice } from '../lib/utils'

function Orders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetch('/api/orders').then((r) => r.json()),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">Mes Commandes</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : orders?.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-[var(--color-primary-light)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{order.id}</p>
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getOrderStatusBadge(order.status)}
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border-2 border-[var(--color-card)]"
                    />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border-2 border-[var(--color-card)] flex items-center justify-center text-xs text-[var(--color-text-muted)]">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1" />
                <span className="font-bold text-white">{formatPrice(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucune commande</h2>
          <p className="text-[var(--color-text-muted)] mb-6">
            Vous n'avez pas encore passé de commande.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold"
          >
            Découvrir les produits
          </Link>
        </div>
      )}
    </div>
  )
}

export default Orders
