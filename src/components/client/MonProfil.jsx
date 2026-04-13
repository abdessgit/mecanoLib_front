
import React, { useEffect, useState } from 'react';
import { getStoredAuth, getProfile, updateMyProfile } from '../../services/api';


const MonProfil = () => {
  const { token } = getStoredAuth();
  const [profile, setProfile] = useState({ nom: '', prenom: '', email: '', telephone: '' });
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? "" : "Vous devez être connecté.");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) return;

    getProfile(token)
      .then((data) => setProfile({
        nom: data.nom || data.data?.nom || '',
        prenom: data.prenom || data.data?.prenom || '',
        email: data.email || data.data?.email || '',
        telephone: data.tel || data.data?.tel || '',
      }))
      .catch(() => setError("Impossible de charger le profil."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await updateMyProfile(token, {
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email,
        telephone: profile.telephone,
      });
      setSuccess("Profil mis a jour avec succes.");
    } catch (err) {
      setError(err.message || "Impossible de mettre a jour le profil.");
    }
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
          <div className="mb-3">
            <label className="form-label">Telephone</label>
            <input type="text" className="form-control" name="telephone" value={profile.telephone} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary">Mettre à jour</button>
        </form>
      )}
    </main>
  );
};

export default MonProfil;
