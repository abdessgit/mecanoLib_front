import React, { createContext, useState, useEffect } from "react";

export const AuthConnexion = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );
    const [token, setToken] = useState(localStorage.getItem("token") || null);

    // Récupération de l'utilisateur si token existant
    useEffect(() => {
        if (token) fetchUser(token);
    }, [token]);

    const fetchUser = async (jwt) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/connecter", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
            });
            if (!res.ok) throw new Error("Token invalide ou expiré");
            const data = await res.json();
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
        } catch (err) {
            logout();
        }
    };

    const login = async ({ emailUtilisateur, mdpUtilisateur, authCode }) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emailUtilisateur, mdpUtilisateur, authCode })
            });

            const data = await res.json();

            // Backend demande code 2FA
            if (res.status === 403 && data.message?.includes("2FA")) {
                return { need2FA: true, message: data.message };
            }

            // Mauvais login
            if (!res.ok) {
                return { success: false, message: data.message || "Email ou mot de passe invalide" };
            }

            // Login OK → token reçu
            localStorage.setItem("token", data.token);
            setToken(data.token);

            // Récupérer user complet
            await fetchUser(data.token);

            return { success: true, user: JSON.parse(localStorage.getItem("user")) };

        } catch (err) {
            return { success: false, message: "Serveur inaccessible" };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthConnexion.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthConnexion.Provider>
    );
};