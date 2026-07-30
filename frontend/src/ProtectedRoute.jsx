import { Navigate, useLocation } from 'react-router-dom';
import useAuth from './store/useAuth';

function ProtectedRoute({ children }) {
    const isAuthenticated = useAuth((state) => state.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirige vers /login et sauvegarde la page d'origine pour y revenir après connexion
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}

export default ProtectedRoute;