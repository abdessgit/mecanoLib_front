
import React, { useEffect, useState } from "react";
import { getStoredAuth } from "../../../services/api";
import { deleteGarage, validateGarage } from "../../../services/api";

const GarageList = ({ api }) => {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = getStoredAuth();

  useEffect(() => {
    api(token)
      .then((data) => setGarages(data.garages || data || []))
      .finally(() => setLoading(false));
  }, [api, token]);

  if (loading) return <div>Chargement des garages...</div>;
  if (!garages.length) return <div>Aucun garage trouvé.</div>;

  const handleValidate = (id) => {
    setLoading(true);
    validateGarage(token, id, true)
      .then(() => setGarages((prev) => prev.map((g) => g.idGarage === id ? { ...g, isValide: true } : g)))
      .finally(() => setLoading(false));
  };

  const handleDelete = (id) => {
    setLoading(true);
    deleteGarage(token, id)
      .then(() => setGarages((prev) => prev.filter((g) => g.idGarage !== id)))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h4>Garages</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Validé</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {garages.map((g) => (
            <tr key={g.idGarage || g.id}>
              <td>{g.idGarage || g.id}</td>
              <td>{g.nomGarage || g.nom}</td>
              <td>{g.emailGarage || g.email}</td>
              <td>{g.isValide ? "Oui" : "Non"}</td>
              <td>
                <button className="btn btn-success btn-sm" onClick={() => handleValidate(g.idGarage || g.id)}>Valider</button>
                <button className="btn btn-danger btn-sm ms-2" onClick={() => handleDelete(g.idGarage || g.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GarageList;
