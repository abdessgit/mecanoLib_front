import React from 'react';

const MotDePasseOublie = () => {
  return (
    <main className="container py-5" style={{maxWidth: 500}}>
      <h1 className="fw-bold mb-4">Mot de passe oublié</h1>
      <form>
        <div className="mb-3">
          <label className="form-label">Adresse email</label>
          <input type="email" className="form-control" name="email" />
        </div>
        <button type="submit" className="btn btn-primary">Envoyer le lien de réinitialisation</button>
      </form>
    </main>
  );
};

export default MotDePasseOublie;
