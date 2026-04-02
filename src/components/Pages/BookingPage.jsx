import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../services/api.js";
import { AuthConnexion } from "../connexion/AuthConnexion";
import "./BookingPage.css";

const apiClient = { ...(api.default || {}), ...api };

function toMinutes(timeValue) {
    if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) return null;
    const [hours, minutes] = timeValue.split(":").map(Number);
    return hours * 60 + minutes;
}

function parseDurationToMinutes(duration) {
    if (!duration) return 60;
    if (typeof duration === "number") return duration;

    const value = String(duration).trim();
    if (/^\d+$/.test(value)) return Number(value);

    if (/^\d{1,2}:\d{2}$/.test(value)) {
        const [h, m] = value.split(":").map(Number);
        return h * 60 + m;
    }

    const hourMinuteMatch = value.match(/(\d+)h\s*(\d+)?/i);
    if (hourMinuteMatch) {
        const h = Number(hourMinuteMatch[1] || 0);
        const m = Number(hourMinuteMatch[2] || 0);
        return h * 60 + m;
    }

    return 60;
}

function getDateTime(dateValue, timeValue) {
    return new Date(`${dateValue}T${timeValue}:00`);
}

function formatDateTimeForApi(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getDayId(dateValue) {
    const day = new Date(`${dateValue}T00:00:00`).getDay();
    return day === 0 ? 7 : day;
}

function isTimeInRange(timeInMinutes, start, end) {
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    if (startMinutes === null || endMinutes === null) return false;
    return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
}

function parseRdvDate(dateValue) {
    if (!dateValue) return null;
    return new Date(String(dateValue).replace(" ", "T"));
}

function isOverlapping(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}

function isGarageAvailableOnSlot(planningResponse, rdvResponse, dateValue, timeValue, durationMinutes) {
    const selectedStart = getDateTime(dateValue, timeValue);
    if (Number.isNaN(selectedStart.getTime())) return false;

    const selectedEnd = new Date(selectedStart);
    selectedEnd.setMinutes(selectedEnd.getMinutes() + durationMinutes);

    const selectedMinutes = toMinutes(timeValue);
    if (selectedMinutes === null) return false;

    const dayId = getDayId(dateValue);
    const dayInfo = (planningResponse?.jours || []).find((day) => day?.jourId === dayId);
    if (!dayInfo || !dayInfo.isActive) return false;

    const horaires = [dayInfo?.horaires?.semaine1, dayInfo?.horaires?.semaine2].filter(Boolean);
    const insideOpenHours = horaires.some((horaire) => {
        return (
            isTimeInRange(selectedMinutes, horaire.hreOuvreMatin, horaire.hreFermeMatin) ||
            isTimeInRange(selectedMinutes, horaire.hreOuvreSoir, horaire.hreFermeSoir)
        );
    });

    if (!insideOpenHours) return false;

    const rdvList = Array.isArray(rdvResponse?.rdv) ? rdvResponse.rdv : [];
    const hasConflict = rdvList.some((rdv) => {
        const rdvStart = parseRdvDate(rdv?.dateDebut);
        const rdvEnd = parseRdvDate(rdv?.dateFin);
        if (!rdvStart || !rdvEnd || Number.isNaN(rdvStart.getTime()) || Number.isNaN(rdvEnd.getTime())) {
            return false;
        }

        return isOverlapping(selectedStart, selectedEnd, rdvStart, rdvEnd);
    });

    return !hasConflict;
}

export default function BookingPage() {
    const { token } = useContext(AuthConnexion);
    const [form, setForm] = useState({
        ville: "",
        prestationId: "",
        date: "",
        time: "",
    });
    const [prestations, setPrestations] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [selectedVehiculeId, setSelectedVehiculeId] = useState("");
    const [garages, setGarages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPrestations, setLoadingPrestations] = useState(true);
    const [loadingVehicules, setLoadingVehicules] = useState(true);
    const [bookingGarageId, setBookingGarageId] = useState(null);
    const [bookingMessage, setBookingMessage] = useState("");
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const loadPrestations = async () => {
            try {
                const response = await apiClient.getPrestationsCatalogue();
                setPrestations(Array.isArray(response?.prestations) ? response.prestations : []);
            } catch (err) {
                setError(err.message || "Impossible de charger les prestations.");
            } finally {
                setLoadingPrestations(false);
            }
        };

        loadPrestations();
    }, []);

    useEffect(() => {
        const loadVehicules = async () => {
            if (!token) {
                setVehicules([]);
                setLoadingVehicules(false);
                return;
            }

            try {
                const response = await apiClient.getClientVehiculesMe(token);
                const list = Array.isArray(response) ? response : [];
                setVehicules(list);
                if (list.length > 0) {
                    setSelectedVehiculeId(String(list[0].id_vehicule));
                }
            } catch {
                setVehicules([]);
            } finally {
                setLoadingVehicules(false);
            }
        };

        loadVehicules();
    }, [token]);

    const selectedPrestation = useMemo(() => {
        if (!form.prestationId) return null;
        return prestations.find((item) => String(item.idPrestation) === String(form.prestationId)) || null;
    }, [form.prestationId, prestations]);

    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        setError("");
        setBookingMessage("");
        setHasSearched(true);

        if (!form.ville.trim()) {
            setError("La ville est obligatoire pour rechercher un garage.");
            setGarages([]);
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.searchGarages({
                ville: form.ville.trim(),
                prestationId: form.prestationId || undefined,
                onlyValidated: true,
            });
            const candidates = Array.isArray(response?.garages) ? response.garages : [];

            const needsAvailabilityCheck = Boolean(form.date && form.time);
            const durationMinutes = parseDurationToMinutes(selectedPrestation?.dureePrestation);

            if (!needsAvailabilityCheck) {
                setGarages(candidates.map((garage) => ({ ...garage, isAvailable: null })));
                return;
            }

            const withAvailability = await Promise.all(
                candidates.map(async (garage) => {
                    try {
                        const [planning, rdv] = await Promise.all([
                            apiClient.getGaragePlanningSemaine(null, { garageId: garage.idGarage }),
                            apiClient.getGarageRdvList(null, garage.idGarage),
                        ]);

                        return {
                            ...garage,
                            isAvailable: isGarageAvailableOnSlot(planning, rdv, form.date, form.time, durationMinutes),
                        };
                    } catch {
                        return {
                            ...garage,
                            isAvailable: false,
                        };
                    }
                })
            );

            setGarages(withAvailability);
        } catch (err) {
            setError(err.message || "Recherche impossible.");
            setGarages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (garage) => {
        setError("");
        setBookingMessage("");

        if (!token) {
            setError("Vous devez être connecté pour prendre rendez-vous.");
            return;
        }

        if (!selectedVehiculeId) {
            setError("Veuillez sélectionner un véhicule.");
            return;
        }

        if (!form.prestationId || !form.date || !form.time) {
            setError("Sélectionnez une prestation, une date et une heure pour réserver.");
            return;
        }

        const start = getDateTime(form.date, form.time);
        const durationMinutes = parseDurationToMinutes(selectedPrestation?.dureePrestation);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + durationMinutes);

        setBookingGarageId(garage.idGarage);
        try {
            await apiClient.createClientRdv(token, {
                id_garage: garage.idGarage,
                id_vehicule: Number(selectedVehiculeId),
                id_prestation: Number(form.prestationId),
                date_debut: formatDateTimeForApi(start),
                date_fin: formatDateTimeForApi(end),
                commantaire_client: "Demande créée depuis l'espace booking client",
            });

            setBookingMessage(`Rendez-vous demandé auprès de ${garage.nomGarage}.`);
        } catch (err) {
            setError(err.message || "Impossible de créer le rendez-vous.");
        } finally {
            setBookingGarageId(null);
        }
    };

    return (
        <main className="booking-page">
            <section className="booking-hero">
                <p className="booking-kicker">Rendez-vous</p>
                <h1>Planifier une intervention</h1>
                <p>
                    Choisissez votre créneau et laissez-nous préparer votre passage à l'atelier.
                </p>
            </section>

            <section className="booking-card" aria-label="Formulaire de prise de rendez-vous">
                <form className="booking-form" onSubmit={handleSearch}>
                    <label>
                        Ville ou nom du garage
                        <input
                            type="text"
                            placeholder="Ex: Douai"
                            value={form.ville}
                            onChange={handleChange("ville")}
                            required
                        />
                    </label>

                    <label>
                        Type de prestation
                        <select value={form.prestationId} onChange={handleChange("prestationId")} disabled={loadingPrestations}>
                            <option value="">Toutes les prestations</option>
                            {prestations.map((prestation) => (
                                <option key={prestation.idPrestation} value={prestation.idPrestation}>
                                    {prestation.nomPrestation}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Date souhaitée
                        <input type="date" value={form.date} onChange={handleChange("date")} />
                    </label>

                    <label>
                        Heure souhaitée
                        <input type="time" value={form.time} onChange={handleChange("time")} />
                    </label>

                    <label>
                        Véhicule
                        <select
                            value={selectedVehiculeId}
                            onChange={(event) => setSelectedVehiculeId(event.target.value)}
                            disabled={loadingVehicules || vehicules.length === 0}
                        >
                            {vehicules.length === 0 ? (
                                <option value="">Aucun véhicule disponible</option>
                            ) : (
                                vehicules.map((vehicule) => (
                                    <option key={vehicule.id_vehicule} value={vehicule.id_vehicule}>
                                        {vehicule.immatriculation} - {vehicule.marque || "Marque inconnue"}
                                    </option>
                                ))
                            )}
                        </select>
                    </label>

                    <div className="booking-actions">
                        <button type="submit" disabled={loading || loadingPrestations}>
                            {loading ? "Recherche en cours..." : "Rechercher les garages"}
                        </button>
                        <Link to="/dashboardClient">Retour au dashboard</Link>
                    </div>
                </form>

                {error ? <p className="booking-feedback booking-feedback-error">{error}</p> : null}
                {bookingMessage ? <p className="booking-feedback booking-feedback-success">{bookingMessage}</p> : null}

                {hasSearched && !loading ? (
                    <div className="booking-results" aria-live="polite">
                        {garages.length === 0 ? (
                            <p className="booking-feedback">Aucun garage trouvé pour ces critères.</p>
                        ) : (
                            garages.map((garage) => (
                                <article
                                    key={garage.idGarage}
                                    className={`booking-garage-card ${
                                        garage.isAvailable === null
                                            ? ""
                                            : garage.isAvailable
                                              ? "booking-garage-available"
                                              : "booking-garage-unavailable"
                                    }`}
                                >
                                    <header>
                                        <h3>{garage.nomGarage}</h3>
                                        {garage.isAvailable === null ? (
                                            <span className="booking-status booking-status-neutral">Disponibilité non vérifiée</span>
                                        ) : garage.isAvailable ? (
                                            <span className="booking-status booking-status-ok">Disponible</span>
                                        ) : (
                                            <span className="booking-status booking-status-ko">Indisponible</span>
                                        )}
                                    </header>

                                    <p>{garage.adresseGarage}</p>
                                    <p>
                                        {garage.ville?.nomVille || "Ville inconnue"}
                                        {garage.ville?.codePostal ? ` (${garage.ville.codePostal})` : ""}
                                    </p>
                                    <p>{garage.telephoneGarage}</p>

                                    <div className="booking-garage-prestations">
                                        {(garage.prestations || []).map((prestation) => (
                                            <span key={`${garage.idGarage}-${prestation.idPrestation}`}>
                                                {prestation.nomPrestation}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="booking-card-actions">
                                        <button
                                            type="button"
                                            className="booking-primary-btn"
                                            disabled={
                                                !garage.isAvailable ||
                                                !selectedVehiculeId ||
                                                !form.prestationId ||
                                                !form.date ||
                                                !form.time ||
                                                bookingGarageId === garage.idGarage
                                            }
                                            onClick={() => handleBook(garage)}
                                        >
                                            {bookingGarageId === garage.idGarage ? "Réservation..." : "Prendre rendez-vous"}
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                ) : null}
            </section>
        </main>
    );
}
