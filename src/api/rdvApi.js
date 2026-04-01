// utils/rdvApi.js
export async function confirmerRdv(reservationData, idVehicule, token) {
    if (!idVehicule) throw new Error("Choisissez un véhicule !");

    const res = await fetch("http://127.0.0.1:8000/api/v1/creer_rdv", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            ...reservationData,
            id_vehicule: idVehicule
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur serveur");

    return data;
}