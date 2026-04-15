import { Navigate } from "react-router-dom"
import { clearStoredAuth, getDefaultDashboardPath, getStoredAuth, isJwtExpired } from "../../services/apiCompat"


export function ProtectedRoute({ children, allowedRoles }) {
    const { token, role } = getStoredAuth();

    if (!token || isJwtExpired(token)) {
        clearStoredAuth();
        return <Navigate to="/auth" replace />;
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        return <Navigate to={getDefaultDashboardPath(role)} replace />;
    }

    return children;
}

export function GuestRoute({ children }) {
    const { token, role } = getStoredAuth()

    if (token && !isJwtExpired(token)) {
        return <Navigate to={getDefaultDashboardPath(role)} replace />
    }

    if (token && isJwtExpired(token)) {
        clearStoredAuth()
    }

    return children
}
