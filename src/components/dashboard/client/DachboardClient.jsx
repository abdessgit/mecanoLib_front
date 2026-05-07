import React, { useContext, useEffect, useState } from "react";
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import ConfirmRdvForm from "../../ReservationCard/ConfirmRdvForm";
import { useNavigate } from "react-router-dom";
import { getClientRendezVous } from "../../../services/apiGarage.js";

import "./DashboardClient.css";

function parseClientDate(value) {
    if (!value) return null;
    const str = String(value).trim();

    // "YYYY-MM-DD HH:mm(:ss)" -> local time
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(str)) {
        const [d, t] = str.split(/\s+/);
        const isoLocal = `${d}T${t.length === 5 ? `${t}:00` : t}`;
        const parsed = new Date(isoLocal);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeClientRdv(rdv) {
    const dateValue = rdv?.dateDebut || rdv?.date_debut || rdv?.date || "";
    const parsedDate = dateValue ? parseClientDate(dateValue) : null;
    const isValidDate = parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime());

    return {
        id_rdv: rdv?.id_rdv || rdv?.idRdv || rdv?.id || Math.random().toString(36).slice(2),
        date_debut: isValidDate ? parsedDate.toLocaleDateString("fr-FR") : dateValue || "-",
        heure_debut: isValidDate
            ? parsedDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : rdv?.heure_debut || "-",
        garage: rdv?.garage?.nom_garage || rdv?.garage?.nomGarage || rdv?.nom_garage || rdv?.nomGarage || "-",
        immatriculation: rdv?.vehicule?.immatriculation || rdv?.immatriculation || "-",
        prestation: rdv?.prestation?.nom_prestation || rdv?.prestation?.nomPrestation || rdv?.nom_prestation || rdv?.nomPrestation || "-",
        status: rdv?.status?.libStatusRdv || rdv?.status?.lib_status_rdv || rdv?.status || "En attente",
    };
}

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
    const [notificationCar, setNotificationCar] = useState("");
    const [notificationRdv, setNotificationRdv] = useState("");

    // affichage des rdvs 
    const fetchClientRdvs = async () => {
        if (!token || !client?.clientId) return;

        try {
            const data = await getClientRendezVous(token, client.clientId);


            const rdvList = Array.isArray(data) ? data : [];

            setRdvs(rdvList);
            setNotificationRdv("");
        } catch (err) {
            console.error("Erreur RDV:", err.message);
            setNotificationRdv("Impossible de charger les rendez-vous.");
        }
    };

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
            const token = localStorage.getItem("token");

            const res = await fetch("http://127.0.0.1:8000/api/v1/users/activer_2fa", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
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
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
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
            catch { throw new Error("Réponse serveur invalide c'est du JSON"); }

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
            setVehicules(vehiculesData);

        } catch (err) {
            console.error("Erreur véhicules:", err);
        }
    };

    // --- Récupérer client + ces véhicules ---
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


                await fetchVehicules(userData.clientId);


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

            //  on recharge la liste des vehcule
            await fetchVehicules(client.clientId);

            setNewVehicule({
                immatriculation: "",
                annee: "",
                id_marque: "",
                id_modele: ""
            });

            setNotificationCar("Véhicule ajouté avec succès");

        } catch (err) {
            setNotificationCar("Erreur: " + err.message);
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
            setNotificationCar("Véhicule modifié avec succès ");
        } catch (err) {
            setNotificationCar("Erreur: " + err.message);
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
            setNotificationCar("Véhicule supprimé avec succès ");
        } catch (err) {
            setNotificationCar("Erreur: " + err.message);
        }
    };
    useEffect(() => {
        if (!client || !token) return;
        fetchClientRdvs();
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
    // la methode pour annuler un RDV 

    const annulerRdv = async (idRdv) => {
        if (!window.confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/annuler_rdv/${idRdv}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ motif: "Annulation client" })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            //  on utilise le status renvoyé par l’API 
            setRdvs(prev =>
                prev.map(r =>
                    r.id_rdv === idRdv ? { ...r, status: data.status } : r
                )
            );

            setNotificationRdv(data.message);

        } catch (err) {
            setNotificationRdv("Erreur : " + err.message);
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

            {!is2FARequired && <div className="status success">Vous êtes connecté</div>}
            <div className="display-flex">

                <div className="status success blink">
                    <ConfirmRdvForm
                        reservationData={reservationData}
                        vehicules={vehicules}
                        token={token}
                        onRdvConfirme={fetchClientRdvs}
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
                {notificationCar && <div className="notification">{notificationCar}</div>}
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
                {notificationRdv && <div className="notification">{notificationRdv}</div>}
                <h2>Mes rendez-vous</h2>
                {rdvs.length === 0 && <p>Aucun rendez-vous</p>}
                {rdvs.map(rdv => (
                    <div key={rdv.id_rdv} className="rdv-card">
                        <div className="rdv-date">
                            {rdv.date_debut?.date
                                ? new Date(rdv.date_debut.date).toLocaleString()
                                : rdv.date_debut}
                        </div>
                        <div>Garage : {rdv.garage}</div>
                        <div>Véhicule : {rdv.immatriculation}</div>
                        <div>Prestation : {rdv.prestation}</div>

                        <div className={`rdv-status ${rdv.status?.toLowerCase().replace(/\s/g, '-') || 'En-attente'}`}>
                            Statut : {rdv.status || "En attente"}
                        </div>
                        {/*  bouton annuler */}
                        {rdv.status !== "AnnulerClient" && rdv.status !== "Terminer" && rdv.status !== "Refuser" && (
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
                {notificationCar && <div className="notification">{notificationCar}</div>}

                <h2>Ajouter un véhicule</h2>

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
