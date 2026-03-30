
import React, { useEffect, useState } from "react";
import { getStoredAuth } from "../../../services/api";
import { deleteAvis } from "../../../services/api";

const AvisList = ({ api }) => {
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = getStoredAuth();

  useEffect(() => {
    api(token)
      .then((data) => setAvis(data.avis || data || []))
      .finally(() => setLoading(false));
  }, [api, token]);

  if (loading) return <div>Chargement des avis...</div>;
  if (!avis.length) return <div>Aucun avis trouvé.</div>;

  const handleDelete = (id) => {
    setLoading(true);
    deleteAvis(token, id)
      .then(() => setAvis((prev) => prev.filter((a) => a.idAvis !== id)))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h4>Avis</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Note</th>
            <th>Commentaire</th>
            <th>Garage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {avis.map((a) => (
            <tr key={a.idAvis || a.id}>
              <td>{a.idAvis || a.id}</td>
              <td>{a.note}</td>
              <td>{a.commentaire}</td>
              <td>{a.garage?.nomGarage || a.garage}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.idAvis || a.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AvisList;
