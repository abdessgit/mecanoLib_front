
import React, { useState } from 'react';
import { getStoredAuth, createRendezVous } from '../../services/api';


const RendezVousNew = () => {
  const [garageId, setGarageId] = useState("");
  const [vehiculeId, setVehiculeId] = useState("");
  const [prestationId, setPrestationId] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const { token } = getStoredAuth();
      if (!token) throw new Error("Vous devez être connecté.");

      if (!garageId || !vehiculeId || !prestationId) {
        throw new Error("Renseignez garage, vehicule et prestation.");
      }

      const data = {
        garageId,
        vehiculeId,
        prestationId,
        date,
        heure,
        motif,
      };
      await createRendezVous(token, data);
      setSuccess("Votre demande de rendez-vous a bien été envoyée.");
      setGarageId("");
      setVehiculeId("");
      setPrestationId("");
      setDate("");
      setHeure("");
      setMotif("");
    } catch (err) {
      setError(err.message || "Erreur lors de la prise de rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: 600 }}>
      <h1 className="fw-bold mb-4">Prise de rendez-vous</h1>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">ID Garage</label>
          <input type="number" className="form-control" value={garageId} onChange={e => setGarageId(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">ID Vehicule</label>
          <input type="number" className="form-control" value={vehiculeId} onChange={e => setVehiculeId(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">ID Prestation</label>
          <input type="number" className="form-control" value={prestationId} onChange={e => setPrestationId(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input type="date" className="form-control" name="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Heure</label>
          <input type="time" className="form-control" name="heure" value={heure} onChange={e => setHeure(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Motif</label>
          <textarea className="form-control" name="motif" rows={3} value={motif} onChange={e => setMotif(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer la demande"}
        </button>
      </form>
    </main>
  );
};

export default RendezVousNew;
