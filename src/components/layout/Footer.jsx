import { Link } from 'react-router-dom'
import { Store, ExternalLink, Mail, Phone } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">3LM Store</span>
            </Link>
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-md">
              Votre destination shopping en ligne pour des produits de qualité. 
              Découvrez notre sélection de produits tendance à des prix compétitifs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Liens rapides
            </h3>
            <ul className="space-y-2">
              {[
                { to: '/products', label: 'Tous les produits' },
                { to: '/cart', label: 'Mon panier' },
                { to: '/orders', label: 'Mes commandes' },
                { to: '/wishlist', label: 'Ma wishlist' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Mail className="w-4 h-4 text-[var(--color-primary-light)]" />
                contact@3lm-store.ma
              </li>
              <li className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Phone className="w-4 h-4 text-[var(--color-primary-light)]" />
                +212 5XX-XXXXXX
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            © 2025 3LM Store. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
