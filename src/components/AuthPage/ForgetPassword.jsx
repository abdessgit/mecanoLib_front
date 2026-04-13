import React, { useState } from "react";
import { requestPasswordReset } from "../../services/api";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        await requestPasswordReset(email);
        setMessage("Si cet email existe, un lien a été envoyé ");
    };

    return (
        <div className="login-container">
            <h2>Mot de passe oublié</h2>

            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Entrez votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button type="submit">Envoyer le lien</button>
            </form>
        </div>
    );
};

export default ForgotPassword;