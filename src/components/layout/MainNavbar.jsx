import { Link, NavLink, useNavigate } from "react-router-dom"
import { clearStoredAuth, getDefaultDashboardPath, getStoredAuth, isJwtExpired } from "../../services/api"
import "./MainNavbar.css"

function MainNavbar() {
    const navigate = useNavigate()
    const { token, role } = getStoredAuth()
    const isAuthenticated = Boolean(token) && !isJwtExpired(token)

    const handleLogout = () => {
        clearStoredAuth()
        navigate("/auth")
    }

    return (
        <nav className="main-navbar" aria-label="Navigation principale">
            <div className="main-navbar-inner">
                <Link to="/" className="main-navbar-brand">MecanoLib</Link>

                <div className="main-navbar-links">
                    <NavLink to="/" end className={({ isActive }) => `main-navbar-link ${isActive ? "active" : ""}`}>Accueil</NavLink>
                    <NavLink to="/booking" className={({ isActive }) => `main-navbar-link ${isActive ? "active" : ""}`}>Prendre RDV</NavLink>
                    <NavLink to="/dashboardClient" className={({ isActive }) => `main-navbar-link ${isActive ? "active" : ""}`}>Espace client</NavLink>
                    <NavLink to="/dashboardGarage" className={({ isActive }) => `main-navbar-link ${isActive ? "active" : ""}`}>Espace garage</NavLink>
                </div>

                <div className="main-navbar-actions">
                    {isAuthenticated ? (
                        <>
                            <Link to={getDefaultDashboardPath(role)} className="main-navbar-btn secondary">Mon espace</Link>
                            <button type="button" className="main-navbar-btn" onClick={handleLogout}>Deconnexion</button>
                        </>
                    ) : (
                        <Link to="/auth" className="main-navbar-btn">Connexion</Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default MainNavbar
