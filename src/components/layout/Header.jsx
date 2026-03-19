import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { clearStoredAuth, getDefaultDashboardPath, getStoredAuth, isJwtExpired } from "../../services/api"

function Header() {
    const location = useLocation()
    const navigate = useNavigate()
    const { token, role } = getStoredAuth()
    const isAuthenticated = Boolean(token) && !isJwtExpired(token)

    if (token && !isAuthenticated) {
        clearStoredAuth()
    }

    const handleLogout = () => {
        clearStoredAuth()
        navigate("/connexion")
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow">
            <Link className="navbar-brand fw-bold fs-4" to="/">
                <span className="text-warning">🔧</span> MecanoLib
            </Link>

            <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navMenu"
                aria-controls="navMenu"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navMenu">
                <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
                    <li className="nav-item">
                        <NavLink
                            className={({ isActive }) =>
                                "nav-link" + (isActive ? " active fw-semibold text-warning" : "")
                            }
                            to="/"
                            end
                        >
                            Accueil
                        </NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink
                            className={({ isActive }) =>
                                "nav-link" + (isActive ? " active fw-semibold text-warning" : "")
                            }
                            to="/inscription"
                        >
                            Inscription
                        </NavLink>
                    </li>
                    {isAuthenticated ? (
                        <>
                            <li className="nav-item">
                                <NavLink
                                    className={({ isActive }) =>
                                        "nav-link" + (isActive ? " active fw-semibold text-warning" : "")
                                    }
                                    to={getDefaultDashboardPath(role)}
                                >
                                    Mon espace
                                </NavLink>
                            </li>
                            <li className="nav-item ms-lg-2">
                                <button type="button" className="btn btn-outline-light btn-sm fw-semibold px-3" onClick={handleLogout}>
                                    Deconnexion
                                </button>
                            </li>
                        </>
                    ) : (
                        <li className="nav-item ms-lg-2">
                            <Link className="btn btn-warning btn-sm fw-bold px-3" to="/connexion" state={{ from: location.pathname }}>
                                Se connecter
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    )
}

export default Header
