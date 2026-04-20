import React, { createContext, useState, useEffect, useCallback } from "react";
import { clearStoredAuth, getProfile, getStoredAuth, loginUser } from "../../services/api";

export const AuthConnexion = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );
    const [token, setToken] = useState(getStoredAuth().token || null);

    const logout = useCallback(() => {
        clearStoredAuth();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }, []);

    const fetchUser = useCallback(async (jwt) => {
        try {
            const data = await getProfile(jwt);
            
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("token", jwt);
            setToken(jwt);
        } catch {
            logout();
        }
    }, [logout]);

    // Récupération de l'utilisateur si token existant
    useEffect(() => {
        if (!token) return;
        const task = setTimeout(() => {
            fetchUser(token);
        }, 0);

        return () => clearTimeout(task);
    }, [token, fetchUser]);

    const login = async ({ emailUtilisateur, mdpUtilisateur, authCode }) => {
        try {
            const result = await loginUser({
                email: emailUtilisateur,
                password: mdpUtilisateur,
                otp: authCode,
            });

            if (result?.requires2fa) {
                return { need2FA: true, message: result.error || "Code 2FA requis" };
            }

            const { token: storedToken } = getStoredAuth();
            const resolvedToken = result?.token || storedToken;

            if (!resolvedToken) {
                return { success: false, message: "Jeton de connexion absent" };
            }

            await fetchUser(resolvedToken);
            const userData = JSON.parse(localStorage.getItem("user") || "null");

            return { success: true, user: userData };

        } catch (err) {
            return { success: false, message: err?.message || "Serveur inaccessible" };
        }
    };

    return (
        <AuthConnexion.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthConnexion.Provider>
    );
};