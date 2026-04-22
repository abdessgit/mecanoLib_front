import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getPrestationsByCategorie, getGaragesByVille, getPlanningByGarage } from "../../../api/reservationApi";
import CardCategorie from "../../ReservationCard/CardCategorie";
import CardPrestation from "../../ReservationCard/CardPrestation";
import CardGarage from "../../ReservationCard/CardGarage";
import CardPlanning from "../../ReservationCard/CardPlanning";
import Login from "../../connexion/login";
import "./Reserver.css";

const DAY_LABELS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function stripHtml(value) {
    return String(value || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

async function fetchGarageRendezVous(idGarage) {
    const res = await fetch(`http://localhost:8000/api/v1/rdv?garageId=${idGarage}`);
    if (!res.ok) {
        throw new Error("Impossible de récupérer les rendez-vous du garage");
    }

    return await res.json();
}

function formatLocalDateTime(date) {
    const pad = (v) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatLocalDate(date) {
    const pad = (v) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateTime(value) {
    if (!value) return null;
    const str = String(value).trim();

    // Handles "YYYY-MM-DD HH:mm(:ss)" as local time.
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(str)) {
        const [d, t] = str.split(/\s+/);
        const isoLocal = `${d}T${t.length === 5 ? `${t}:00` : t}`;
        const parsed = new Date(isoLocal);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    // Handles "YYYY-MM-DDTHH:mm(:ss)" (no timezone) as local time.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(str)) {
        const parsed = new Date(str.length === 16 ? `${str}:00` : str);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    // Fallback: ISO with timezone ("Z" or "+02:00") or other formats.
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDayLabel(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function getIsoWeekNumber(date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const dayNr = (target.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);

    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const firstDayNr = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);

    return 1 + Math.round((target - firstThursday) / 604800000);
}

function hasOverlap(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}

function isBlockingStatus(statusLabel) {
    const normalizedStatus = String(statusLabel || "").trim().toLowerCase();
    return !["annule", "annuler", "annulation client", "refuse", "refusé", "refusee"].includes(normalizedStatus);
}

function buildSlots(start, end, date, busySlots = []) {
    if (!start || !end) return [];

    const slots = [];
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const cursor = new Date(date);
    cursor.setHours(startHour, startMinute, 0, 0);

    const limit = new Date(date);
    limit.setHours(endHour, endMinute, 0, 0);

    while (cursor < limit) {
        const next = new Date(cursor.getTime() + 30 * 60000);
        if (next > limit) break;

        // Important: keep local time, do NOT convert to UTC with toISOString()
        const dateDebut = formatLocalDateTime(cursor);
        const dateFin = formatLocalDateTime(next);
        const available = !busySlots.some((busySlot) =>
            hasOverlap(
                parseDateTime(dateDebut)?.getTime() ?? 0,
                parseDateTime(dateFin)?.getTime() ?? 0,
                busySlot.start.getTime(),
                busySlot.end.getTime()
            )
        );

        slots.push({
            start: cursor.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }),
            end: next.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false }),
            dateDebut,
            dateFin,
            available,
        });

        cursor.setMinutes(cursor.getMinutes() + 30);
    }

    return slots;
}

function normalizeRendezVousResponse(data) {
    const rdvList = Array.isArray(data)
        ? data
        : Array.isArray(data?.rdv)
            ? data.rdv
            : Array.isArray(data?.rdvs)
                ? data.rdvs
                : [];

    return rdvList.map((rdv) => ({
        dateDebut: rdv?.dateDebut || rdv?.date_debut || null,
        dateFin: rdv?.dateFin || rdv?.date_fin || null,
        status:
            rdv?.status?.libStatusRdv ||
            rdv?.status?.lib_status_rdv ||
            rdv?.status ||
            rdv?.statusLabel ||
            "",
    }));
}

function normalizeLegacyPlanning(data) {
    const planningItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.planning)
            ? data.planning
            : [];

    return planningItems.reduce((acc, item) => {
        const dayLabel = normalizeDayLabel(item?.lib_jour || item?.libJour);
        if (!dayLabel) return acc;

        acc[dayLabel] = {
            isActive: Boolean(
                item?.horaire ||
                item?.id_horaire ||
                item?.hre_ouvre_matin ||
                item?.hreOuvreMatin
            ),
            horaires: {
                semaine1: {
                    hreOuvreMatin: item?.horaire?.hre_ouvre_matin || item?.hre_ouvre_matin || item?.hreOuvreMatin || null,
                    hreFermeMatin: item?.horaire?.hre_ferme_matin || item?.hre_ferme_matin || item?.hreFermeMatin || null,
                    hreOuvreSoir: item?.horaire?.hre_ouvre_soir || item?.hre_ouvre_soir || item?.hreOuvreSoir || null,
                    hreFermeSoir: item?.horaire?.hre_ferme_soir || item?.hre_ferme_soir || item?.hreFermeSoir || null,
                },
                semaine2: null,
            },
        };

        return acc;
    }, {});
}

function transformPlanningResponse(data, rdvs = []) {
    if (data && !Array.isArray(data?.jours) && data?.planning && !Array.isArray(data.planning) && typeof data.planning === "object") {
        return data.planning;
    }

    if (Array.isArray(data) || Array.isArray(data?.planning)) {
        data = {
            jours: Object.entries(normalizeLegacyPlanning(data)).map(([libJour, value], index) => ({
                jourId: index + 1,
                libJour,
                ...value,
            })),
        };
    }

    if (!Array.isArray(data?.jours)) return {};

    const planningByDate = {};
    const now = new Date();
    const busySlots = rdvs
        .filter((rdv) => isBlockingStatus(rdv?.status))
        .map((rdv) => ({
            start: parseDateTime(rdv.dateDebut),
            end: parseDateTime(rdv.dateFin),
        }))
        .filter((slot) => slot.start && slot.end && !Number.isNaN(slot.start.getTime()) && !Number.isNaN(slot.end.getTime()));

    for (let offset = 0; offset < 14; offset += 1) {
        const currentDate = new Date(now);
        currentDate.setHours(0, 0, 0, 0);
        currentDate.setDate(currentDate.getDate() + offset);

        const dayName = DAY_LABELS[currentDate.getDay()];
        const matchingDay = data.jours.find((jour) => normalizeDayLabel(jour?.libJour) === dayName);
        if (!matchingDay?.isActive) continue;

        const weekNumber = getIsoWeekNumber(currentDate);
        const parityKey = weekNumber % 2 === 0 ? "semaine1" : "semaine2";
        const fallbackKey = parityKey === "semaine1" ? "semaine2" : "semaine1";
        const horaires = matchingDay.horaires?.[parityKey] || matchingDay.horaires?.[fallbackKey];

        if (!horaires) continue;

        const slots = [
            ...buildSlots(horaires.hreOuvreMatin, horaires.hreFermeMatin, currentDate, busySlots),
            ...buildSlots(horaires.hreOuvreSoir, horaires.hreFermeSoir, currentDate, busySlots),
        ].filter((slot) => {
            const startDate = parseDateTime(slot.dateDebut);
            return startDate ? startDate > now : false;
        });

        if (slots.length === 0) continue;

        const dateKey = formatLocalDate(currentDate);
        planningByDate[dateKey] = {
            label: currentDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
            }),
            creneaux: slots,
        };
    }

    return planningByDate;
}

export default function BookingPage() {
    const navigate = useNavigate();
    // les state pour les etape 
    const [step, setStep] = useState(1);
    // les sate pour laffichage des categorie et prestation et ville 
    const [categories, setCategories] = useState([]);
    const [prestations, setPrestations] = useState([]);
    const [garages, setGarages] = useState([]);
    const [planning, setPlanning] = useState({});
    // declanche le changement quand on clic
    const [selectedCategorie, setSelectedCategorie] = useState(null);
    const [selectedPrestation, setSelectedPrestation] = useState(null);
    const [selectedGarage, setSelectedGarage] = useState(null);
    const [villeId, setVilleId] = useState("");

    // afficher les rechargement pour UI 
    const [loadingPrestations, setLoadingPrestations] = useState(false);
    const [loadingGarages, setLoadingGarages] = useState(false);
    // gestion de planning 

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
        setSelectedGarage(null);
        setPlanning({});

        if (!villeId) return;

        try {
            setLoadingGarages(true);
            setMessage(""); // réinitialise le message
            const data = await getGaragesByVille(villeId);
            setGarages(data.garages || []);

            if (!data.garages || data.garages.length === 0) {
                setMessage("Aucun garage trouvé pour ce code postal.");
            }
        } catch (e) {
            setGarages([]);
            if (e.response && e.response.status === 404) {
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
        setPlanning({});
        setStep(4);
        setMessage("");
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

    // affiche de planning 

    useEffect(() => {
        if (step !== 4) return;

        const garageId = selectedGarage?.id_garage || selectedGarage?.idGarage;
        if (!garageId) {
            setPlanning({});
            return;
        }

        async function fetchPlanning() {
            try {
                const [planningData, rdvData] = await Promise.all([
                    getPlanningByGarage(garageId),
                    fetchGarageRendezVous(garageId),
                ]);
                const formattedPlanning = transformPlanningResponse(
                    planningData,
                    normalizeRendezVousResponse(rdvData)
                );
                setPlanning(formattedPlanning);

                if (Object.keys(formattedPlanning).length === 0) {
                    setMessage("Aucun créneau disponible pour ce garage.");
                } else {
                    setMessage("");
                }
            } catch (e) {
                console.error(e);
                setPlanning({});
                const cleanMessage = stripHtml(e?.message);
                const isSchemaError = /semaine_parite/i.test(cleanMessage);

                setMessage(
                    isSchemaError
                        ? "Impossible de charger le planning du garage. La colonne backend `semaine_parite` semble absente."
                        : `Impossible de charger le planning du garage. ${cleanMessage || ""}`.trim()
                );
            }
        }

        fetchPlanning();
    }, [step, selectedGarage]);
    // Sélection d’un créneau → étape récapitulatif
    const handleSelectCreneau = (creneau) => {
        if (!selectedCategorie || !selectedPrestation || !selectedGarage) {
            return alert("Veuillez sélectionner tous les éléments !");
        }

        const reservationData = {
            id_categorie: selectedCategorie.id,
            id_prestation: selectedPrestation.id,
            id_garage: selectedGarage.id_garage || selectedGarage.idGarage,
            nom_categorie: selectedCategorie.nom,
            nom_prestation: selectedPrestation.nomprestation || selectedPrestation.nomPrestation || selectedPrestation.nom,
            nom_garage: selectedGarage.nom_garage || selectedGarage.nomGarage || selectedGarage.nom,

            jour: creneau.label || creneau.jour,
            heure_debut: creneau.start,
            heure_fin: creneau.end,

            date_debut: creneau.dateDebut,
            date_fin: creneau.dateFin
        };

        localStorage.setItem("reservationData", JSON.stringify(reservationData));
        setStep(5);
    };
    return (
        <div className="rdv-container">

            <h1>Prendre rendez-vous</h1>
            <p className="subtitle">Réservez votre créneau en quelques étapes simples</p>
            {message && <p className="error-message">{message}</p>}

            <div className="stepper">
                <div className={`step ${step > 1 && "done"} ${step === 1 && "active"}`}>Categorie</div>
                <div className={`step ${step > 2 && "done"} ${step === 2 && "active"}`}>Prestation</div>
                <div className={`step ${step > 3 && "done"} ${step === 3 && "active"}`}>Garage</div>
                <div className={`step ${step > 4 && "done"} ${step === 4 && "active"}`}>Date & Heure</div>
                <div className={`step ${step > 5 && "done"} ${step === 5 && "active"}`}>Vos infos</div>
                <div className={`step ${step > 6 && "done"} ${step === 6 && "active"}`}>Connexion</div>
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
                    onSelectGarage={handleSelectGarage}
                />
            )}
            {/* CARD 4 — Planning en dur */}
            {step === 4 && (
                <CardPlanning
                    planning={planning}
                    onSelectCreneau={handleSelectCreneau}
                />
            )}
            {step === 5 && (
                <div className="reservation-final-step">
                    <div className="card reservation-summary-card">
                        <h2>Récapitulatif</h2>
                        <p><strong>Catégorie :</strong> {selectedCategorie?.nom || "-"}</p>
                        <p><strong>Prestation :</strong> {selectedPrestation?.nomprestation || selectedPrestation?.nomPrestation || selectedPrestation?.nom || "-"}</p>
                        <p><strong>Garage :</strong> {selectedGarage?.nom_garage || selectedGarage?.nomGarage || selectedGarage?.nom || "-"}</p>
                        <p><strong>Date :</strong> {JSON.parse(localStorage.getItem("reservationData") || "{}")?.jour || "-"}</p>
                        <p><strong>Créneau :</strong> {JSON.parse(localStorage.getItem("reservationData") || "{}")?.heure_debut || "-"} - {JSON.parse(localStorage.getItem("reservationData") || "{}")?.heure_fin || "-"}</p>
                    </div>
                </div>
            )}
            {step === 6 && (
                <div className="reservation-final-step">
                    <div className="card reservation-login-card">
                        <h2>Connexion</h2>
                        <Login embedded onSuccess={() => navigate("/dashboardClient")} />
                    </div>
                </div>
            )}
            {message && <p className="error-message">{message}</p>}

            {/* FOOTER NAVIGATION */}
            <div className="footer-buttons">

                {step > 1 && (
                    <button className="btn-back" onClick={handleBack}>
                        ← Retour
                    </button>
                )}

                {step === 5 && (
                    <button className="btn-next" onClick={() => setStep(6)}>
                        Continuer →
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
