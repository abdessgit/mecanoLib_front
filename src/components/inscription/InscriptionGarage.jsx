import React, { useState, useRef } from "react";
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
    const [loadingSiret, setLoadingSiret] = useState(false);
    const [message, setMessage] = useState("");
    const [siretValid, setSiretValid] = useState(false);
    const lastSiret = useRef("");

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
    // verifecation siret 
    const checkSiretAPI = async (value) => {
        setForm((prev) => ({ ...prev, siret: value }));

        lastSiret.current = value;

        setMessage("");
        setSiretValid(false);

        if (value.length !== 14) return;

        setLoadingSiret(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/v1/check_siret_insee/${value}`);
            const result = await res.json();

            if (lastSiret.current !== value) return;

            if (!result.exists) {
                setMessage("SIRET introuvable");
                setSiretValid(false);
                setLoadingSiret(false);
                return;
            }


            setForm((prev) => ({
                ...prev,
                nom_garage: result.nom || "",
                adresse: result.adresse || "",
                ville: result.ville || "",
                cp: result.code_postal || "",
                code_insee: result.code_insee || "",
                date_fermeture: result.date_fermeture

            }));

            setSiretValid(true);
        } catch (err) {
            setMessage("Erreur API");
            setSiretValid(false);
        }

        setLoadingSiret(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        if (!form.siret || !siretValid) {
            setMessage("SIRET invalide");
            return;
        }
        try {
            const payload = {
                nom_garage: form.nom_garage,
                email: form.email,
                telephone: form.telephone,
                adresse: form.adresse,
                siret: form.siret,
                tva: form.tva,
                mdp: form.mdp,
                ville: form.ville,
                code_insee: form.code_insee,
                cp: form.cp,
                img_garage: form.img_garage,
                img_logo: form.img_logo
            };

            const response = await fetch(
                "http://127.0.0.1:8000/api/v1/users/inscrire-garage",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const text = await response.text();

            let data = null;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.log("Réponse non JSON");
            }

            if (response.ok) {
                setMessage(data?.message);

                setForm({
                    nom_garage: "",
                    email: "",
                    telephone: "",
                    siret: "",
                    tva: "",
                    adresse: "",
                    cp: "",
                    ville: "",
                    code_insee: "",
                    mdp: "",
                    img_garage: "",
                    img_logo: "",
                    id_ville: null
                });


                setSiretValid(false);

            } else {
                setMessage(
                    data?.message ||
                    data?.error ||
                    `Erreur inscription (${response.status})`
                );
            }

        } catch (error) {
            console.error("ERROR:", error);
            setMessage("Erreur réseau ou serveur");
        }
    };
    return (
        <div className="container mt-5">
            <h2>Inscription Garage</h2>
            {message && <div className="alert alert-info">{message}</div>}

            <form onSubmit={handleSubmit}>
                <input className="form-control mb-3" placeholder="SIRET" value={form.siret} onChange={(e) => checkSiretAPI(e.target.value)} />
                {loadingSiret && <p>Chargement...</p>}

                <input className="form-control mb-3" placeholder="Nom du garage" name="nom_garage" onChange={handleChange} value={form.nom_garage} />
                <input className="form-control mb-3" placeholder="Téléphone" name="telephone" onChange={handleChange} value={form.telephone} />
                <input className="form-control mb-3" placeholder="Email" name="email" onChange={handleChange} value={form.email} />
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

                <button className="btn btn-primary mt-4" disabled={!siretValid}>
                    Inscription
                </button>
            </form>
        </div>
    );
}

export default RegisterGarage;