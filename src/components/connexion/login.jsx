import React, { useState, useContext } from "react";
import { AuthConnexion } from "./AuthConnexion";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

const Login = ({ embedded = false, onSuccess }) => {
    const [emailUtilisateur, setEmailUtilisateur] = useState("");
    const [mdpUtilisateur, setMdpUtilisateur] = useState("");
    const [authCode, setAuthCode] = useState("");

    const [message, setMessage] = useState("");
    const [need2FA, setNeed2FA] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useContext(AuthConnexion);

    const redirectByRole = (roles = []) => {
        if (!Array.isArray(roles)) roles = [roles];

        if (roles.includes("ROLE_SUPER_ADMIN")) navigate("/dashboardSuperAdmin");
        else if (roles.includes("ROLE_ADMIN")) navigate("/dashboardGarage");
        else if (roles.includes("ROLE_USER")) navigate("/dashboardClient");
        else navigate("/");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        const res = await login({ emailUtilisateur, mdpUtilisateur, authCode });

        if (res.need2FA) {
            setNeed2FA(true);
            setMessage("Entrez le code Google Authenticator");
            setLoading(false);
            return;
        }

        if (!res.success) {
            setMessage(res.message || "Erreur de connexion");
            setLoading(false);
            return;
        }

        if (res.user && res.user.roles) {
            redirectByRole(res.user.roles);
        } else {
            setMessage("Erreur : rôle utilisateur introuvable");
        }

        setLoading(false);
    };

    return (
        <div className={`login-container ${embedded ? "login-container-embedded" : ""}`}>
            <h2>Connexion</h2>

            {message && <div className="alert alert-danger">{message}</div>}

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={emailUtilisateur}
                    onChange={(e) => setEmailUtilisateur(e.target.value)}
                    placeholder="Email"
                    required
                />

                <input
                    type="password"
                    value={mdpUtilisateur}
                    onChange={(e) => setMdpUtilisateur(e.target.value)}
                    placeholder="Mot de passe"
                    required
                />

                <div className="forgot-password">
                    <Link to="/forget-password">Mot de passe oublié ?</Link>
                </div>

                {need2FA && (
                    <input
                        type="text"
                        placeholder="Code Google Authenticator"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        required
                    />
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Connexion..." : "Se connecter"}
                </button>
            </form>
        </div>
    );
};

export default Login;
