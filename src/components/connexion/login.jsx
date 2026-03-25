import React, { useState, useContext } from "react";
import { AuthConnexion } from "./AuthConnexion";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [emailUtilisateur, setEmailUtilisateur] = useState("");
    const [mdpUtilisateur, setMdpUtilisateur] = useState("");


    const navigate = useNavigate();
    const { login } = useContext(AuthConnexion);

    const [email, setEmail] = useState("");
    const [mdp, setMdp] = useState("");

    const [erreur, setErreur] = useState("");
    const [need2FA, setNeed2FA] = useState(false);
    const [authCode, setAuthCode] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        const res = await login({
            emailUtilisateur,
            mdpUtilisateur,
            authCode
        });

        if (res.need2FA) {
            setNeed2FA(true);
            return;
        }

        if (!res.success) {
            setMessage(res.message);
            return;
        }

        // succès
        navigate("/dashboardGarage");
    };
    return (
        <div className="login-container">
            <h2>Connexion</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={emailUtilisateur}
                    onChange={(e) => setEmailUtilisateur(e.target.value)}
                    placeholder="Email"
                />

                <input
                    type="password"
                    value={mdpUtilisateur}
                    onChange={(e) => setMdpUtilisateur(e.target.value)}
                    placeholder="Mot de passe"
                />
                {need2FA && (
                    <input
                        type="text"
                        placeholder="Code Google Authenticator"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                    />
                )}
                <button type="submit">Se connecter</button>
                {erreur && <p style={{ color: "red" }}>{erreur}</p>}
            </form>
        </div>
    );
};

export default Login;