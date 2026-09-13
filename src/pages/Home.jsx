import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Truck, Shield, Headphones, Sparkles } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'

function Home() {
  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => fetch('/api/recommendations/trending').then((r) => r.json()),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  })

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-cyan-600/20" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=800&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Découvrez le meilleur du{' '}
              <span className="gradient-text">shopping en ligne</span>
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] mb-8 leading-relaxed">
              Des produits soigneusement sélectionnés pour vous. Qualité premium,
              livraison rapide et service client exceptionnel.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                Découvrir les produits
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] text-white font-semibold hover:bg-[var(--color-surface-hover)] transition-all"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Catégories populaires
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              Explorez nos collections tendance
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-1 text-[var(--color-primary-light)] hover:text-white transition-colors text-sm font-medium"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories?.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group relative overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
                <p className="text-gray-300 text-xs">{cat.count} produits</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Produits tendance 🔥
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              Les plus populaires du moment
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-1 text-[var(--color-primary-light)] hover:text-white transition-colors text-sm font-medium"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trending?.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
          Pourquoi nous choisir ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Truck,
              title: 'Livraison rapide',
              description: 'Livraison gratuite à partir de 500 MAD. Vos commandes livrées en 24-48h partout au Maroc.',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              icon: Shield,
              title: 'Paiement sécurisé',
              description: 'Vos transactions sont 100% sécurisées. Nous acceptons les cartes bancaires et le paiement à la livraison.',
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
            {
              icon: Headphones,
              title: 'Support 24/7',
              description: 'Notre équipe est disponible 24h/24, 7j/7 pour répondre à toutes vos questions.',
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="text-center p-8 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all group"
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bg} mb-5 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
