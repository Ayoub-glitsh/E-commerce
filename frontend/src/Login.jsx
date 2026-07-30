import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, X, Loader2 } from 'lucide-react';
import useAuth from './store/useAuth';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const { login, loading, error, clearError, isAuthenticated } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    useEffect(() => {
        if (isAuthenticated) navigate(from, { replace: true });
    }, [isAuthenticated]);

    useEffect(() => {
        clearError();
    }, [form.email, form.password]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setLocalErrors({ ...localErrors, [e.target.name]: '' });
    };

    const validate = () => {
        const errs = {};
        if (!form.email.trim()) errs.email = "L'email est requis";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide";
        if (!form.password.trim()) errs.password = 'Le mot de passe est requis';
        setLocalErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const success = await login(form.email, form.password);
        if (success) {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-indigo-50 via-blue-50 to-white">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Bon retour !</h1>
                    <p className="text-gray-500 mt-2">Connectez-vous pour accéder à votre compte.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5 flex items-center gap-2">
                            <X size={16} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
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

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">
                                    Mot de passe oublié ?
                                </Link>
                            </div>
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
                            {localErrors.password && <p className="text-red-500 text-xs mt-1">{localErrors.password}</p>}
                        </div>

                    
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Connexion en cours...</>
                            ) : (
                                <><LogIn size={18} /> Se connecter</>
                            )}
                        </button>
                    </form>

                 
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-indigo-600 font-medium hover:underline">Créer un compte</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;