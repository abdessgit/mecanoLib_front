import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getFrenchAddressSuggestions, getFrenchCitySuggestions, getVilles, isValidEmailFormat, registerGarage } from "../../services/api";

function RegisterGarage() {

    const [form, setForm] = useState({
        nom_garage: "",
        telephone: "",
        email: "",
        siret: "",
        tva: "",
        adresse: "",
        cp: "",
        ville: "",
        code_insee: "",
        id_ville: "",
        mdp: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [villes, setVilles] = useState([]);
    const [villeSuggestions, setVilleSuggestions] = useState([]);
    const [adresseSuggestions, setAdresseSuggestions] = useState([]);
    const [cityLoading, setCityLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);

    useEffect(() => {
        const loadVilles = async () => {
            try {
                const villeData = await getVilles();
                if (Array.isArray(villeData)) {
                    setVilles(villeData);
                }
            } catch (err) {
                console.error("Erreur chargement villes:", err);
            }
        };

        loadVilles();
    }, []);

    const normalizeText = (value = "") =>
        value
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

    const findMatchingVilleId = ({ cityName, postcode, codeInsee }) => {
        const matchedVille = villes.find((ville) => {
            const sameName = normalizeText(ville?.nom_ville) === normalizeText(cityName);
            const samePostcode = String(ville?.code_postal || "") === String(postcode || "");
            const sameInsee = String(ville?.code_insee || ville?.code_inssee || "") === String(codeInsee || "");
            return sameInsee || (sameName && samePostcode) || sameName;
        });

        return matchedVille?.id_ville ? String(matchedVille.id_ville) : "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((current) => ({
            ...current,
            [name]: value,
            ...(name === "ville" ? { id_ville: "", code_insee: "", cp: "" } : {}),
        }));
    };

    const searchVille = async (value) => {
        setForm((current) => ({ ...current, ville: value, id_ville: "", code_insee: "", cp: "" }));

        if (value.trim().length < 1) {
            setVilleSuggestions([]);
            return;
        }

        setCityLoading(true);
        try {
            const results = await getFrenchCitySuggestions(value);
            setVilleSuggestions(
                results.map((item) => ({
                    cp: item?.postcode || "",
                    city: item?.city || "",
                    insee: item?.codeInsee || "",
                    label: item?.label || "",
                }))
            );
        } catch (err) {
            console.error("Erreur recherche ville:", err);
            setVilleSuggestions([]);
        } finally {
            setCityLoading(false);
        }
    };

    const searchAdresse = async (value) => {
        setForm((current) => ({ ...current, adresse: value }));

        if (value.trim().length < 1) {
            setAdresseSuggestions([]);
            return;
        }

        setAddressLoading(true);
        try {
            const results = await getFrenchAddressSuggestions(value, {
                city: form.ville,
                postcode: form.cp,
            });

            setAdresseSuggestions(
                results.map((item) => ({
                    name: item?.address || "",
                    cp: item?.postcode || "",
                    city: item?.city || form.ville || "",
                    insee: item?.codeInsee || "",
                }))
            );
        } catch (err) {
            console.error("Erreur recherche adresse:", err);
            setAdresseSuggestions([]);
        } finally {
            setAddressLoading(false);
        }
    };

    const selectVille = (item) => {
        const matchedVilleId = findMatchingVilleId({
            cityName: item.city,
            postcode: item.cp,
            codeInsee: item.insee,
        });

        setForm((current) => ({
            ...current,
            ville: item.city,
            cp: item.cp,
            code_insee: item.insee,
            id_ville: matchedVilleId,
        }));
        setVilleSuggestions([]);
    };

    const selectAdresse = (item) => {
        const matchedVilleId = findMatchingVilleId({
            cityName: item.city,
            postcode: item.cp,
            codeInsee: item.insee,
        });

        setForm((current) => ({
            ...current,
            adresse: item.name,
            ville: item.city || current.ville,
            cp: item.cp || current.cp,
            code_insee: item.insee || current.code_insee,
            id_ville: matchedVilleId || current.id_ville,
        }));
        setAdresseSuggestions([]);
    };

    /* SUBMIT FORM */

    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.ville || !form.cp || !form.adresse) {
            setError("Veuillez choisir une ville et une adresse via les suggestions officielles.");
            return;
        }

        if (!isValidEmailFormat(form.email)) {
            setError("Merci de saisir une adresse email valide.");
            return;
        }

        setLoading(true);

        try {
            await registerGarage({
                nom_garage: form.nom_garage,
                email: form.email,
                telephone: form.telephone,
                adresse: form.adresse,
                siret: form.siret,
                tva: form.tva,
                id_ville: form.id_ville ? Number(form.id_ville) : null,
                ville: form.ville,
                cp: form.cp,
                code_insee: form.code_insee,
                mdp: form.mdp
            });

            setSuccess("Garage ajoute avec succes.");
            setForm({
                nom_garage: "",
                telephone: "",
                email: "",
                siret: "",
                tva: "",
                adresse: "",
                cp: "",
                ville: "",
                code_insee: "",
                id_ville: "",
                mdp: ""
            });
        } catch (err) {
            setError(err.message || "Inscription garage impossible");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Inscription Garage</h2>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>

                <input className="form-control mb-3" placeholder="Nom du garage" name="nom_garage" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="Telephone" name="telephone" onChange={handleChange} value={form.telephone} />
                <input className="form-control mb-3" placeholder="Email" name="email" onChange={handleChange} value={form.email} />
                <input className="form-control mb-3" placeholder="Mot de passe" type="password" name="mdp" onChange={handleChange} value={form.mdp} />

                {/* VILLE */}

                <input
                    className="form-control mt-3"
                    placeholder="Ville - tapez la premiere lettre"
                    name="ville"
                    value={form.ville}
                    autoComplete="off"
                    onChange={(e) => searchVille(e.target.value)}
                />
                {cityLoading && <div className="form-text mb-2">Recherche des villes...</div>}
                {villeSuggestions.length > 0 && (
                    <div className="list-group mb-3">
                        {villeSuggestions.map((item, index) => (
                            <button
                                key={`${item.city}-${item.cp}-${index}`}
                                type="button"
                                className="list-group-item list-group-item-action"
                                onMouseDown={() => selectVille(item)}
                            >
                                {item.city} - {item.cp}
                            </button>
                        ))}
                    </div>
                )}

                {/* CODE POSTAL */}

                <input
                    className="form-control"
                    placeholder="Code postal"
                    name="cp"
                    value={form.cp}
                    readOnly
                />

                {/* ADRESSE */}

                <input
                    className="form-control mt-3"
                    placeholder="Adresse - tapez les premieres lettres"
                    value={form.adresse}
                    name="adresse"
                    autoComplete="off"
                    onChange={(e) => searchAdresse(e.target.value)}
                />
                {addressLoading && <div className="form-text mb-2">Recherche des adresses...</div>}
                {adresseSuggestions.length > 0 && (
                    <div className="list-group mb-3">
                        {adresseSuggestions.map((item, index) => (
                            <button
                                key={`${item.name}-${item.cp}-${index}`}
                                type="button"
                                className="list-group-item list-group-item-action"
                                onMouseDown={() => selectAdresse(item)}
                            >
                                {item.name} - {item.cp} - {item.city}
                            </button>
                        ))}
                    </div>
                )}

                {/* INPUTS AUTO */}

                <input type="hidden" name="code_insee" value={form.code_insee} readOnly />
                <input type="hidden" name="id_ville" value={form.id_ville} readOnly />
                {form.id_ville && (
                    <div className="form-text text-success mt-2">
                        Ville reconnue dans la base locale (ID: {form.id_ville}).
                    </div>
                )}

                <button className="btn btn-primary mt-4" disabled={loading}>
                    {loading ? "Inscription..." : "Inscription"}
                </button>

            </form>
        </div>
    );
}

export default RegisterGarage;