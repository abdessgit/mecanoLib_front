import { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getPrestationsByCategorie, getGaragesByVille } from "../../../api/reservationApi";
import CardCategorie from "../../ReservationCard/CardCategorie";
import CardPrestation from "../../ReservationCard/CardPrestation";
import CardGarage from "../../ReservationCard/CardGarage";
import CardPlanning from "../../ReservationCard/CardPlanning";
import "./Reserver.css";

export default function BookingPage() {
    const navigate = useNavigate();
    // les state pour les etape 
    const [step, setStep] = useState(1);
    // les sate pour laffichage des categorie et prestation et ville 
    const [categories, setCategories] = useState([]);
    const [prestations, setPrestations] = useState([]);
    const [garages, setGarages] = useState([]);
    const [planning, setPlanning] = useState([]);
    // declanche le changement quand on clic
    const [selectedCategorie, setSelectedCategorie] = useState(null);
    const [selectedPrestation, setSelectedPrestation] = useState(null);
    const [selectedGarage, setSelectedGarage] = useState(null);
    const [villeId, setVilleId] = useState("");

    // afficher les rechargement pour UI 
    const [loadingPrestations, setLoadingPrestations] = useState(false);
    const [loadingGarages, setLoadingGarages] = useState(false);

    // button de navigation

    const prevStep = () => setStep(prev => prev - 1);
    // gerer les erreur 
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function fetchCategories() {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (e) {
                console.error(e);
            }
        }

        fetchCategories();
    }, []);

    const handleSelectCategorie = async (cat) => {
        setSelectedCategorie(cat);
        setStep(2);

        try {
            setLoadingPrestations(true);
            const data = await getPrestationsByCategorie(cat.id);
            setPrestations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingPrestations(false);
        }
    };

    const handleSelectPrestation = (prestation) => {
        setSelectedPrestation(prestation);
        setStep(3);
    };

    const handleSearchGarage = async () => {
        setSelectedGarage(garages)
        if (!villeId) return;

        try {
            setLoadingGarages(true);
            setMessage(""); // réinitialise le message
            const data = await getGaragesByVille(villeId);
            setGarages(data.garages);

            if (data.garages.length === 0) {
                setMessage("Aucun garage trouvé pour ce code postal.");
            }
        } catch (e) {
            // Si le backend renvoie 404
            if (e.response && e.response.status === 404) {
                setGarages([]);
                setMessage("Ville introuvable pour ce code postal.");
            } else {
                setMessage("Aucun garage trouvé pour ce code postal.");
            }
        } finally {
            setLoadingGarages(false);
        }
    };
    // ...
    const handleSelectGarage = (garage) => {
        setSelectedGarage(garage);
        setStep(4);
        setMessage("");
    };

    const handleSelectPlanning = (planning) => {
        setSelectedPrestation(planning);
        setStep(4);
    };
    const handleBack = () => {
        if (step === 2) {
            setSelectedCategorie(null);
            setPrestations([]);
        }

        if (step === 3) {
            setSelectedPrestation(null);
            setGarages([]);
            setVilleId("");
        }

        prevStep();
    };
    // derigier vers la page connexion/inscription 
    const durePlanning = [
        { date: "2026-04-02", heure: "09:00" },
        { date: "2026-04-02", heure: "11:00" },
        { date: "2026-04-02", heure: "14:00" },
        { date: "2026-04-03", heure: "10:00" },
        { date: "2026-04-03", heure: "15:00" },
    ];

    // Sélection d’un créneau → redirection vers auth
    const handleSelectCreneau = (creneau) => {
        if (!selectedCategorie || !selectedPrestation || !selectedGarage) {
            return alert("Veuillez sélectionner tous les éléments avant de continuer !");
        }

        const dateDebut = `${creneau.date} ${creneau.heure}:00`;
        const dateFin = new Date(
            new Date(dateDebut).getTime() + 1 * 60 * 60 * 1000
        ).toISOString().slice(0, 19).replace("T", " ");

        const reservationData = {
            id_categorie: selectedCategorie.id,
            nom_categorie: selectedCategorie.nom || selectedCategorie.nom_categorie,

            id_prestation: selectedPrestation.id,
            nom_prestation: selectedPrestation.nom || selectedPrestation.nom_prestation,

            id_garage: selectedGarage.id_garage,
            nom_garage: selectedGarage.nom_garage || selectedGarage.nom,

            date_debut: dateDebut,
            date_fin: dateFin
        };

        localStorage.setItem("reservationData", JSON.stringify(reservationData));
        navigate("/auth");
    };
    return (
        <div className="rdv-container">

            <h1>Prendre rendez-vous</h1>
            <p className="subtitle">Réservez votre créneau en quelques étapes simples</p>
            {message && <p className="error-message">{message}</p>}
            {/* STEPPER DYNAMIQUE */}
            <div className="stepper">
                <div className={`step ${step > 1 && "done"} ${step === 1 && "active"}`}>Categorie</div>
                <div className={`step ${step > 2 && "done"} ${step === 2 && "active"}`}>Prestation</div>
                <div className={`step ${step > 3 && "done"} ${step === 3 && "active"}`}>Garage</div>
                <div className={`step ${step > 4 && "done"} ${step === 4 && "active"}`}>Date & Heure</div>
                <div className="step">Vos infos</div>
            </div>

            {/* CARD 1 — CATEGORIES */}
            {step === 1 && (
                <CardCategorie
                    categories={categories}
                    onSelectCategorie={handleSelectCategorie}
                />
            )}

            {/* CARD 2 — PRESTATIONS */}
            {step === 2 && (
                <CardPrestation
                    prestations={prestations}
                    loading={loadingPrestations}
                    onSelectPrestation={handleSelectPrestation}
                />
            )}

            {/* CARD 3 — GARAGES */}

            {step === 3 && (
                <CardGarage
                    villeId={villeId}
                    setVilleId={setVilleId}
                    garages={garages}
                    loading={loadingGarages}
                    onSearchGarage={handleSearchGarage}
                    onSelectGarage={handleSelectGarage} // ✅ on utilise le bon handler
                />
            )}
            {/* CARD 4 — Planning en dur */}
            {step === 4 && (
                <CardPlanning
                    prestations={durePlanning}
                    onSelectCreneau={handleSelectCreneau}

                />
            )}
            {message && <p className="error-message">{message}</p>}

            {/* FOOTER NAVIGATION */}
            <div className="footer-buttons">

                {step > 1 && (
                    <button className="btn-back" onClick={handleBack}>
                        ← Retour
                    </button>
                )}

                {step === 3 && garages.length > 0 && (
                    <button className="btn-next">
                        Continuer →
                    </button>
                )}

            </div>

        </div>
    );
}