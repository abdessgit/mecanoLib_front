
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // pour récupérer le token dans l'URL
import { resetPassword as resetPasswordApi } from "../../services/api";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // récupère le token depuis /reset-password?token=xxxx
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setError("Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.");
        }
    }, [token]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!token) {
            setError("Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        try {
            const data = await resetPasswordApi(token, password);
            setMessage(data?.message || "Mot de passe mis à jour. Redirection...");
            setPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                navigate("/auth");
            }, 2000);
        } catch {
            setError("Erreur réseau, réessayez plus tard");
        }
    };

    return (
        <div className="login-container">
            <h2>Réinitialisation du mot de passe</h2>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!token}
                />
                <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!token}
                />
                <button type="submit" disabled={!token}>Réinitialiser</button>
            </form>
        </div>
    );
};

export default ResetPassword;