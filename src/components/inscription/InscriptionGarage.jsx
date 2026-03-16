import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function RegisterGarage() {

    const [form, setForm] = useState({
        nom_garage: "",
        telephone_garage: "",
        email_garage: "",
        siret: "",
        tva: "",
        adresse: "",
        cp: "",
        ville: "",
        code_insee: ""
    });

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

        const response = await fetch("http://127.0.0.1:8000/api/v1/garage/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nom_garage: form.nom_garage,
                telephone_garage: form.telephone_garage,
                email_garage: form.email_garage,
                siret: form.siret,
                tva: form.tva,
                adresse_garage: form.adresse,
                cp: form.cp,
                ville: form.ville,
                code_insee: form.code_insee
            })
        });


    };

    return (
        <div className="container mt-5">
            <h2>Inscription Garage</h2>

            <form onSubmit={handleSubmit}>

                <input className="form-control mb-3" placeholder="Nom du garage" name="nom_garage" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="Téléphone" name="telephone_garage" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="Email" name="email_garage" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="SIRET" name="siret" onChange={handleChange} />
                <input className="form-control mb-3" placeholder="TVA" name="tva" onChange={handleChange} />

                {/* ADRESSE */}

                <input
                    className="form-control mt-3"
                    placeholder="Adresse"
                    value={form.adresse}
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

                <button className="btn btn-primary mt-4">
                    Inscription
                </button>

            </form>
        </div>
    );
}

export default RegisterGarage;