import React from 'react';

const RechercheGarages = () => {
  return (
    <main className="container py-5" style={{maxWidth: 700}}>
      <h1 className="fw-bold mb-4">Recherche de garages</h1>
      <form className="mb-4">
        <div className="row g-2">
          <div className="col-md-6">
            <input type="text" className="form-control" placeholder="Ville ou code postal" name="ville" />
          </div>
          <div className="col-md-6">
            <input type="text" className="form-control" placeholder="Service recherché (ex: vidange)" name="service" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-3">Rechercher</button>
      </form>
      <div>
        <p>Résultats de recherche à afficher ici.</p>
      </div>
    </main>
  );
};

export default RechercheGarages;
