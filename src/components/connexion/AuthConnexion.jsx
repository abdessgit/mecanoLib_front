import React, { createContext, useState, useEffect } from "react";

export const AuthConnexion = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);

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

            if (!res.ok) {
                return { success: false, message: data.erreur || "Erreur serveur" };
            }


            localStorage.setItem("token", data.token);
            setToken(data.token);


            await fetchUser(data.token);

            return { success: true };

        } catch (err) {
            console.error(err);
            return { success: false, message: "Erreur serveur" };
        }
    };
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthConnexion.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthConnexion.Provider>
    );
};