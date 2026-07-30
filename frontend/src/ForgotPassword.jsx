import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-indigo-50 via-blue-50 to-white">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Mot de passe oublié</h1>
                    <p className="text-gray-500 mt-2">Entrez votre email pour recevoir un lien de réinitialisation.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

                    {submitted ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Email envoyé !</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Si un compte existe avec l'adresse <span className="font-medium text-gray-900">{email}</span>, vous recevrez un lien de réinitialisation.
                            </p>
                            <Link to="/login">
                                <button className="mt-6 text-indigo-600 font-medium text-sm hover:underline flex items-center gap-1 mx-auto">
                                    <ArrowLeft size={16} />
                                    Retour à la connexion
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jean@exemple.com"
                                        className="w-full border border-gray-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                Envoyer le lien
                            </button>
                        </form>
                    )}

                    {!submitted && (
                        <div className="mt-6 text-center">
                            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 justify-center">
                                <ArrowLeft size={14} />
                                Retour à la connexion
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;