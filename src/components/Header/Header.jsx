import { useNavigate, useLocation } from "react-router-dom";
import { Wrench } from "lucide-react";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    // Masquer le bouton Connexion sur les dashboards
    const hideLoginButton = location.pathname === "/dashboardGarage";

    return (
        <header className="header">
            <div className="header-container">

                <div className="logo" onClick={() => navigate("/")}>
                    <div className="logo-icon">
                        <Wrench size={22} />
                    </div>
                    <span className="logo-text">MecanoLib</span>
                </div>

                <div className="nav-buttons">
                    {!hideLoginButton && (
                        <button
                            className="btn-login"
                            onClick={() => navigate("/auth")}
                        >
                            Connexion
                        </button>
                    )}
                </div>

            </div>
        </header>
    );
}

export default Header;