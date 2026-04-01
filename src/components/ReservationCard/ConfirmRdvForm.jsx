import React, { useState, useEffect } from "react";
import { confirmerRdv } from "../../api/rdvApi";

export default function ConfirmRdvForm({ vehicules, token, onRdvConfirme }) {
    const [reservationData, setReservationData] = useState(null);
    const [vehiculeSelectionne, setVehiculeSelectionne] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("reservationData");
        if (stored) setReservationData(JSON.parse(stored));
    }, []);

    if (!reservationData) return <p>Chargement du RDV...</p>;

    const { id_garage, id_prestation, date_debut, date_fin } = reservationData;

    const handleConfirm = async () => {
        if (!vehiculeSelectionne) return alert("Choisissez un véhicule !");

        try {
            const data = await confirmerRdv(reservationData, vehiculeSelectionne, token);
            alert("Rendez-vous confirmé !");
            localStorage.removeItem("reservationData");
            if (onRdvConfirme) onRdvConfirme(data);
        } catch (err) {
            alert("Erreur : " + err.message);
        }
    };

    return (
        <div className="confirm-rdv">
            <h2>Confirmer votre rendez-vous</h2>
            <p>Garage ID : {id_garage}</p>
            <p>Prestation ID : {id_prestation}</p>
            <p>Créneau : {date_debut} à {date_fin}</p>

            <select value={vehiculeSelectionne} onChange={(e) => setVehiculeSelectionne(e.target.value)}>
                <option value="">-- Choisir un véhicule --</option>
                {vehicules.map(v => (
                    <option key={v.id_vehicule} value={v.id_vehicule}>
                        {v.immatriculation} - {v.marque} {v.modele}
                    </option>
                ))}
            </select>

            <button onClick={handleConfirm}>Confirmer RDV</button>
        </div>
    );
}