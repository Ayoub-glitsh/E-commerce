import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuth from './store/useAuth';

function ProtectedRoute({ children, adminOnly = false }) {
    const isAuthenticated = useAuth((state) => state.isAuthenticated);
    const user = useAuth((state) => state.user);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirige vers /login et sauvegarde la page d'origine pour y revenir après connexion
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Accès réservé aux administrateurs : un utilisateur authentifié mais non-admin est bloqué
    if (adminOnly && user?.role !== 'admin') {
        toast.error('Accès réservé aux administrateurs');
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
