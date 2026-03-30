import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
    const navigate = useNavigate();

    return (
        <header className="header">
            <div className="header-container">

                <div className="logo" onClick={() => navigate("/")}>
                    MecanoLib
                </div>

                <div className="nav-buttons">
                    <button
                        className="btn-login"
                        onClick={() => navigate("/auth")}
                    >
                        Connexion
                    </button>

                </div>

            </div>
        </header>
    );
}

export default Header;