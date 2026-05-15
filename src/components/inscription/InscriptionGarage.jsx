import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './Inscription.css';

function RegisterForm() {
    const [form, setForm] = useState({
        typeUtilisateur: "particulier", // "garage" ou "particulier"
        nom: "",
        prenom: "",
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
    // rate limit 
    const [isBlocked, setIsBlocked] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    //-----
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

    // calcule timing rate limit
    const startRateLimitTimer = () => {
        setIsBlocked(true);
        setRemainingTime(60);

        const interval = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsBlocked(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // CALCUL TVA
    const calculerTvaIntracommunautaire = (siret) => {
        const digits = siret.replace(/\D/g, '');
        if (digits.length < 9) return '';
        const siren = digits.substring(0, 9);
        const sirenModulo = parseInt(siren, 10) % 97;
        const cle = (12 + 3 * sirenModulo) % 97;
        return 'FR' + String(cle).padStart(2, '0') + siren;
    };

    // CHECK SIRET
    const checkSiretAPI = async (value) => {
        setForm((prev) => ({ ...prev, siret: value }));
        lastSiret.current = value;
        setMessage("");
        setSiretValid(false);
        if (value.length !== 14) return;
        setLoadingSiret(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/check_siret_insee", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ siret: value }),
            });
            const result = await res.json();
            if (lastSiret.current !== value) return;
            if (!result.exists) {
                setMessage(result.message);
                setSiretValid(false);
                setLoadingSiret(false);
                return;
            }
            const tvaCalculée = calculerTvaIntracommunautaire(value);
            setForm((prev) => ({
                ...prev,
                nom_garage: result.nom || "",
                adresse: result.adresse || "",
                ville: result.ville || "",
                cp: result.code_postal || "",
                code_insee: result.code_insee || "",
                tva: tvaCalculée
            }));
            setSiretValid(true);
        } catch {
            setMessage("Erreur API");
            setSiretValid(false);
        }
        setLoadingSiret(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        if (!form.consentement_client) {
            setMessage("Vous devez accepter les conditions et la politique de confidentialité.");
            return;
        }
        // Validation pour Garage
        if (form.typeUtilisateur === "garage" && (!form.siret || !siretValid)) {
            setMessage("SIRET invalide");
            return;
        }

        try {
            let url = form.typeUtilisateur === "garage"
                ? "http://127.0.0.1:8000/api/v1/users/inscrire-garage"
                : "http://127.0.0.1:8000/api/v1/users/inscrire_client";

            const payload = form.typeUtilisateur === "garage"
                ? {
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
                }
                : {
                    nom_client: form.nom,
                    prenom_client: form.prenom,
                    telephone: form.telephone,
                    email: form.email,
                    mdp: form.mdp,
                    consentement_client: form.consentement_client,
                };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            //rate limit 
            if (response.status === 429) {
                startRateLimitTimer();
                setMessage("Trop de tentatives. Merci d'attendre 1 minute.");
                return;
            }

            if (!response.ok) {
                setMessage(data.message || "Erreur lors de l'inscription");
                return;
            }
            setMessage(data.message || "Inscription réussie");

        } catch (error) {
            console.error(error);
            setMessage("Erreur réseau ou serveur");
        }
    };

    return (
        <div className="container ">
            <div className="register-wrapper">



                {/* COLONNE DROITE */}
                <div className="register-form">
                    <h2 className="mb-4">Inscription</h2>
                    {message && <div className="alert alert-info">{message}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="user-type">
                            <button
                                type="button"
                                className={form.typeUtilisateur === "particulier" ? "active" : ""}
                                onClick={() => setForm({ ...form, typeUtilisateur: "particulier" })}
                            >
                                Particulier
                            </button>

                            <button
                                type="button"
                                className={form.typeUtilisateur === "garage" ? "active" : ""}
                                onClick={() => setForm({ ...form, typeUtilisateur: "garage" })}
                            >
                                Garage
                            </button>
                        </div>
                        {form.typeUtilisateur === "garage" && (
                            <>
                                <input className="form-control mb-2" placeholder="SIRET" value={form.siret} onChange={(e) => checkSiretAPI(e.target.value)} />
                                {loadingSiret && <p>Chargement...</p>}
                                <input className="form-control mb-2" placeholder="Nom du garage" name="nom_garage" onChange={handleChange} value={form.nom_garage} />
                                <input className="form-control mb-2" placeholder="TVA" name="tva" readOnly value={form.tva} />
                            </>
                        )}

                        {form.typeUtilisateur === "particulier" && (
                            <div className="row-2">
                                <input className="form-control" placeholder="Nom" name="nom" onChange={handleChange} value={form.nom} />
                                <input className="form-control" placeholder="Prénom" name="prenom" onChange={handleChange} value={form.prenom} />
                            </div>
                        )}

                        <input className="form-control mb-2 mt-2" placeholder="Téléphone" name="telephone" onChange={handleChange} value={form.telephone} />
                        <input className="form-control mb-2" placeholder="Email" name="email" onChange={handleChange} value={form.email} />
                        <input className="form-control mb-2" placeholder="Mot de passe" type="password" name="mdp" onChange={handleChange} value={form.mdp} />

                        {/* ADRESSE */}
                        <input className="form-control mt-2" placeholder="Adresse" value={form.adresse} onChange={(e) => searchAdresse(e.target.value)} />
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

                        {/* CP + VILLE COTE A COTE */}
                        <div className="row-2 mt-2">

                            {/* CODE POSTAL */}
                            <div style={{ position: "relative" }}>
                                <input
                                    className="form-control"
                                    placeholder="Code postal"
                                    readOnly
                                    value={form.cp}
                                    onChange={(e) => searchCP(e.target.value)}
                                />

                                {cp.length > 0 && (
                                    <div className="autocomplete-box">
                                        {cp.map((item, index) => (
                                            <div
                                                key={index}
                                                className="list-group-item"
                                                onClick={() => {
                                                    setForm({
                                                        ...form,
                                                        cp: item.cp,
                                                        ville: item.city,
                                                        code_insee: item.insee,
                                                        id_ville: item.id_ville
                                                    });
                                                    setCp([]);
                                                }}
                                            >
                                                {item.cp} - {item.city}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* VILLE */}
                            <div style={{ position: "relative" }}>
                                <input
                                    className="form-control"
                                    placeholder="Ville"
                                    readOnly
                                    value={form.ville}
                                    onChange={(e) => searchVille(e.target.value)}
                                />

                                {ville.length > 0 && (
                                    <div className="autocomplete-box">
                                        {ville.map((item, index) => (
                                            <div
                                                key={index}
                                                className="list-group-item"
                                                onClick={() => {
                                                    setForm({
                                                        ...form,
                                                        ville: item.city,
                                                        cp: item.cp,
                                                        code_insee: item.insee,
                                                        id_ville: item.id_ville
                                                    });
                                                    setVille([]);
                                                }}
                                            >
                                                {item.cp} - {item.city}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>                <input type="hidden" name="code_insee" value={form.code_insee} />
                        {/* Consentement RGPD */}
                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="consentement_client"
                                name="consentement_client"
                                checked={form.consentement_client || false}
                                onChange={(e) => setForm({ ...form, consentement_client: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="consentement_client">
                                J'accepte les conditions et la politique de confidentialité
                            </label>
                        </div>

                        <button
                            className="btn btn-primary mt-4"
                            disabled={
                                isBlocked ||
                                (form.typeUtilisateur === "garage" && !siretValid)
                            }
                        >
                            {isBlocked
                                ? `Réessayer dans ${remainingTime}s`
                                : "Inscription"}
                        </button>

                    </form>
                </div>
            </div >
        </div >
    );
}

export default RegisterForm;