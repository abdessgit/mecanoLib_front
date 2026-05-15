const API = "http://127.0.0.1:8000/api/v1";
// affichage des prestation en fonction de la categorie 
export async function getPrestationsByCategorie(idCategorie) {
    const res = await fetch(`${API}/get_prestations_by_categorie/${idCategorie}`);
    if (!res.ok) throw new Error("Erreur chargement prestations");
    return await res.json();
}
// affichage les prestation en fonction du garage 
export async function getPrestationsByGarage(idGarage) {
    const res = await fetch(`${API}/get_prestations_by_garage/${idGarage}`);
    if (!res.ok) throw new Error("Erreur chargement prestations garage");
    return await res.json();
}
// affichage toutes les prestation 
export async function getPrestation(id) {
    const res = await fetch(`${API}/get_prestation/${id}`);
    if (!res.ok) throw new Error("Erreur prestation");
    return await res.json();
}
// affichage toutes les categorie 
export async function getCategories() {
    const res = await fetch(`${API}/get_categories`);
    if (!res.ok) throw new Error("Erreur chargement categories");
    return await res.json();
}
// affichage de garage en fonction de la ville 
export async function getGaragesByVille(idVille) {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/get_garages_by_ville/${idVille}`);
    if (!res.ok) throw new Error("Erreur chargement garages");
    return await res.json();
}

// affichage le planning de garage 
export const getPlanningByGarage = async (idGarage) => {
    const res = await fetch(`http://127.0.0.1:8000/api/v1/get_planning_by_garage/${idGarage}`);
    if (!res.ok) throw new Error("Impossible de récupérer le planning");
    return await res.json();
};

