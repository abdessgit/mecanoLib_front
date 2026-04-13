import React, { useEffect, useState } from 'react';
import { getStoredAuth, getProfile, getClientRendezVous } from '../../services/api';


const TousRendezVous = () => {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRdvs = async () => {
      setLoading(true);
      setError("");
      try {
        const { token } = getStoredAuth();
        if (!token) throw new Error("Vous devez être connecté.");
        const profile = await getProfile(token);
        const clientId = profile?.id || profile?.data?.id;
        if (!clientId) throw new Error("Impossible de récupérer l'identifiant client.");
        const data = await getClientRendezVous(token, clientId);
        setRdvs(Array.isArray(data) ? data : (data?.rdv || data?.data || []));
      } catch (err) {
        setError(err.message || "Erreur lors du chargement des rendez-vous.");
      } finally {
        setLoading(false);
      }
    };
    fetchRdvs();
  }, []);

  return (
    <main className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="fw-bold mb-4">Tous mes rendez-vous</h1>
      {loading && <div className="alert alert-info">Chargement...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Date</th>
            <th>Heure</th>
            <th>Garage</th>
            <th>Motif</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rdvs.length === 0 && !loading && (
            <tr><td colSpan={5} className="text-center">Aucun rendez-vous trouvé.</td></tr>
          )}
          {rdvs.map((rdv, idx) => (
            <tr key={rdv.id || idx}>
              <td>{rdv.date || rdv.date_rdv || rdv.dateDebut?.split(" ")?.[0] || "-"}</td>
              <td>{rdv.heure || rdv.heure_rdv || rdv.dateDebut?.split(" ")?.[1] || "-"}</td>
              <td>{rdv.garage?.nom_garage || rdv.garage_name || rdv.garage || "-"}</td>
              <td>{rdv.motif || rdv.service || rdv.prestation || "-"}</td>
              <td>{rdv.status || rdv.etat || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default TousRendezVous;
