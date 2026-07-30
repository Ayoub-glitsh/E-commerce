import { create } from 'zustand';

const useAuth = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                set({ loading: false, error: data.message || 'Erreur de connexion' });
                return false;
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false, error: null });
            return true;
        } catch (err) {
            set({ loading: false, error: 'Erreur réseau. Veuillez réessayer.' });
            return false;
        }
    },

    register: async (name, email, password) => {
        set({ loading: true, error: null });

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                set({ loading: false, error: data.message || "Erreur lors de l'inscription" });
                return false;
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false, error: null });
            return true;
        } catch (err) {
            set({ loading: false, error: 'Erreur réseau. Veuillez réessayer.' });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
    },

    clearError: () => set({ error: null }),
}));

export default useAuth;