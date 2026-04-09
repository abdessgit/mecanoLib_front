import React, { useContext, useEffect, useState } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import ConfirmRdvForm from "../../ReservationCard/ConfirmRdvForm";
import { useNavigate } from "react-router-dom";

import "./DashboardClient.css";

export default function DashboardClient() {
    const { logout, token, user } = useContext(AuthConnexion);
    const navigate = useNavigate();

    const [rdvs, setRdvs] = useState([]);
    const [client, setClient] = useState(null);
    const [vehicules, setVehicules] = useState([]);
    const [marques, setMarques] = useState([]);
    const [modeles, setModeles] = useState([]);
    const [newVehicule, setNewVehicule] = useState({
        immatriculation: "",
        annee: "",
        id_marque: "",
        id_modele: ""
    });
    // -----  gestion de la reservation ---------
    const [reservationData, setReservationData] = useState(null);

    // --- 2FA ---
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [is2FAActivated, setIs2FAActivated] = useState(false);
    const [code2FA, setCode2FA] = useState("");
    const [messageActivation, setMessageActivation] = useState("");
    const [messageValidation, setMessageValidation] = useState("");
    const [notification, setNotification] = useState(""); // pour messages 

    // --- Vérifier 2FA à la connexion ---
    useEffect(() => {
        if (!token) return;
        const check2FA = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/api/v1/users/connecter", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setIs2FAActivated(data.is2fa || false);
            } catch (err) {
                console.error(err);
            }
        };
        check2FA();
    }, [token]);


    // --- Activer 2FA ---
    const activer2FA = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/activer_2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessageActivation("Vérifie ton email pour scanner le QR code");
            setIs2FARequired(true);
            setIs2FAActivated(true);
        } catch (err) {
            setMessageActivation(err.message);
        }
    };

    // --- Désactiver 2FA ---
    const desactiver2FA = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/desactiver_2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setMessageValidation("2FA désactivé");
            setIs2FARequired(false);
            setIs2FAActivated(false);
        } catch (err) {
            setMessageValidation(err.message);
        }
    };

    // --- Validation du code 2FA ---
    const handle2FASubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/verify_2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: user.email, code: code2FA })
            });

            const text = await res.text();
            let data;
            try { data = JSON.parse(text); }
            catch { throw new Error("Réponse serveur invalide (pas du JSON)"); }

            if (!res.ok) throw new Error(data.message);

            setMessageValidation("2FA validé avec succès");
            setIs2FARequired(false);
        } catch (err) {
            setMessageValidation(err.message);
        }
    };

    // recharger tout les vehvule 
    const fetchVehicules = async (clientIdParam) => {
        const id = clientIdParam || client?.clientId;
        if (!id) return;

        try {
            const resVehicules = await fetch(
                `http://127.0.0.1:8000/api/v1/client/vehicules/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!resVehicules.ok) throw new Error(await resVehicules.text());

            const vehiculesData = await resVehicules.json();
            setVehicules(vehiculesData); //  rerender automatique

        } catch (err) {
            console.error("Erreur véhicules:", err);
        }
    };

    // --- Récupérer client + véhicules ---
    useEffect(() => {
        if (!token) return;

        const fetchClientAndVehicules = async () => {
            try {
                const resClient = await fetch('http://127.0.0.1:8000/api/v1/users/connecter', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!resClient.ok) throw new Error(await resClient.text());
                const userData = await resClient.json();
                setClient(userData);

                if (!userData.clientId) throw new Error("Client ID introuvable");

                const resVehicules = await fetch(`http://127.0.0.1:8000/api/v1/client/vehicules/${userData.clientId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!resVehicules.ok) throw new Error(await resVehicules.text());
                const vehiculesData = await resVehicules.json();
                setVehicules(vehiculesData);

            } catch (err) {
                console.error("Erreur API:", err);
            }
        };
        fetchClientAndVehicules();
    }, [token]);

    // --- Récupérer marques ---
    useEffect(() => {
        if (!token) return;
        fetch('http://127.0.0.1:8000/api/v1/choisir_marque', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setMarques(data))
            .catch(err => console.error(err));
    }, [token]);

    // --- Récupérer modèles selon marque ---
    useEffect(() => {
        if (!newVehicule.id_marque || !token) return setModeles([]);
        fetch(`http://127.0.0.1:8000/api/v1/choisir_modele/${newVehicule.id_marque}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setModeles(data))
            .catch(err => console.error(err));
    }, [newVehicule.id_marque, token]);

    // --- Ajouter véhicule ---
    const handleAddVehicule = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/v1/client/add_vehicule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newVehicule,
                    id_client: client.clientId
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // 👉 on recharge la vraie liste depuis la BDD
            await fetchVehicules(client.clientId);

            setNewVehicule({
                immatriculation: "",
                annee: "",
                id_marque: "",
                id_modele: ""
            });

            setNotification("Véhicule ajouté avec succès");

        } catch (err) {
            setNotification("Erreur: " + err.message);
        }
    };

    // --- Modifier véhicule ---
    const handleUpdateVehicule = async (id, updatedData) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/client/update_vehicule/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(updatedData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setVehicules(prev => prev.map(v => v.id_vehicule === id ? { ...v, ...updatedData } : v));
            setNotification("Véhicule modifié avec succès ");
        } catch (err) {
            setNotification("Erreur: " + err.message);
        }
    };

    // --- Supprimer véhicule ---
    const handleDeleteVehicule = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce véhicule ?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/client/delete_vehicule/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setVehicules(prev => prev.filter(v => v.id_vehicule !== id));
            setNotification("Véhicule supprimé avec succès ");
        } catch (err) {
            setNotification("Erreur: " + err.message);
        }
    };
    useEffect(() => {
        if (!client || !token) return;

        const fetchRdvs = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/v1/client/${client.clientId}/rdvs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const text = await res.text();
                if (!res.ok) throw new Error(text);
                const data = JSON.parse(text);

                setRdvs(data);

                //  Pour chaque RDV, récupérer son statut via l'endpoint dédié
                data.forEach(rdv => {
                    fetchStatusRdv(rdv.id_rdv);
                });

            } catch (err) {
                console.error("Erreur RDV:", err.message);
            }
        };

        fetchRdvs();
    }, [client, token]);

    // recuperation les information de connexion 

    useEffect(() => {
        // Récupérer les infos du RDV depuis le localStorage
        const stored = localStorage.getItem("reservationData");
        if (stored) {
            const data = JSON.parse(stored);

            const dateDebut = data.date_debut;
            const dateFin = data.date_fin;

            setReservationData({
                id_garage: data.id_garage,
                nom_garage: data.nom_garage,
                id_prestation: data.id_prestation,
                id_vehicule: data.id_vehicule || "",
                date_debut: dateDebut,
                date_fin: dateFin
            });
        }
    }, []);

    // --- Récupérer le statut d'un RDV par son id ---
    const fetchStatusRdv = async (rdvId) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/rdv/${rdvId}/status`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store"
            });

            if (!res.ok) throw new Error("Impossible de récupérer le statut du RDV");

            const data = await res.json();
            // Mettre à jour le RDV correspondant dans la liste
            setRdvs(prev => prev.map(r => r.id_rdv === rdvId ? { ...r, status: data.status } : r));
        } catch (err) {
            console.error("Erreur :", err.message);
        }
    };
    // la methode pour annuler un RDV 
    const annulerRdv = async (idRdv) => {
        if (!window.confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/annuler_rdv/${idRdv}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ motif: "Annulation client" })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            //  mise à jour immédiate du statut dans l'UI
            setRdvs(prev =>
                prev.map(r =>
                    r.id_rdv === idRdv ? { ...r, status: "Annulé" } : r
                )
            );

            setNotification("Rendez-vous annulé avec succès");

        } catch (err) {
            setNotification("Erreur : " + err.message);
        }
    };


    if (!client) return <p>Chargement...</p>;

    return (
        <div className="client-dashboard">
            <div className="client-dashboard-header">
                <h1>Bonjour {client.nom} {client.prenom}</h1>
                <p>Email : {client.email}</p>
                <button onClick={() => { logout(); navigate("/auth"); }}>Se déconnecter</button>
            </div>

            {/* 2FA */}
            {!is2FARequired && <div className="status success">Vous êtes connecté</div>}
            <div className="display-flex">

                <div className="status success blink">
                    <ConfirmRdvForm
                        reservationData={reservationData}
                        vehicules={vehicules}
                        token={token}
                        onRdvConfirme={(data) => setRdvs(prev => [...prev, data])}
                    />
                </div>

                <div className="security-section">

                    <h2>Sécurité du compte</h2>
                    <div className="btn-group">
                        <button className="btn primary" onClick={activer2FA} disabled={is2FAActivated}>
                            {is2FAActivated ? "2FA déjà activée" : "Activer 2FA"}
                        </button>
                        <button className="btn danger" onClick={desactiver2FA} disabled={!is2FAActivated}>
                            Désactiver 2FA
                        </button>
                    </div>
                    {messageActivation && <p className="info">{messageActivation}</p>}
                    {is2FARequired && (
                        <form onSubmit={handle2FASubmit} className="twofa-form">
                            <input type="text" placeholder="Entrez le code 2FA" value={code2FA}
                                onChange={e => setCode2FA(e.target.value)} required />
                            <button className="btn primary" type="submit">Valider 2FA</button>
                        </form>
                    )}
                    {messageValidation && <p className="success">{messageValidation}</p>}
                </div>
            </div>
            {/* Véhicules */}
            <div className="client-dashboard-vehicules">
                <h2>Mes véhicules</h2>
                {vehicules && vehicules.map(v => v ? (
                    <div key={v.id_vehicule} className="client-dashboard-vehicule-item">
                        <span>{v.immatriculation} - {v.marque} - {v.modele}</span>
                        <button onClick={() => {
                            const newImmat = prompt("Nouvelle immatriculation", v.immatriculation);
                            if (newImmat) handleUpdateVehicule(v.id_vehicule, { immatriculation: newImmat });
                        }}>Modifier</button>
                        <button onClick={() => handleDeleteVehicule(v.id_vehicule)}
                            style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}>Supprimer</button>
                    </div>
                ) : null)}
            </div>
            <div className="client-dashboard-rdvs">
                <h2>Mes rendez-vous</h2>

                {rdvs.length === 0 && <p>Aucun rendez-vous</p>}

                {rdvs.map(rdv => (
                    <div key={rdv.id_rdv} className="rdv-card">
                        <div className="rdv-date">
                            {rdv.date_debut} — {rdv.heure_debut}
                        </div>

                        <div>Garage : {rdv.garage}</div>
                        <div>Véhicule : {rdv.immatriculation}</div>
                        <div>Prestation : {rdv.prestation}</div>

                        <div className={`rdv-status ${rdv.status?.toLowerCase().replace(/\s/g, '-') || 'en-attente'}`}>
                            Statut : {rdv.status || "En attente"}
                        </div>

                        {/*  bouton annuler */}
                        {rdv.status !== "Annulé" && rdv.status !== "Terminé" && (
                            <button
                                className="btn-annuler-rdv"
                                onClick={() => annulerRdv(rdv.id_rdv)}
                            >
                                Annuler le RDV
                            </button>
                        )}

                    </div>
                ))}

            </div>

            {/* Ajouter véhicule */}
            <div className="client-dashboard-add-vehicule">
                <h2>Ajouter un véhicule</h2>
                {notification && <div className="notification">{notification}</div>}
                <input type="text" placeholder="Immatriculation" value={newVehicule.immatriculation}
                    onChange={e => setNewVehicule({ ...newVehicule, immatriculation: e.target.value })} />
                <input type="text" placeholder="Année" value={newVehicule.annee}
                    onChange={e => setNewVehicule({ ...newVehicule, annee: e.target.value })} />
                <select value={newVehicule.id_marque}
                    onChange={e => setNewVehicule({ ...newVehicule, id_marque: e.target.value, id_modele: "" })}>
                    <option value="">-- Choisir une marque --</option>
                    {marques.map(m => <option key={m.id_marque} value={m.id_marque}>{m.nom_marque}</option>)}
                </select>
                <select value={newVehicule.id_modele} disabled={!newVehicule.id_marque}
                    onChange={e => setNewVehicule({ ...newVehicule, id_modele: e.target.value })}>
                    <option value="">-- Choisir un modèle --</option>
                    {modeles.map(m => <option key={m.id_modele} value={m.id_modele}>{m.nom_modele}</option>)}
                </select>
                <button onClick={handleAddVehicule}>Ajouter</button>
            </div>

        </div>
    );
}