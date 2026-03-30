
import React, { useEffect, useState } from 'react';
import { getStoredAuth, getProfile } from '../../services/api';


const MonProfil = () => {
  const [profile, setProfile] = useState({ nom: '', prenom: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const { token } = getStoredAuth();
    if (!token) {
      setError("Vous devez être connecté.");
      setLoading(false);
      return;
    }
    getProfile(token)
      .then((data) => setProfile({
        nom: data.nom || data.data?.nom || '',
        prenom: data.prenom || data.data?.prenom || '',
        email: data.email || data.data?.email || '',
      }))
      .catch(() => setError("Impossible de charger le profil."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    // TODO: Ajouter l'appel API pour mettre à jour le profil
    setSuccess("Profil mis à jour (simulation).");
  };

  return (
    <main className="container py-5" style={{ maxWidth: 600 }}>
      <h1 className="fw-bold mb-4">Mon profil</h1>
      {loading && <div className="alert alert-info">Chargement...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {!loading && !error && (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nom</label>
            <input type="text" className="form-control" name="nom" value={profile.nom} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Prénom</label>
            <input type="text" className="form-control" name="prenom" value={profile.prenom} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" value={profile.email} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary">Mettre à jour</button>
        </form>
      )}
    </main>
  );
};

export default MonProfil;
