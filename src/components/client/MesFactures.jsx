import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientFacturesSnapshot, getStoredAuth } from '../../services/api';


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
        const data = await getClientFacturesSnapshot(token);
        setFactures(Array.isArray(data) ? data : []);
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
      {!loading && !error && factures.length === 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center flex-wrap gap-3">
          <span>Aucune facture émise pour le moment. Les interventions terminées apparaitront ici.</span>
          <Link to="/client/rendez-vous" className="btn btn-sm btn-outline-secondary">Voir mes rendez-vous</Link>
        </div>
      )}
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
            <tr key={facture.id || facture.reference || idx}>
              <td>{facture.date || facture.date_facture || "-"}</td>
              <td>{facture.garage?.nomGarage || facture.garage?.nom_garage || facture.garage_name || facture.garage || "-"}</td>
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
