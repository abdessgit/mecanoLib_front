import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // récupère le token depuis /reset-password?token=xxxx

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // 🔹 Redirection si pas de token
    useEffect(() => {
        if (!token) {
            navigate("/auth"); // redirige vers la page de login
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/reset_password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message);
                setPassword("");
                setConfirmPassword("");
            } else {
                setError(data.message || "Erreur lors de la réinitialisation");
            }
        } catch (err) {
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
                />
                <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Réinitialiser</button>
            </form>
        </div>
    );
};

export default ResetPassword;