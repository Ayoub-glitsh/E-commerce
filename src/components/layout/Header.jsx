import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, LogOut, Menu, X, Store } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const itemCount = useCartStore((s) => s.getItemCount())
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/products', label: 'Produits' },
  ]

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center transition-transform group-hover:scale-110">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">3LM Store</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[var(--color-text-secondary)] hover:text-white transition-colors font-medium relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-[var(--color-primary)] after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all"
              title="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold animate-scale-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/orders"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-hover)] transition-all"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg gradient-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--color-border)] animate-slide-up">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Panier {itemCount > 0 && `(${itemCount})`}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)] transition-all flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Mes commandes
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                    className="px-4 py-2 rounded-lg text-[var(--color-danger)] hover:bg-[var(--color-surface-hover)] transition-all flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mx-4 py-2 rounded-lg gradient-primary text-white font-medium text-sm text-center"
                >
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
