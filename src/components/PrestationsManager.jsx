import React, { useEffect, useState } from "react";
import {
  getPrestationsByGarage,
  getPropositionsByGarage,
  getCategories,
  getPrestationsByCategorie,
  addPrestationsGarage,
  deletePrestationGarage,
} from "../api/garageApi.js";

function storageKey(garageId) {
  return `garage_prestations_${garageId}`;
}

function loadLocalPrestations(garageId) {
  try {
    const raw = localStorage.getItem(storageKey(garageId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPrestations(garageId, list) {
  try {
    localStorage.setItem(storageKey(garageId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function PrestationsManager({ token, garageId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [garagePrestations, setGaragePrestations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryPrestations, setCategoryPrestations] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [debugText, setDebugText] = useState("");

  const showError = (msg) => {
    setError(msg);
    setSuccess("");
    setTimeout(() => setError(""), 4000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const getPrestationName = (p) =>
    p?.nom_prestation ?? p?.nomPrestation ?? p?.nom ?? p?.libelle ?? "Prestation";

  const getPrestationId = (p) =>
    p?.id_prestation ?? p?.idPrestation ?? p?.id;

  const getCategoryName = (cat) =>
    cat?.nom_categorie ?? cat?.nomCategorie ?? cat?.nom ?? cat?.libelle ?? "Catégorie";

  const getCategoryId = (cat) =>
    cat?.id_categorie ?? cat?.idCategorie ?? cat?.id;

  const getPrestationCategoryName = (p) => {
    const cat = p?.categorie ?? p?.category ?? p?.prestation?.categorie ?? p?.prestation?.category;
    return getCategoryName(cat);
  };

  const normalizeApiList = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.prestations)) return res.prestations;
    if (Array.isArray(res?.propositions)) return res.propositions;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.garage?.prestations)) return res.garage.prestations;
    return [];
  };

  const loadFromBackend = async () => {
    if (!token || !garageId) return;
    setLoading(true);
    let combined = [];

    try {
      // 1) Propositions (avec prix)
      let propRes = null;
      try {
        propRes = await getPropositionsByGarage(garageId, token);
      } catch (e) {
        /* ignore */ }

      const propositions = normalizeApiList(propRes);

      // 2) Prestations by garage (fallback)
      let gpRes = null;
      try {
        gpRes = await getPrestationsByGarage(token, garageId);
      } catch (e) {
        /* ignore */ }

      const gp = normalizeApiList(gpRes);

      combined = propositions.length > 0 ? propositions : gp;
      setDebugText(JSON.stringify({ propositions, gp }, null, 2).slice(0, 2000));
    } catch (err) {
      setDebugText(String(err?.message || "ERREUR"));
    }

    // Fusion avec le localStorage
    const local = loadLocalPrestations(garageId);
    const backendIds = new Set(combined.map((p) => String(getPrestationId(p?.prestation || p))));
    const merged = [...combined, ...local.filter((l) => !backendIds.has(String(getPrestationId(l?.prestation || l))))];

    setGaragePrestations(merged);
    setLoading(false);
  };

  const loadCategories = async () => {
    if (!token) return;
    try {
      const res = await getCategories(token);
      const list = normalizeApiList(res);
      setCategories(list);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadFromBackend();
    loadCategories();
  }, [token, garageId]);

  const openAddModal = () => {
    setSelectedCategoryId("");
    setCategoryPrestations([]);
    setSelectedItems({});
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedCategoryId("");
    setCategoryPrestations([]);
    setSelectedItems({});
  };

  const handleCategoryChange = async (e) => {
    const catId = e.target.value;
    setSelectedCategoryId(catId);
    setSelectedItems({});
    if (!catId) {
      setCategoryPrestations([]);
      return;
    }
    try {
      const res = await getPrestationsByCategorie(catId);
      setCategoryPrestations(normalizeApiList(res));
    } catch {
      setCategoryPrestations([]);
    }
  };

  const toggleItem = (id) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { checked: true, price: "" };
      }
      return next;
    });
  };

  const setItemPrice = (id, price) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], price },
    }));
  };

  const isAlreadyInGarage = (prestationId) => {
    return garagePrestations.some((gp) => {
      const pid = getPrestationId(gp?.prestation || gp);
      return pid === prestationId || String(pid) === String(prestationId);
    });
  };

  const handleAdd = async () => {
    if (!token || !garageId) return;
    const entries = Object.entries(selectedItems).filter(([_, v]) => v.checked);
    if (entries.length === 0) {
      showError("Veuillez sélectionner au moins une prestation.");
      return;
    }

    const invalid = entries.filter(([_, v]) => !v.price || Number(v.price) <= 0);
    if (invalid.length > 0) {
      showError("Veuillez saisir un prix valide pour chaque prestation sélectionnée.");
      return;
    }

    const payload = entries.map(([id, v]) => ({
      prestationId: Number(id),
      prix: Number(v.price),
    }));

    setLoading(true);
    try {
      await addPrestationsGarage(token, garageId, payload);
      showSuccess("Prestation(s) ajoutée(s) avec succès.");

      // Création des objets à ajouter localement
      const newPrestations = entries.map(([id, v]) => {
        const prestationObj = categoryPrestations.find(
          (cp) => String(getPrestationId(cp)) === String(id)
        );
        return {
          prestation: prestationObj || { id_prestation: Number(id) },
          prix: Number(v.price),
        };
      });

      // Mise à jour du state + localStorage
      setGaragePrestations((prev) => {
        const next = [...prev, ...newPrestations];
        saveLocalPrestations(garageId, next);
        return next;
      });

      closeAddModal();
    } catch (err) {
      showError(err?.message || "Impossible d'ajouter les prestations.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prestationId) => {
    if (!token || !garageId || !prestationId) return;
    if (!window.confirm("Supprimer cette prestation du garage ?")) return;
    try {
      await deletePrestationGarage(token, garageId, prestationId);
      showSuccess("Prestation supprimée avec succès.");
      setGaragePrestations((prev) => {
        const next = prev.filter((p) => {
          const pid = getPrestationId(p?.prestation || p);
          return String(pid) !== String(prestationId);
        });
        saveLocalPrestations(garageId, next);
        return next;
      });
    } catch (err) {
      showError(err?.message || "Impossible de supprimer la prestation.");
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div className="garage-dashboard-content-header">
        <h3 className="garage-dashboard-header-title">Prestations du garage</h3>
        <button
          onClick={openAddModal}
          disabled={loading || !garageId}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid transparent",
            fontWeight: 500,
            cursor: "pointer",
            background: "#facc15",
            color: "#000",
          }}
        >
          + Ajouter une prestation
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#2a0a0a",
            border: "1px solid #3d1515",
            color: "#ffffff",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: "#1a2a0a",
            border: "1px solid #2d3d15",
            color: "#facc15",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          {success}
        </div>
      )}

      {debugText && (
        <details style={{ marginBottom: "1rem", color: "#aaa" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem" }}>Debug API</summary>
          <pre
            style={{
              background: "#0a0a0a",
              border: "1px solid #333",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              maxHeight: "200px",
              overflow: "auto",
              color: "#facc15",
              whiteSpace: "pre-wrap",
            }}
          >
            {debugText}
          </pre>
        </details>
      )}

      {loading && garagePrestations.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", gap: "0.75rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid #333333",
              borderTop: "3px solid #facc15",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
          <span style={{ color: "#aaaaaa", fontSize: "0.9375rem" }}>Chargement...</span>
        </div>
      ) : garagePrestations.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "#888888",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Aucune prestation associée à ce garage.</p>
          <small>Cliquez sur "Ajouter une prestation" pour enrichir votre catalogue.</small>
        </div>
      ) : (
        <table className="garage-dashboard-table">
          <thead>
            <tr>
              <th>Prestation</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {garagePrestations.map((p, index) => {
              const prestation = p?.prestation || p;
              const rawId = getPrestationId(prestation) || getPrestationId(p);
              const reactKey = rawId ? String(rawId) : `gp-${index}`;
              const prix = p?.prix ?? p?.price ?? p?.tarif ?? "-";
              return (
                <tr key={reactKey}>
                  <td>
                    <strong>{getPrestationName(prestation)}</strong>
                  </td>
                  <td>{getPrestationCategoryName(p) || getPrestationCategoryName(prestation) || "-"}</td>
                  <td>{typeof prix === "number" ? prix.toFixed(2) : prix} €</td>
                  <td>
                    <button
                      onClick={() => handleDelete(rawId)}
                      disabled={loading}
                      style={{
                        padding: "0.4rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #3d1515",
                        background: "#2a0a0a",
                        color: "#ffffff",
                        cursor: "pointer",
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal Ajouter */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            padding: "1rem",
          }}
          onClick={closeAddModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "#111111",
              borderRadius: "1rem",
              border: "1px solid #333333",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #333333",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#ffffff" }}>
                Ajouter une ou plusieurs prestations
              </h3>
              <button
                onClick={closeAddModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  lineHeight: 1,
                  cursor: "pointer",
                  color: "#aaaaaa",
                }}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#eeeeee",
                  marginBottom: "0.5rem",
                }}
              >
                Catégorie
              </label>
              <select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 1rem",
                  fontSize: "0.875rem",
                  color: "#eeeeee",
                  background: "#1a1a1a",
                  border: "1px solid #444444",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  marginBottom: "1rem",
                }}
              >
                <option value="">-- Choisir une catégorie --</option>
                {categories.map((cat, index) => (
                  <option key={getCategoryId(cat) || `cat-${index}`} value={getCategoryId(cat)}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>

              {!selectedCategoryId ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#888888",
                    fontStyle: "italic",
                  }}
                >
                  Veuillez d'abord choisir une catégorie.
                </div>
              ) : categoryPrestations.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#888888",
                    fontStyle: "italic",
                  }}
                >
                  Aucune prestation disponible dans cette catégorie.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    maxHeight: "320px",
                    overflowY: "auto",
                    padding: "0.5rem",
                    background: "#0a0a0a",
                    borderRadius: "0.5rem",
                    border: "1px solid #333333",
                  }}
                >
                  {categoryPrestations.map((p, index) => {
                    const rawId = getPrestationId(p);
                    const reactKey = rawId ? String(rawId) : `cp-${index}`;
                    const alreadyAdded = isAlreadyInGarage(rawId);
                    const isSelected = !!selectedItems[rawId];
                    return (
                      <div
                        key={reactKey}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.75rem",
                          background: isSelected ? "#1a1a1a" : "#111111",
                          border: "1px solid",
                          borderColor: isSelected ? "#facc15" : "#333333",
                          borderRadius: "0.5rem",
                          opacity: alreadyAdded ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={alreadyAdded}
                          onChange={() => toggleItem(rawId)}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: alreadyAdded ? "not-allowed" : "pointer",
                            accentColor: "#facc15",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: alreadyAdded ? "#888888" : "#ffffff",
                              fontWeight: 500,
                            }}
                          >
                            {getPrestationName(p)}
                            {alreadyAdded && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#facc15",
                                  marginLeft: "0.5rem",
                                }}
                              >
                                (déjà ajoutée)
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#888888",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p?.descriptionprestation ?? p?.description ?? ""}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Prix"
                          disabled={alreadyAdded || !isSelected}
                          value={selectedItems[rawId]?.price || ""}
                          onChange={(e) => setItemPrice(rawId, e.target.value)}
                          style={{
                            width: "100px",
                            height: "36px",
                            padding: "0 0.5rem",
                            fontSize: "0.875rem",
                            color: "#eeeeee",
                            background: "#1a1a1a",
                            border: "1px solid #444444",
                            borderRadius: "0.375rem",
                            opacity: alreadyAdded || !isSelected ? 0.5 : 1,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                padding: "0.75rem 1.25rem",
                borderTop: "1px solid #333333",
              }}
            >
              <button
                onClick={closeAddModal}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #444444",
                  background: "#111111",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  !selectedCategoryId ||
                  categoryPrestations.length === 0 ||
                  Object.keys(selectedItems).length === 0 ||
                  loading
                }
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid transparent",
                  background: "#facc15",
                  color: "#000",
                  cursor:
                    !selectedCategoryId ||
                    categoryPrestations.length === 0 ||
                    Object.keys(selectedItems).length === 0 ||
                    loading
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !selectedCategoryId ||
                    categoryPrestations.length === 0 ||
                    Object.keys(selectedItems).length === 0 ||
                    loading
                      ? 0.6
                      : 1,
                }}
              >
                {loading ? "Ajout..." : "Ajouter la sélection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
