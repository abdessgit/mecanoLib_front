import React, { useContext } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import { useNavigate } from "react-router-dom";
import "./DashboardClient.css";

export default function DashboardClient() {
    const { logout } = useContext(AuthConnexion);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    return (
        <div>
            <h1>Bienvenue</h1>
            <h3>Dashboard Client</h3>
            <div className="client-dashboard">
                <div className="client-dashboard-shell">
                    {/* Header */}
                    <div className="client-dashboard-header">
                        <div>
                            <span className="client-dashboard-kicker">Espace client</span>
                            <h1>Bonjour John</h1>
                            <p>Votre compte est actif. Vous pouvez suivre vos informations et vos rendez-vous depuis cet espace.</p>
                        </div>
                        <button className="client-dashboard-logout">
                            Deconnexion
                        </button>
                    </div>

                    {/* Alert */}
                    <div className="client-dashboard-alert">
                        <div>
                            <strong>Email d'inscription envoyé</strong>
                            <span>Un email de bienvenue a été préparé pour john@example.com.</span>
                        </div>
                    </div>

                    {/* Grid Profil & Véhicule */}
                    <div className="client-dashboard-grid">
                        <div className="client-dashboard-card">
                            <h2>Mon profil</h2>
                            <div className="client-dashboard-list">
                                <div><span>John Doe</span></div>
                                <div><span>+33 6 12 34 56 78</span></div>
                                <div><span>john@example.com</span></div>
                            </div>
                        </div>

                        <div className="client-dashboard-card">
                            <h2>Mon véhicule</h2>
                            <div className="client-dashboard-list">
                                <div><span>123-ABC-45</span></div>
                                <div><span>Peugeot</span></div>
                                <div><span>208</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Rendez-vous */}
                    <div className="client-dashboard-card client-dashboard-appointments-card">
                        <div className="client-dashboard-section-header">
                            <div>
                                <h2>Mes rendez-vous</h2>
                                <p>3 rendez-vous associés à votre email.</p>
                            </div>
                            <a href="/booking" className="client-dashboard-book-link">
                                Prendre un rendez-vous
                            </a>
                        </div>

                        {/* Prochain rendez-vous */}
                        <div className="client-dashboard-next-appointment">
                            <span className="client-dashboard-next-label">Prochain rendez-vous</span>
                            <strong>Révision</strong>
                            <p>30/03/2026 à 10:30</p>
                        </div>

                        {/* Liste des rendez-vous */}
                        <div className="client-dashboard-appointment-list">
                            <div className="client-dashboard-appointment-item">
                                <div>
                                    <strong>Révision</strong>
                                    <span>30/03/2026 à 10:30</span>
                                </div>
                                <span className="client-dashboard-status client-dashboard-status-pending">En attente</span>
                            </div>
                            <div className="client-dashboard-appointment-item">
                                <div>
                                    <strong>Vidange</strong>
                                    <span>15/04/2026 à 14:00</span>
                                </div>
                                <span className="client-dashboard-status client-dashboard-status-confirmed">Confirmé</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={handleLogout}>Se déconnecter</button>
        </div>
    );
}