import React, { useContext } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import { useNavigate } from "react-router-dom";
import "./DashboardSuperAdmin.css";

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
            <div className="container py-5">
                <h1 className="mb-4">Dashboard Super Admin</h1>
                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">

                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">

                            </div>
                        </div>
                    </div>
                </div>
                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">

                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card shadow-sm mb-4">
                            <div className="card-body">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={handleLogout}>Se déconnecter</button>
        </div>
    );
}