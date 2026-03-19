import React, { useState, useContext } from "react";
import { AuthConnexion } from "./AuthConnexion";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthConnexion);

    const [email, setEmail] = useState("");
    const [mdp, setMdp] = useState("");
    const [authCode, setAuthCode] = useState("");
    const [requires2FA, setRequires2FA] = useState(false);
    const [erreur, setErreur] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Appel login via AuthConnexion
            const response = await login({
                emailUtilisateur: email,
                mdpUtilisateur: mdp,
                authCode: requires2FA ? authCode : undefined
            });

            if (!response.success) {
                if (response.message === "Veuillez fournir le code 2FA") {
                    setRequires2FA(true);
                    setErreur("Entrez votre code 2FA");
                } else {
                    setErreur(response.message);
                }
            } else {
                navigate("/dashboardGarage");
            }
        } catch (err) {
            console.error(err);
            setErreur("Erreur serveur");
        }
    };
    return (
        <div className="login-container">
            <h2>Connexion</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Mot de passe" value={mdp} onChange={(e) => setMdp(e.target.value)} required />
                {requires2FA && (
                    <input type="text" placeholder="Code 2FA" value={authCode} onChange={(e) => setAuthCode(e.target.value)} required />
                )}
                <button type="submit">Se connecter</button>
                {erreur && <p style={{ color: "red" }}>{erreur}</p>}
            </form>
        </div>
    );
};

export default Login;