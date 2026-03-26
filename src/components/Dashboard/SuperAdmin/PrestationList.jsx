
import React, { useEffect, useState } from "react";
import { getStoredAuth } from "../../../services/api";
import { deletePrestationGarage } from "../../../services/api";

const PrestationList = ({ api }) => {
  const [prestations, setPrestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = getStoredAuth();

  useEffect(() => {
    api(token)
      .then((data) => setPrestations(data.prestations || data || []))
      .finally(() => setLoading(false));
  }, [api, token]);

  if (loading) return <div>Chargement des prestations...</div>;
  if (!prestations.length) return <div>Aucune prestation trouvée.</div>;

  const handleDelete = (id) => {
    setLoading(true);
    // Il faut probablement fournir aussi garageId ici, à adapter selon la structure de tes données !
    // Si tu as besoin de l'id du garage, il faut le passer en paramètre.
    // Exemple : deletePrestationGarage(token, garageId, id)
    // Ici, je laisse comme deletePrestationGarage(token, id) pour garder la logique actuelle, mais à ajuster si besoin.
    deletePrestationGarage(token, id)
      .then(() => setPrestations((prev) => prev.filter((p) => p.idPrestation !== id)))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h4>Prestations</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Description</th>
            <th>Catégorie</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prestations.map((p) => (
            <tr key={p.idPrestation || p.id}>
              <td>{p.idPrestation || p.id}</td>
              <td>{p.nomPrestation || p.nom}</td>
              <td>{p.descriptionPrestation || p.description}</td>
              <td>{p.categorie?.nomCategorie || p.categorie}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.idPrestation || p.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrestationList;
