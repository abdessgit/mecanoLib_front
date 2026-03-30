import React, { useContext, useState, useEffect } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import { useNavigate } from "react-router-dom";

export default function GarageRdv({ idGarage }) {
    const navigate = useNavigate();
    const { user, logout, token } = useContext(AuthConnexion);

    const [is2FARequired, setIs2FARequired] = useState(false);
    const [is2FAActivated, setIs2FAActivated] = useState(false);

    const [code2FA, setCode2FA] = useState("");
    const [messageActivation, setMessageActivation] = useState("");
    const [messageValidation, setMessageValidation] = useState("");

    // Vérifier si l'utilisateur doit saisir le code 2FA
    useEffect(() => {
        if (!token) return;

        const check2FA = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/api/v1/users/connecter", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await res.json();


                if (data.is2fa === true) {
                    setIs2FAActivated(true);
                } else {
                    setIs2FAActivated(false);
                }

            } catch (err) {
                console.error(err);
            }
        };

        check2FA();
    }, [token]);
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

            setMessageActivation(" Vérifie ton email pour scanner le QR code");
            setIs2FARequired(true);
            setIs2FAActivated(true);

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

            const text = await res.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Réponse serveur invalide (pas du JSON)");
            }

            if (!res.ok) throw new Error(data.message);

            setMessageValidation("2FA validé avec succès ");
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
            setIs2FAActivated(false);

        } catch (err) {
            setMessageValidation(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };
    if (!user) return <p>Chargement...</p>;
    return (<div>

        <h1>Bienvenue {user.nom}</h1>

        <button onClick={handleLogout}>Se déconnecter</button>

        {!is2FARequired && <p>Vous êtes connecté</p>}

        <h2>Sécurité</h2>

        <button onClick={activer2FA} disabled={is2FAActivated}>
            {is2FAActivated ? "2FA déjà activée " : "Activer 2FA"}</button>
        <button onClick={desactiver2FA} disabled={!is2FAActivated} style={{ marginLeft: "10px" }}>
            Désactiver 2FA </button>

        {messageActivation && (
            <p style={{ color: "blue" }}>{messageActivation}</p>
        )}
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