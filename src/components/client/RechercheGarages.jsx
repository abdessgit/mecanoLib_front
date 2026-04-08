import React, { useState } from 'react';
import { getFrenchCitySuggestions } from '../../services/api';

const RechercheGarages = () => {
  const [form, setForm] = useState({ ville: '', service: '' });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);

  const handleCityChange = async (value) => {
    setForm((current) => ({ ...current, ville: value }));

    if (!value.trim()) {
      setCitySuggestions([]);
      return;
    }

    setCityLoading(true);
    try {
      const suggestions = await getFrenchCitySuggestions(value);
      setCitySuggestions(suggestions);
    } catch {
      setCitySuggestions([]);
    } finally {
      setCityLoading(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: 700 }}>
      <h1 className="fw-bold mb-4">Recherche de garages</h1>
      <form className="mb-4" onSubmit={(e) => e.preventDefault()}>
        <div className="row g-2">
          <div className="col-md-6 position-relative">
            <input
              type="text"
              className="form-control"
              placeholder="Ville ou code postal"
              name="ville"
              value={form.ville}
              onChange={(e) => handleCityChange(e.target.value)}
              autoComplete="off"
            />
            {cityLoading && <small className="text-muted d-block mt-1">Recherche des villes...</small>}
            {citySuggestions.length > 0 && (
              <div className="list-group mt-2">
                {citySuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.city}-${suggestion.postcode}-${suggestion.codeInsee}`}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => {
                      setForm((current) => ({ ...current, ville: suggestion.label }));
                      setCitySuggestions([]);
                    }}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Service recherché (ex: vidange)"
              name="service"
              value={form.service}
              onChange={(e) => setForm((current) => ({ ...current, service: e.target.value }))}
            />
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
