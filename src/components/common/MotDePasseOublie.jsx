import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MotDePasseOublie = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Merci de renseigner votre adresse email.');
      setMessage('');
      return;
    }

    setError('');
    setMessage(`Aucun email automatique n'est envoye depuis cette demo pour le moment. Si vous etes deja connecte avec ${email}, changez directement votre mot de passe dans l'espace garage > Parametres > Securite du compte.`);
  };

  return (
    <main className="container py-5" style={{ maxWidth: 500 }}>
      <h1 className="fw-bold mb-3">Mot de passe oublie</h1>
      <p className="text-muted mb-4">
        Cette page est une maquette. Si vous etes deja connecte, utilisez maintenant le changement de mot de passe direct dans le dashboard garage.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="forgot-password-email">Adresse email</label>
          <input
            id="forgot-password-email"
            type="email"
            className="form-control"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="garage@exemple.fr"
          />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {message && <div className="alert alert-success py-2">{message}</div>}

        <button type="submit" className="btn btn-primary">
          Envoyer le lien de reinitialisation
        </button>
      </form>

      <Link to="/garage" className="btn btn-link px-0 mt-3">
        Retour a la connexion garage
      </Link>
    </main>
  );
};

export default MotDePasseOublie;
