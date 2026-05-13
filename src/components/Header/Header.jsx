import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthConnexion } from "../connexion/AuthConnexion";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
    const { user, token } = useContext(AuthConnexion);

    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const isConnected = Boolean(token);

    const goToDashboard = () => {
        if (roles.includes("ROLE_SUPER_ADMIN")) {
            navigate("/DashboardSuperAdmin");
            return;
        }

        if (roles.includes("ROLE_ADMIN")) {
            navigate("/dashboardGarage");
            return;
        }

        if (roles.includes("ROLE_USER")) {
            navigate("/dashboardClient");
            return;
        }

        navigate("/");
    };

    return (
        <header className="header">
            <div className="header-container">

                <div className="logo" onClick={() => navigate("/")}>
                    MecanoLib
                </div>

                <div className="nav-buttons">
                    {isConnected ? (
                        <>
                            <button
                                className="btn-login"
                                onClick={() => navigate("/")}
                            >
                                Accueil
                            </button>

                            <button
                                className="btn-login"
                                onClick={goToDashboard}
                            >
                                Tableau de bord
                            </button>
                        </>
                    ) : (
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