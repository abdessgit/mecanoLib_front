import React, { useState, useEffect, useContext } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import { useNavigate } from "react-router-dom";
import "./DashboardSuperAdmin.css";
import {
    validateGarage,
    deleteGarage,
    deleteUser,
    getGaragesForModeration,
    createSuperAdmin,
} from "../../../api/garageApi.js";

export default function DashboardSuperAdmin() {
    const { token, logout } = useContext(AuthConnexion);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("garages");
    const [garages, setGarages] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState("");

    // Create superadmin form
    const [superAdminForm, setSuperAdminForm] = useState({ email: "", mdp: "" });
    const [superAdminLoading, setSuperAdminLoading] = useState(false);

    const showNotif = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(""), 4000);
    };

    const loadGarages = async () => {
        setLoading(true);
        try {
            const data = await getGaragesForModeration(token);
            const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            setGarages(list);
        } catch (err) {
            showNotif("Erreur chargement garages : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Recupere les utilisateurs connectes ou la liste via l'API profil si disponible
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/connecter", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Impossible de recuperer les utilisateurs");
            const userData = await res.json();
            // On essaie de recuperer une liste d'utilisateurs si le backend la fournit
            const list = Array.isArray(userData?.users)
                ? userData.users
                : Array.isArray(userData?.data?.users)
                  ? userData.data.users
                  : [];
            setUsers(list);
        } catch (err) {
            showNotif("Erreur chargement utilisateurs : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;
        if (activeTab === "garages") loadGarages();
        if (activeTab === "users") loadUsers();
    }, [activeTab, token]);

    const handleValidateGarage = async (garageId, isValide) => {
        try {
            await validateGarage(token, garageId, isValide);
            showNotif(isValide ? "Garage validé" : "Garage invalidé");
            loadGarages();
        } catch (err) {
            showNotif("Erreur : " + err.message);
        }
    };

    const handleDeleteGarage = async (garageId) => {
        if (!window.confirm("Supprimer ce garage definitivement ?")) return;
        try {
            await deleteGarage(token, garageId);
            showNotif("Garage supprimé");
            loadGarages();
        } catch (err) {
            showNotif("Erreur : " + err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Supprimer cet utilisateur definitivement ?")) return;
        try {
            await deleteUser(token, userId);
            showNotif("Utilisateur supprimé");
            loadUsers();
        } catch (err) {
            showNotif("Erreur : " + err.message);
        }
    };

    const handleCreateSuperAdmin = async (e) => {
        e.preventDefault();
        setSuperAdminLoading(true);
        try {
            await createSuperAdmin(token, superAdminForm);
            showNotif("Super admin créé avec succès");
            setSuperAdminForm({ email: "", mdp: "" });
        } catch (err) {
            showNotif("Erreur : " + err.message);
        } finally {
            setSuperAdminLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    const tabs = [
        { key: "garages", label: "Gestion des garages" },
        { key: "users", label: "Utilisateurs" },
        { key: "superadmin", label: "Ajouter un super admin" },
    ];

    return (
        <div className="container py-4 py-md-5">
            {/* Hero */}
            <section
                className="p-4 p-md-5 rounded-4 text-white shadow-sm mb-4"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)" }}
            >
                <p className="mb-2 text-warning fw-semibold">Administration</p>
                <h1 className="display-6 fw-bold mb-3">Dashboard Super Admin</h1>
                <p className="mb-0" style={{ maxWidth: "680px" }}>
                    Moderez les garages, gérez les utilisateurs et administrez la plateforme.
                </p>
            </section>

            {notification && (
                <div className="alert alert-info alert-dismissible" role="alert">
                    {notification}
                    <button type="button" className="btn-close" onClick={() => setNotification("")} />
                </div>
            )}

            {/* Tabs */}
            <ul className="nav nav-pills mb-4 flex-wrap gap-2">
                {tabs.map((tab) => (
                    <li className="nav-item" key={tab.key}>
                        <button
                            className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
                <li className="nav-item ms-auto">
                    <button className="nav-link text-danger" onClick={handleLogout}>
                        Déconnexion
                    </button>
                </li>
            </ul>

            {/* Content */}
            <div className="card border-0 shadow-sm rounded-4 p-4">
                {activeTab === "garages" && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="fw-bold fs-5 mb-0">Garages en attente de modération</h2>
                            <button className="btn btn-outline-primary btn-sm" onClick={loadGarages} disabled={loading}>
                                {loading ? "Chargement..." : "Actualiser"}
                            </button>
                        </div>
                        {garages.length === 0 ? (
                            <p className="text-muted">Aucun garage à modérer.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Téléphone</th>
                                            <th>Adresse</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {garages.map((g) => (
                                            <tr key={g.id_garage || g.idGarage || g.garageId || g.id}>
                                                <td className="fw-semibold">
                                                    {g.nom_garage || g.nomGarage || g.name || "Garage"}
                                                </td>
                                                <td>{g.email || g.email_garage || g.emailGarage || "-"}</td>
                                                <td>{g.telephone || g.telephone_garage || g.telephoneGarage || "-"}</td>
                                                <td>{g.adresse || g.adresse_garage || g.adresseGarage || "-"}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${
                                                            g.isValide || g.is_valide || g.valide
                                                                ? "bg-success"
                                                                : "bg-warning text-dark"
                                                        }`}
                                                    >
                                                        {g.isValide || g.is_valide || g.valide
                                                            ? "Validé"
                                                            : "En attente"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2 flex-wrap">
                                                        {!(g.isValide || g.is_valide || g.valide) ? (
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() =>
                                                                    handleValidateGarage(
                                                                        g.id_garage || g.idGarage || g.garageId || g.id,
                                                                        true
                                                                    )
                                                                }
                                                            >
                                                                Valider
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() =>
                                                                    handleValidateGarage(
                                                                        g.id_garage || g.idGarage || g.garageId || g.id,
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                Invalider
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() =>
                                                                handleDeleteGarage(
                                                                    g.id_garage || g.idGarage || g.garageId || g.id
                                                                )
                                                            }
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "users" && (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="fw-bold fs-5 mb-0">Gestion des utilisateurs</h2>
                            <button className="btn btn-outline-primary btn-sm" onClick={loadUsers} disabled={loading}>
                                {loading ? "Chargement..." : "Actualiser"}
                            </button>
                        </div>
                        {users.length === 0 ? (
                            <p className="text-muted">Aucun utilisateur trouvé.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Rôle</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id_utilisateur || u.idUser || u.userId || u.id}>
                                                <td className="fw-semibold">
                                                    {u.nom || u.nom_utilisateur || u.lastName || "-"}{" "}
                                                    {u.prenom || u.prenom_utilisateur || u.firstName || "-"}
                                                </td>
                                                <td>{u.email || u.email_utilisateur || "-"}</td>
                                                <td>
                                                    {Array.isArray(u.roles)
                                                        ? u.roles.join(", ")
                                                        : u.role || "-"}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() =>
                                                            handleDeleteUser(
                                                                u.id_utilisateur || u.idUser || u.userId || u.id
                                                            )
                                                        }
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "superadmin" && (
                    <div>
                        <h2 className="fw-bold fs-5 mb-3">Ajouter un super administrateur</h2>
                        <form onSubmit={handleCreateSuperAdmin} style={{ maxWidth: "480px" }}>
                            <div className="mb-3">
                                <label className="form-label">Adresse email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="admin@example.com"
                                    value={superAdminForm.email}
                                    onChange={(e) =>
                                        setSuperAdminForm((p) => ({ ...p, email: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Mot de passe temporaire</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={superAdminForm.mdp}
                                    onChange={(e) =>
                                        setSuperAdminForm((p) => ({ ...p, mdp: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={superAdminLoading}
                            >
                                {superAdminLoading ? "Création..." : "Créer le super admin"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
