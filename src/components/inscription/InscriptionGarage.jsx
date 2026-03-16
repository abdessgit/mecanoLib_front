import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function RegisterGarage() {
    const [form, setForm] = useState({
        nom_garage: "",
        email: "",
        telephone: "",
        adresse: "",
        siret: "",
        tva: "",
        mdp: "",
        ville: "",
        code_insee: "",
        cp: "",
        img_garage: "",
        img_logo: "",
        id_ville: null
    });

    const [cp, setCp] = useState([]);
    const [adresse, setAdresse] = useState([]);
    const [ville, setVille] = useState([]);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // AUTOCOMPLETE CODE POSTAL
    const searchCP = async (value) => {
        setForm({ ...form, cp: value });
        if (value.length < 2) return;

        const res = await fetch(`https://data.geopf.fr/geocodage/search/?postcode=${value}&limit=10`);
        const data = await res.json();
        const results = data.features.map((item) => ({
            cp: item.properties.postcode,
            city: item.properties.city,
            insee: item.properties.citycode,
            id_ville: item.properties.citycode
        }));
        setCp(results);
    };

    // AUTOCOMPLETE VILLE
    const searchVille = async (value) => {
        setForm({ ...form, ville: value });
        if (value.length < 2) return;

        const res = await fetch(`https://data.geopf.fr/geocodage/search/?city=${value}&limit=10`);
        const data = await res.json();
        const results = data.features.map((item) => ({
            cp: item.properties.postcode,
            city: item.properties.city,
            insee: item.properties.citycode,
            id_ville: item.properties.citycode
        }));
        setVille(results);
    };


    // AUTOCOMPLETE ADRESSE
    const searchAdresse = async (value) => {
        setForm({ ...form, adresse: value });
        if (value.length < 3) return;

        const res = await fetch(`https://data.geopf.fr/geocodage/search/?postcode=${form.cp}&q=${value}&limit=10`);
        const data = await res.json();
        const results = data.features.map((item) => ({
            name: item.properties.name,
            cp: item.properties.postcode,
            city: item.properties.city,
            insee: item.properties.citycode,
            id_ville: item.properties.citycode
        }));
        setAdresse(results);
    };

    // SUBMIT FORM
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Vérifier si le garage existe
        const checkResponse = await fetch(
            `http://127.0.0.1:8000/api/v1/check_garage/${form.siret}`
        );
        const checkGarage = await checkResponse.json();

        if (checkGarage.exists) {
            setMessage("Ce garage est déjà inscrit. Les informations ont été récupérées.");
            return;
        }

        const payload = {
            nom_garage: form.nom_garage,
            telephone_garage: form.telephone_garage,
            email: form.email_garage,
            siret: form.siret,
            tva: form.tva,
            adresse: form.adresse,
            cp: form.cp,
            ville: form.ville,
            code_insee: form.code_insee,
            mdp: form.mdp,
            img_garage: form.img_garage,
            img_logo: form.img_logo
        };

        const response = await fetch("http://127.0.0.1:8000/api/v1/users/inscrire-garage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            setMessage("Garage inscrit avec succès !");
            setForm({
                nom_garage: "",
                telephone_garage: "",
                email_garage: "",
                siret: "",
                tva: "",
                adresse: "",
                cp: "",
                ville: "",
                code_insee: "",
                mdp: "",
                img_garage: "",
                img_logo: ""
            });
        } else {
            setMessage("Erreur lors de l'inscription");
        }
    };
    return (
        <div className="container mt-5">
            <h2>Inscription Garage</h2>
            {message && <div className="alert alert-info">{message}</div>}

            <form onSubmit={handleSubmit}>
                <input className="form-control mb-3" placeholder="Nom du garage" name="nom_garage" onChange={handleChange} value={form.nom_garage} />
                <input className="form-control mb-3" placeholder="Téléphone" name="telephone" onChange={handleChange} value={form.telephone} />
                <input className="form-control mb-3" placeholder="Email" name="email" onChange={handleChange} value={form.email} />
                <input className="form-control mb-3" placeholder="SIRET" name="siret" onChange={handleChange} value={form.siret} />
                <input className="form-control mb-3" placeholder="TVA" name="tva" onChange={handleChange} value={form.tva} />
                <input className="form-control mb-3" placeholder="Mot de passe" type="password" name="mdp" onChange={handleChange} value={form.mdp} />

                {/* ADRESSE */}
                <input className="form-control mt-3" placeholder="Adresse" value={form.adresse} onChange={(e) => searchAdresse(e.target.value)} />
                {adresse.map((item, index) => (
                    <div key={index} className="list-group-item"
                        onClick={() => {
                            setForm({ ...form, adresse: item.name, cp: item.cp, ville: item.city, code_insee: item.insee, id_ville: item.id_ville });
                            setAdresse([]);
                        }}
                    >
                        {item.name} - {item.cp} - {item.city}
                    </div>
                ))}

                {/* CODE POSTAL */}
                <input className="form-control mt-3" placeholder="Code postal" value={form.cp} onChange={(e) => searchCP(e.target.value)} />
                {cp.map((item, index) => (
                    <div key={index} className="list-group-item"
                        onClick={() => {
                            setForm({ ...form, cp: item.cp, ville: item.city, code_insee: item.insee, id_ville: item.id_ville });
                            setCp([]);
                        }}
                    >
                        {item.cp} - {item.city}
                    </div>
                ))}

                {/* VILLE */}
                <input className="form-control mt-3" placeholder="Ville" value={form.ville} onChange={(e) => searchVille(e.target.value)} />
                {ville.map((item, index) => (
                    <div key={index} className="list-group-item"
                        onClick={() => {
                            setForm({ ...form, ville: item.city, cp: item.cp, code_insee: item.insee, id_ville: item.id_ville });
                            setVille([]);
                        }}
                    >
                        {item.cp} - {item.city}
                    </div>
                ))}

                {/* HIDDEN CODE INSEE */}
                <input type="hidden" name="code_insee" value={form.code_insee} />

                <button type="submit" className="btn btn-primary mt-4" >
                    Inscription
                </button>
            </form>
        </div>
    );
}

export default RegisterGarage;