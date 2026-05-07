import React, { useState } from "react";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/forget_password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message);
                return;
            }

            setMessage(data.message);

        } catch (error) {
            setMessage("Erreur serveur");
        }
    };

    return (
        <div className="login-container">
            <h2>Mot de passe oublié</h2>

            {message && <div className="alert alert-warning">{message}</div>}

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