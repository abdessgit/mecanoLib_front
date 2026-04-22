import React, { useState, useEffect } from "react";
import { confirmerRdv } from "../../api/rdvApi";
import "./ConfirmRdvForm.css";

export default function ConfirmRdvForm({ vehicules, token, onRdvConfirme }) {
    const [reservationData, setReservationData] = useState(null);
    const [vehiculeSelectionne, setVehiculeSelectionne] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("reservationData");
        if (stored) setReservationData(JSON.parse(stored));
    }, []);

    //  aucun rdv en attente
    if (!reservationData) {
        return (
            <div className="confirm-rdv empty">
                <h2>Aucun rendez-vous à confirmer</h2>
            </div>
        );
    }

    const {
        nom_garage,
        nom_categorie,
        nom_prestation,
        date_debut,
        date_fin,
    } = reservationData;

    const prestationLabel = nom_prestation || nom_categorie || reservationData.nom_prestation || reservationData.nom_categorie;

    const handleConfirm = async () => {
        if (!vehiculeSelectionne) {
            setMessage("Veuillez choisir un véhicule");
            return;
        }

        try {
            const rdv = await confirmerRdv(reservationData, vehiculeSelectionne, token);

            // supprimer la demande en attente
            localStorage.removeItem("reservationData");
            setReservationData(null);

            // afficher message succès
            setMessage("Votre rendez-vous a été confirmé ");
            if (typeof onRdvConfirme === "function") {
                await onRdvConfirme(rdv);
            }

        } catch (err) {
            setMessage("Erreur : " + err.message);
        }
    };

    return (
        <div className="confirm-rdv">
            <h2>Confirmer votre rendez-vous</h2>

            {message && <div className="rdv-message">{message}</div>}


            <p>Nom Garage : {nom_garage}</p>
            <p>Prestation  : {prestationLabel}</p>
            <p>Créneau : {date_debut} à {date_fin}</p>

            <select
                value={vehiculeSelectionne}
                onChange={(e) => setVehiculeSelectionne(e.target.value)}
            >
                <option value="">-- Choisir un véhicule --</option>

                {vehicules && vehicules.length > 0 ? (
                    vehicules.map(v => (
                        <option key={v.id_vehicule} value={v.id_vehicule}>
                            {v.immatriculation} - {v.marque} {v.modele}
                        </option>
                    ))
                ) : (
                    <option disabled>Aucun véhicule disponible</option>
                )}
            </select>

            <button onClick={handleConfirm}>Confirmer RDV</button>
        </div>
    );
}
