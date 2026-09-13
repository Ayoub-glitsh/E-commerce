import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, UserPlus, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Le nom est requis'
    if (!form.email.trim()) errs.email = "L'email est requis"
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide'
    if (!form.password) errs.password = 'Le mot de passe est requis'
    else if (form.password.length < 6) errs.password = '6 caractères minimum'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      login(data.user, data.token)
      navigate('/')
    } catch {
      setErrors({ general: 'Erreur lors de l\'inscription' })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const fields = [
    { name: 'name', label: 'Nom complet', type: 'text', icon: User, placeholder: 'Votre nom' },
    { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'votre@email.com' },
    { name: 'password', label: 'Mot de passe', type: 'password', icon: Lock, placeholder: '••••••••' },
    { name: 'confirmPassword', label: 'Confirmer le mot de passe', type: 'password', icon: Lock, placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Créer un compte</h1>
          <p className="text-[var(--color-text-muted)]">
            Rejoignez-nous et profitez de nos offres exclusives.
          </p>
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-8">
          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    type={field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                    value={form[field.name]}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border text-white placeholder-[var(--color-text-muted)] focus:outline-none transition-colors ${
                      errors[field.name]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
                    }`}
                  />
                  {field.type === 'password' && field.name === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                {errors[field.name] && (
                  <p className="mt-1 text-xs text-red-400">{errors[field.name]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--color-text-muted)] text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-[var(--color-primary-light)] font-medium hover:text-white transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
