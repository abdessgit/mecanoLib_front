import React, { useEffect, useState } from "react";
import { getStoredAuth, deleteUser } from "../../../services/api";

const UserList = ({ api }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = getStoredAuth();

  useEffect(() => {
    api(token)
      .then((data) => setUsers(data.users || data || []))
      .finally(() => setLoading(false));
  }, [api, token]);


  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression de cet utilisateur ?")) return;
    try {
      await deleteUser(token, id);
      setUsers((prev) => prev.filter((u) => (u.idUtilisateur || u.id) !== id));
    } catch (e) {
      alert("Erreur lors de la suppression : " + (e.message || e));
    }
  };

  if (loading) return <div>Chargement des utilisateurs...</div>;
  if (!users.length) return <div>Aucun utilisateur trouvé.</div>;

  return (
    <div>
      <h4>Utilisateurs</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.idUtilisateur || u.id}>
              <td>{u.idUtilisateur || u.id}</td>
              <td>{u.emailUtilisateur || u.email}</td>
              <td>{u.role?.nomRole || u.role}</td>
              <td>
                {/* TODO: Boutons activer/désactiver/supprimer */}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.idUtilisateur || u.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
