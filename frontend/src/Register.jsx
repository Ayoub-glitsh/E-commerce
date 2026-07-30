import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Check, X, Loader2 } from 'lucide-react';
import useAuth from './store/useAuth';

function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const { register: registerUser, loading, error, clearError, isAuthenticated } = useAuth();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    // Si déjà connecté, rediriger
    useEffect(() => {
        if (isAuthenticated) navigate(from, { replace: true });
    }, [isAuthenticated]);

    // Effacer les erreurs serveur quand le formulaire change
    useEffect(() => {
        clearError();
    }, [form.email, form.password]);

    // Critères de force du mot de passe
    const passwordChecks = [
        { label: 'Au moins 8 caractères', valid: form.password.length >= 8 },
        { label: 'Une majuscule', valid: /[A-Z]/.test(form.password) },
        { label: 'Un chiffre', valid: /[0-9]/.test(form.password) },
        { label: 'Un caractère spécial (!@#$...)', valid: /[^A-Za-z0-9]/.test(form.password) },
    ];
    const allPasswordValid = passwordChecks.every(c => c.valid);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setLocalErrors({ ...localErrors, [e.target.name]: '' });
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Le nom est requis';
        if (!form.email.trim()) errs.email = "L'email est requis";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide";
        if (!allPasswordValid) errs.password = 'Le mot de passe ne respecte pas tous les critères';
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
        setLocalErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const success = await registerUser(form.name, form.email, form.password);
        if (success) {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-indigo-50 via-blue-50 to-white">
            <div className="w-full max-w-md">
                {/* Titre */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Créer un compte</h1>
                    <p className="text-gray-500 mt-2">Rejoignez-nous et profitez d'une expérience personnalisée.</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    
                    {/* Erreur serveur */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5 flex items-center gap-2">
                            <X size={16} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nom */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Jean Dupont"
                                className={`w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${localErrors.name ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {localErrors.name && <p className="text-red-500 text-xs mt-1">{localErrors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="jean@exemple.com"
                                className={`w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${localErrors.email ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {localErrors.email && <p className="text-red-500 text-xs mt-1">{localErrors.email}</p>}
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full border rounded-xl p-3 pr-12 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${localErrors.password ? 'border-red-400' : 'border-gray-200'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Indicateurs de force */}
                            {form.password.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    {passwordChecks.map((check, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            {check.valid
                                                ? <Check size={14} className="text-green-600" />
                                                : <X size={14} className="text-gray-400" />}
                                            <span className={check.valid ? 'text-green-600 font-medium' : 'text-gray-500'}>{check.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirmer le mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`w-full border rounded-xl p-3 pr-12 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${localErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {localErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{localErrors.confirmPassword}</p>}
                            {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
                                <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><Check size={12} /> Les mots de passe correspondent</p>
                            )}
                        </div>

                        {/* Bouton Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Inscription en cours...</>
                            ) : (
                                <><UserPlus size={18} /> Créer mon compte</>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Vous avez déjà un compte ?{' '}
                        <Link to="/login" className="text-indigo-600 font-medium hover:underline">Se connecter</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;