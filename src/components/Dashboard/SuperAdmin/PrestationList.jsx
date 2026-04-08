
import React, { useEffect, useState } from "react";
import { getStoredAuth } from "../../../services/api";
import { deletePrestationGarage } from "../../../services/api";
import { deletePrestation } from "../../../services/api";

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

  const handleDelete = (garageId, prestationId) => {
    if (!prestationId) return;
    setLoading(true);
    const deleteAction = garageId
      ? deletePrestationGarage(token, garageId, prestationId)
      : deletePrestation(token, prestationId)

    deleteAction
      .then(() => {
        setPrestations((prev) =>
          prev.filter((p) => {
            const pGarageId = p.id_garage || p.idGarage || p.garage?.idGarage || p.garage?.id
            const pPrestationId = p.id_prestation || p.idPrestation || p.id

            if (!garageId) {
              return String(pPrestationId) !== String(prestationId)
            }

            return !(String(pGarageId) === String(garageId) && String(pPrestationId) === String(prestationId))
          })
        )
      })
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
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(p.id_garage || p.idGarage || p.garage?.idGarage || p.garage?.id, p.id_prestation || p.idPrestation || p.id)}
                  disabled={!(p.id_prestation || p.idPrestation || p.id)}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrestationList;
