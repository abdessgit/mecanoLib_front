import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClientDevisSnapshot, getStoredAuth } from '../../services/api';


const MesDevis = () => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDevis = async () => {
      setLoading(true);
      setError("");
      try {
        const { token } = getStoredAuth();
        if (!token) throw new Error("Vous devez être connecté.");
        const data = await getClientDevisSnapshot(token);
        setDevis(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement des devis.");
      } finally {
        setLoading(false);
      }
    };
    fetchDevis();
  }, []);

  return (
    <main className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="fw-bold mb-4">Mes devis</h1>
      {loading && <div className="alert alert-info">Chargement...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && devis.length === 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center flex-wrap gap-3">
          <span>Aucun devis disponible pour le moment. Vous pouvez lancer une nouvelle demande de rendez-vous.</span>
          <Link to="/garages" className="btn btn-sm btn-warning">Trouver un garage</Link>
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
          {devis.length === 0 && !loading && (
            <tr><td colSpan={4} className="text-center">Aucun devis trouvé.</td></tr>
          )}
          {devis.map((devisItem, idx) => (
            <tr key={devisItem.id || idx}>
              <td>{devisItem.date || devisItem.date_devis || "-"}</td>
              <td>{devisItem.garage?.nom_garage || devisItem.garage_name || devisItem.garage || "-"}</td>
              <td>{devisItem.montant ? `${devisItem.montant} €` : "-"}</td>
              <td>{devisItem.status || devisItem.etat || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default MesDevis;
