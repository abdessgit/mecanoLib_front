import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { registerGarage } from "../../services/api";

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

    const [cpSuggestions, setCpSuggestions] = useState([]);
    const [villeSuggestions, setVilleSuggestions] = useState([]);
    const [adresseSuggestions, setAdresseSuggestions] = useState([]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    /* AUTOCOMPLETE CODE POSTAL */

    const searchCP = async (value) => {

        setForm({ ...form, cp: value });

        if (value.length < 2) return;

        const res = await fetch(
            `https://data.geopf.fr/geocodage/search/?postcode=${value}&limit=10`
        );

        const data = await res.json();

        const results = data.features.map((item) => ({
            cp: item.properties.postcode,
            city: item.properties.city,
            insee: item.properties.citycode
        }));

        setCpSuggestions(results);
    };

    /* AUTOCOMPLETE VILLE */

    const searchVille = async (value) => {

        setForm({ ...form, ville: value });

        if (value.length < 2) return;

        const res = await fetch(
            `https://data.geopf.fr/geocodage/search/?city=${value}&limit=10`
        );

        const data = await res.json();

        const results = data.features.map((item) => ({
            cp: item.properties.postcode,
            city: item.properties.city,
            insee: item.properties.citycode
        }));

        setVilleSuggestions(results);
    };

    /* AUTOCOMPLETE ADRESSE */

    const searchAdresse = async (value) => {

        setForm({ ...form, adresse: value });

        if (value.length < 3) return;

        const res = await fetch(
            `https://data.geopf.fr/geocodage/search/?postcode=${form.cp}&q=${value}&limit=10`
        );

        const data = await res.json();

        const results = data.features.map((item) => ({
            name: item.properties.name,
            cp: item.properties.postcode,
            city: item.properties.city,
            insee: item.properties.citycode
        }));

        setAdresseSuggestions(results);
    };

    /* SUBMIT FORM */

    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.id_ville) {
            setError("L'identifiant de la ville est requis (id_ville).");
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
                id_ville: Number(form.id_ville),
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
                <input className="form-control mb-3" placeholder="SIRET" name="siret" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="TVA" name="tva" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="Mot de passe" type="password" name="mdp" onChange={handleChange} value={form.mdp} />

                {/* ADRESSE */}

                <input
                    className="form-control mt-3"
                    placeholder="Adresse"
                    value={form.adresse}
                    name="adresse"
                    onChange={(e) => searchAdresse(e.target.value)}
                />

                {adresseSuggestions.map((item, index) => (
                    <div
                        key={index}
                        className="list-group-item"
                        onClick={() => {
                            setForm({
                                ...form,
                                adresse: item.name,
                                cp: item.cp,
                                ville: item.city,
                                code_insee: item.insee
                            });
                            setAdresseSuggestions([]);
                        }}
                    >
                        {item.name} - {item.cp} - {item.city}
                    </div>
                ))}

                {/* CODE POSTAL */}

                <input
                    className="form-control"
                    placeholder="Code postal"
                    name="cp"
                    value={form.cp}
                    onChange={(e) => searchCP(e.target.value)}
                />

                {cpSuggestions.map((item, index) => (
                    <div
                        key={index}
                        className="list-group-item"
                        onClick={() => {
                            setForm({
                                ...form,
                                cp: item.cp,
                                ville: item.city,
                                code_insee: item.insee
                            });
                            setCpSuggestions([]);
                        }}
                    >
                        {item.cp} - {item.city}
                    </div>
                ))}

                {/* VILLE */}

                <input
                    className="form-control mt-3"
                    placeholder="Ville"
                    name="ville"
                    value={form.ville}
                    onChange={(e) => searchVille(e.target.value)}
                />

                {villeSuggestions.map((item, index) => (
                    <div
                        key={index}
                        className="list-group-item"
                        onClick={() => {
                            setForm({
                                ...form,
                                ville: item.city,
                                cp: item.cp,
                                code_insee: item.insee
                            });
                            setVilleSuggestions([]);
                        }}
                    >
                        {item.cp} - {item.city}
                    </div>
                ))}

                {/* INPUT HIDDEN CODE INSEE */}

                <input type="hidden" name="code_insee" value={form.code_insee} />
                <input
                    className="form-control mt-3"
                    placeholder="ID Ville (requis par l'API)"
                    name="id_ville"
                    value={form.id_ville}
                    onChange={handleChange}
                />

                <button className="btn btn-primary mt-4" disabled={loading}>
                    {loading ? "Inscription..." : "Inscription"}
                </button>

            </form>
        </div>
    );
}

export default RegisterGarage;