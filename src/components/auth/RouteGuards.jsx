import { Navigate } from "react-router-dom"
import { clearStoredAuth, getStoredAuth, isJwtExpired } from "../../services/api"


export function ProtectedRoute({ children, allowedRoles }) {
    const { token, role } = getStoredAuth();

    if (!token || isJwtExpired(token)) {
        clearStoredAuth();
        return <Navigate to="/auth" replace />;
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        // Redirection par défaut si le rôle n'est pas autorisé
        // À adapter selon la logique métier souhaitée (ici, page d'accueil)
        return <Navigate to="/" replace />;
    }

    return children;
}

export function GuestRoute({ children }) {
    const { token } = getStoredAuth()

    if (token && !isJwtExpired(token)) {
        // Redirection par défaut si déjà connecté
        // À adapter selon la logique métier souhaitée (ici, page d'accueil)
        return <Navigate to="/" replace />
    }

    if (token && isJwtExpired(token)) {
        clearStoredAuth()
    }

    return children
}
