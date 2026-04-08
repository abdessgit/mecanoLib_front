
import React, { useEffect, useState } from 'react';
import { getStoredAuth, getProfile, normalizeClientProfile } from '../../services/api';

const MonProfil = () => {
  const { token } = getStoredAuth();
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    codePostal: '',
    adresse: '',
    codeInsee: '',
  });
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? '' : 'Vous devez être connecté.');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    getProfile(token)
      .then((data) => setProfile(normalizeClientProfile(data)))
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSuccess('Profil mis à jour (simulation).');
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
            <label className="form-label">Téléphone</label>
            <input type="text" className="form-control" name="telephone" value={profile.telephone || ''} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Ville</label>
            <input type="text" className="form-control" name="ville" value={profile.ville || ''} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Code postal</label>
            <input type="text" className="form-control" name="codePostal" value={profile.codePostal || ''} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Adresse</label>
            <input type="text" className="form-control" name="adresse" value={profile.adresse || ''} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Code INSEE</label>
            <input type="text" className="form-control" name="codeInsee" value={profile.codeInsee || ''} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary">Mettre à jour</button>
        </form>
      )}
    </main>
  );
};

export default MonProfil;
