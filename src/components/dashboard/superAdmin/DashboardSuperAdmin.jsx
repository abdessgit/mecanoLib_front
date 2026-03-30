import React, { useContext } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import { useNavigate } from "react-router-dom";

export default function DashboardSuperAdmin() {
    const { logout } = useContext(AuthConnexion);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    return (
        <div>
            <h1>Bienvenue</h1>
            <h3>Dashboard Super Admin </h3>
            <button onClick={handleLogout}>Se déconnecter</button>
        </div>
    );
}