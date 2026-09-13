import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'

function OrderConfirmation() {
  const { id } = useParams()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">Commande confirmée !</h1>
      <p className="text-[var(--color-text-muted)] text-lg mb-2">
        Merci pour votre achat. Votre commande a été passée avec succès.
      </p>

      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 mt-8 mb-8 inline-block">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-[var(--color-primary-light)]" />
          <div className="text-left">
            <p className="text-sm text-[var(--color-text-muted)]">Numéro de commande</p>
            <p className="text-lg font-bold text-white">{id}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all"
        >
          Voir mes commandes
          <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] text-white font-semibold hover:bg-[var(--color-surface-hover)] transition-all"
        >
          Continuer le shopping
        </Link>
      </div>
    </div>
  )
}

export default OrderConfirmation
