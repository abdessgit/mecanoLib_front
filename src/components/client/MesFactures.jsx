import React, { useEffect, useState } from 'react';
import { getStoredAuth, getProfile } from '../../services/api';


const MesFactures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFactures = async () => {
      setLoading(true);
      setError("");
      try {
        const { token } = getStoredAuth();
        if (!token) throw new Error("Vous devez être connecté.");
        const profile = await getProfile(token);
        const clientId = profile?.id || profile?.data?.id;
        if (!clientId) throw new Error("Impossible de récupérer l'identifiant client.");
        // Remplacer par l'appel API réel pour les factures du client
        // Exemple fictif : const data = await getFacturesClient(token, clientId);
        const data = [];
        setFactures(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        setError(err.message || "Erreur lors du chargement des factures.");
      } finally {
        setLoading(false);
      }
    };
    fetchFactures();
  }, []);

  return (
    <main className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="fw-bold mb-4">Mes factures</h1>
      {loading && <div className="alert alert-info">Chargement...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Date</th>
            <th>Garage</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {factures.length === 0 && !loading && (
            <tr><td colSpan={4} className="text-center">Aucune facture trouvée.</td></tr>
          )}
          {factures.map((facture, idx) => (
            <tr key={facture.id || idx}>
              <td>{facture.date || facture.date_facture || "-"}</td>
              <td>{facture.garage?.nom_garage || facture.garage_name || facture.garage || "-"}</td>
              <td>{facture.montant ? `${facture.montant} €` : "-"}</td>
              <td>{facture.status || facture.etat || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default MesFactures;
