import React, { useContext, useState, useEffect } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import { useNavigate } from "react-router-dom";

export default function GarageRdv({ idGarage }) {
    const navigate = useNavigate();
    const { user, logout, token } = useContext(AuthConnexion);

    const [is2FARequired, setIs2FARequired] = useState(false);
    const [code2FA, setCode2FA] = useState("");
    const [messageActivation, setMessageActivation] = useState("");
    const [messageValidation, setMessageValidation] = useState("");

    // Vérifier si l'utilisateur doit saisir le code 2FA
    useEffect(() => {
        const check2FA = async () => {
            if (!token || !user) return;

            try {
                const res = await fetch("http://127.0.0.1:8000/api/v1/users/connecter", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (data.is2fa) setIs2FARequired(true);
            } catch (err) {
                console.error(err);
            }
        };

        check2FA();
    }, [token, user]);
    // activation du code 2FA 
    const activer2FA = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/activer_2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setMessageActivation("Configure Google Authenticator avec le code secret");
            setIs2FARequired(true);

            console.log("SECRET:", data.secret);

        } catch (err) {
            setMessageActivation(err.message);
        }
    };
    // Verefication de code 2FA generer 
    const handle2FASubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/verify_2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: user.email,
                    code: code2FA
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setMessageValidation("2FA validé avec succès ✅");
            setIs2FARequired(false);

        } catch (err) {
            setMessageValidation(err.message);
        }
    };
    // Désactiver l'auth 2FA 
    const desactiver2FA = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/desactiver_2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setMessageValidation("2FA désactivé ");
            setIs2FARequired(false);

        } catch (err) {
            setMessageValidation(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };
    if (!user) return <p>Chargement...</p>;
    return (<div>

        <h1>Bienvenue {user.email}</h1>

        <button onClick={handleLogout}>Se déconnecter</button>

        {!is2FARequired && <p>Vous êtes connecté</p>}

        <h2>Sécurité</h2>

        <button onClick={activer2FA}>
            Activer 2FA
        </button>
        <button onClick={desactiver2FA} style={{ marginLeft: "10px" }}>
            Désactiver 2FA
        </button>

        {/* Message après clic sur Activer */}
        {messageActivation && (
            <p style={{ color: "blue" }}>{messageActivation}</p>
        )}

        {/* Formulaire 2FA (une seule fois !) */}
        {is2FARequired && (
            <form onSubmit={handle2FASubmit} style={{ marginTop: "20px" }}>
                <input
                    type="text"
                    placeholder="Entrez le code 2FA"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    required
                />
                <button type="submit">Valider 2FA</button>

            </form>
        )}

        {/* Message après validation */}
        {messageValidation && (
            <p style={{ color: "green" }}>{messageValidation}</p>
        )}
    </div>
    )
}