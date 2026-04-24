import React, { useContext, useState, useEffect, useMemo } from "react";
import { AuthConnexion } from "../../connexion/AuthConnexion.jsx";
import { useNavigate } from "react-router-dom";
import * as apiModule from "../../../services/apiGarage.js";
import "./DashboardGarage.css";
const apiClient = { ...(apiModule.default || {}), ...apiModule };

function getApiMethod(...names) {
    for (const name of names) {
        const fn = apiClient[name] || apiClient.default?.[name];
        if (typeof fn === "function") return fn;
    }

    throw new Error(`Methode API indisponible: ${names.join("/")}`);
}

const RDV_STATUS_OPTIONS = ["En attente", "Confirmer", "Refuser", "Terminer"];
const DEMO_RDV_EMAIL = "donovan.luszcz59@gmail.com";
const DEFAULT_WEEK_DAYS = [
    { jourId: 1, libJour: "Lundi", isActive: false },
    { jourId: 2, libJour: "Mardi", isActive: false },
    { jourId: 3, libJour: "Mercredi", isActive: false },
    { jourId: 4, libJour: "Jeudi", isActive: false },
    { jourId: 5, libJour: "Vendredi", isActive: false },
    { jourId: 6, libJour: "Samedi", isActive: false },
    { jourId: 7, libJour: "Dimanche", isActive: false },
];

const DEFAULT_DAY_HOURS = {
    horaireId: null,
    hreOuvreMatin: "08:00",
    hreFermeMatin: "12:00",
    hreOuvreSoir: "14:00",
    hreFermeSoir: "18:00",
    ferme: false,
};

function isDemoUser(email) {
    return String(email || "").trim().toLowerCase() === DEMO_RDV_EMAIL;
}

function toIsoLocal(date) {
    const pad = (v) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}



function buildDemoRdvs() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const mkSlot = (offsetDays, sh, sm, eh, em) => {
        const start = new Date(monday);
        start.setDate(monday.getDate() + offsetDays);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(monday);
        end.setDate(monday.getDate() + offsetDays);
        end.setHours(eh, em, 0, 0);
        return { dateDebut: toIsoLocal(start), dateFin: toIsoLocal(end) };
    };

    const rdv1 = mkSlot(1, 9, 0, 10, 0); // Mardi
    const rdv2 = mkSlot(2, 14, 0, 15, 30); // Mercredi
    const rdv3 = mkSlot(4, 11, 0, 12, 0); // Vendredi

    return [
        {
            idRdv: "demo-1",
            dateDebut: rdv1.dateDebut,
            dateFin: rdv1.dateFin,
            status: "En attente",
            client: { nom: "Donovan", prenom: "Luszcz" },
            isDemo: true,
        },
        {
            idRdv: "demo-2",
            dateDebut: rdv2.dateDebut,
            dateFin: rdv2.dateFin,
            status: "Confirmer",
            client: { nom: "Donovan", prenom: "Luszcz" },
            isDemo: true,
        },
        {
            idRdv: "demo-3",
            dateDebut: rdv3.dateDebut,
            dateFin: rdv3.dateFin,
            status: "Terminer",
            client: { nom: "Donovan", prenom: "Luszcz" },
            isDemo: true,
        },
    ];
}

async function getGarageProfileSafe(token, userId) {
    return getApiMethod("getGarageProfile")(token, userId ? { userId } : {});
}

async function getGarageRdvListSafe(token, garageId, userId) {
    return getApiMethod("getGarageRdvList")(token, garageId, userId ? { userId } : {});
}

async function getGaragePlanningSafe(token, garageId, userId) {
    return getApiMethod("getGaragePlanningSemaine")(token, { garageId, userId });
}

async function updateGarageHorairesSafe(token, data) {
    return getApiMethod("updateGarageHoraires")(token, data);
}

export default function GarageRdv() {
    const navigate = useNavigate();
    const { user, logout, token } = useContext(AuthConnexion);

    const [is2FARequired, setIs2FARequired] = useState(false);
    const [is2FAActivated, setIs2FAActivated] = useState(false);
    const [code2FA, setCode2FA] = useState("");
    const [messageActivation, setMessageActivation] = useState("");
    const [messageValidation, setMessageValidation] = useState("");
    const [messageValidationRdv, setMessageValidationRdv] = useState("");
    const [profile, setProfile] = useState(null);
    const [rdvs, setRdvs] = useState([]);
    const [globalError, setGlobalError] = useState("");
    const [connectedUserId, setConnectedUserId] = useState(null);
    const [weekDays, setWeekDays] = useState(DEFAULT_WEEK_DAYS);
    const [dayHours, setDayHours] = useState(() =>
        [1, 2, 3, 4, 5, 6, 7].reduce((acc, id) => {
            acc[id] = { ...DEFAULT_DAY_HOURS, ferme: id === 7 };
            return acc;
        }, {})
    );
    const [isEditingHoraires, setIsEditingHoraires] = useState(false);
    const [planningSaving, setPlanningSaving] = useState(false);
    const [rdvEdits, setRdvEdits] = useState({});
    const [showRdvForm, setShowRdvForm] = useState(false);
    const [newRdvForm, setNewRdvForm] = useState({
        vehiculeId: "",
        dateDebut: "",
        dateFin: "",
        duration: 60,
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Outlook-style agenda state
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    });
    const [selectedRdv, setSelectedRdv] = useState(null);
    const [nowMinutes, setNowMinutes] = useState(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    });

    const orderedWeekDays = useMemo(
        () => [...weekDays].sort((a, b) => (a.jourId || 999) - (b.jourId || 999)),
        [weekDays]
    );

    const [newPrestation, setNewPrestation] = useState({
        nomPrestation: "",
        descriptionPrestation: "",
        dureePrestation: "",
        categoriePrestation: "",
        categorieId: "",
    });

    // Outlook agenda constants
    const OL_START_H = 8;
    const OL_END_H = 19;
    const PX_PER_MIN = 0.8;
    const OL_TOTAL_H = (OL_END_H - OL_START_H) * 60 * PX_PER_MIN;
    const OL_HOUR_SLOTS = Array.from({ length: OL_END_H - OL_START_H }, (_, i) => OL_START_H + i);
    const OL_STATUS_COLORS = {
        "En attente": { bg: "rgba(234,179,8,0.22)", border: "#ca8a04", color: "#fef08a" },
        "Confirmer": { bg: "rgba(22,163,74,0.22)", border: "#16a34a", color: "#bbf7d0" },
        "Refuser": { bg: "rgba(220,38,38,0.22)", border: "#dc2626", color: "#fecaca" },
        "Terminer": { bg: "rgba(100,116,139,0.22)", border: "#64748b", color: "#cbd5e1" },

    };
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Outlook agenda helpers
    const olGetWeekDates = (monday) =>
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });

    const olIsSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const olParseDate = (str) => {
        if (!str) return null;
        const iso = String(str).includes("T") ? str : str.replace(" ", "T");
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const olRdvPosition = (rdv) => {
        const start = olParseDate(rdv.dateDebut);
        const end = olParseDate(rdv.dateFin);
        if (!start) return { top: 0, height: 36 };
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end ? end.getHours() * 60 + end.getMinutes() : startMin + 60;
        const top = Math.max(0, (startMin - OL_START_H * 60)) * PX_PER_MIN;
        const height = Math.max(22, (endMin - startMin)) * PX_PER_MIN;
        return { top, height };
    };

    const olRdvsForDay = (date) =>
        rdvs.filter((rdv) => {
            const d = olParseDate(rdv.dateDebut);
            return d && olIsSameDay(d, date);
        });

    const olIsWorkDay = (date) => {
        const jsDay = date.getDay();
        const jourId = jsDay === 0 ? 7 : jsDay;
        return weekDays.find((d) => d.jourId === jourId)?.isActive || false;
    };

    const olFormatWeek = (monday) => {
        const end = new Date(monday);
        end.setDate(monday.getDate() + 6);
        const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
        if (monday.getMonth() === end.getMonth()) {
            return `${monday.getDate()} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
        }
        return `${monday.getDate()} ${months[monday.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    };

    const olGoToPrevWeek = () =>
        setCurrentWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });

    const olGoToNextWeek = () =>
        setCurrentWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });

    const olGoToToday = () => {
        const n = new Date();
        const day = n.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(n);
        monday.setDate(n.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        setCurrentWeekStart(monday);
    };


    const olHandleColClick = (e, date) => {
        if (!olIsWorkDay(date)) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const clickMin = Math.round(relY / PX_PER_MIN / 30) * 30 + OL_START_H * 60;
        const h = Math.floor(clickMin / 60);
        const m = clickMin % 60;
        const dateDebut = new Date(date);
        dateDebut.setHours(h, m, 0, 0);
        const dateFin = new Date(dateDebut);
        dateFin.setHours(h + 1, m, 0, 0);
        setSelectedRdv(null);
        setNewRdvForm({
            vehiculeId: "",
            dateDebut: toIsoLocal(dateDebut).slice(0, 16),
            dateFin: toIsoLocal(dateFin).slice(0, 16),
            duration: 60,
        });
        setShowRdvForm(true);
    };

    const weekDates = useMemo(() => olGetWeekDates(currentWeekStart), [currentWeekStart]);
    const todayDate = new Date();

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            const n = new Date();
            setNowMinutes(n.getHours() * 60 + n.getMinutes());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!token) return;

        const loadDashboardData = async () => {
            setGlobalError("");
            try {
                let resolvedUserId = user?.userId || user?.id || user?.idUtilisateur || null;

                try {
                    const status = await getApiMethod("get2faStatus", "get2FAStatus")(token);
                    setIs2FAActivated(Boolean(status?.enabled));
                    resolvedUserId = status?.userId || status?.id || resolvedUserId;
                } catch {
                    setIs2FAActivated(false);
                }

                setConnectedUserId(resolvedUserId);

                let profileResponse;
                try {
                    profileResponse = await getGarageProfileSafe(token, resolvedUserId);
                } catch (profileError) {
                    if (!resolvedUserId) {
                        throw profileError;
                    }
                    profileResponse = await getGarageProfileSafe(token);
                }

                const garageProfile = profileResponse?.garage || profileResponse || null;
                setProfile(garageProfile);

                const rdvRes = await getGarageRdvListSafe(token, garageProfile?.idGarage, resolvedUserId);
                let rdvList = Array.isArray(rdvRes?.rdv) ? rdvRes.rdv : [];
                const currentEmail = user?.email || user?.emailUtilisateur;
                if (rdvList.length === 0 && isDemoUser(currentEmail)) {
                    rdvList = buildDemoRdvs();
                }
                setRdvs(rdvList);
                setRdvEdits(
                    rdvList.reduce((acc, rdv) => {
                        acc[rdv.idRdv] = { statusLabel: rdv.status || "", motifRefus: rdv.motifRefus || "" };
                        return acc;
                    }, {})
                );

                const planningRes = await getGaragePlanningSafe(token, garageProfile?.idGarage, resolvedUserId);

                // Parse new bi-weekly structure
                if (Array.isArray(planningRes?.jours) && planningRes.jours.length > 0) {
                    setWeekDays(planningRes.jours);
                    const newDayHours = {};
                    planningRes.jours.forEach((day) => {
                        const h = day.horaires?.semaine1 || day.horaires?.semaine2 || null;
                        newDayHours[day.jourId] = {
                            horaireId: h?.idHoraire || null,
                            hreOuvreMatin: h?.hreOuvreMatin || "08:00",
                            hreFermeMatin: h?.hreFermeMatin || "12:00",
                            hreOuvreSoir: h?.hreOuvreSoir || "14:00",
                            hreFermeSoir: h?.hreFermeSoir || "18:00",
                            ferme: !day.isActive,
                        };
                    });
                    setDayHours((prev) => ({ ...prev, ...newDayHours }));
                } else if (planningRes?.horaire) {
                    const h = planningRes.horaire;
                    const common = {
                        horaireId: h.idHoraire || null,
                        hreOuvreMatin: h.hreOuvreMatin || "08:00",
                        hreFermeMatin: h.hreFermeMatin || "12:00",
                        hreOuvreSoir: h.hreOuvreSoir || "14:00",
                        hreFermeSoir: h.hreFermeSoir || "18:00",
                        ferme: false,
                    };
                    setDayHours([1, 2, 3, 4, 5, 6, 7].reduce((acc, id) => {
                        acc[id] = { ...common, ferme: id === 7 };
                        return acc;
                    }, {}));
                }
            } catch (err) {
                setGlobalError(err.message || "Erreur lors du chargement du dashboard garage.");
            }
        };

        loadDashboardData();
    }, [token, user?.id, user?.userId, user?.idUtilisateur, user?.email, user?.emailUtilisateur]);

    const activer2FA = async () => {
        setMessageActivation("");
        setMessageValidation("");
        try {
            const email = user?.email || user?.emailUtilisateur;
            const data = await getApiMethod("setup2fa", "setup2FA")(token, { email });
            setMessageActivation(data?.message || "Scanne le QR Code puis saisis ton code 2FA.");
            setIs2FARequired(true);
        } catch (err) {
            setMessageActivation(err.message || "Activation 2FA impossible.");
        }
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setMessageValidation("");
        try {
            const email = user?.email || user?.emailUtilisateur;
            await getApiMethod("verify2fa", "verify2FA")(token, code2FA, { email });
            setMessageValidation("2FA valide avec succes.");
            setIs2FARequired(false);
            setIs2FAActivated(true);
            setCode2FA("");
        } catch (err) {
            setMessageValidation(err.message || "Code 2FA invalide.");
        }
    };

    const desactiver2FA = async () => {
        setMessageValidation("");
        try {
            const email = user?.email || user?.emailUtilisateur;
            await getApiMethod("disable2fa", "disable2FA")(token, { mdp: "", code: code2FA || "000000", email });
            setMessageValidation("2FA desactive.");
            setIs2FARequired(false);
            setIs2FAActivated(false);
        } catch (err) {
            setMessageValidation(err.message || "Desactivation 2FA impossible.");
        }
    };

    const handleAddPrestation = async (e) => {
        e.preventDefault();
        setGlobalError("");
        try {
            await apiClient.addGaragePrestation(token, {
                ...newPrestation,
                categorieId: Number(newPrestation.categorieId),
                garageId: profile?.idGarage,
            });
            setNewPrestation({
                nomPrestation: "",
                descriptionPrestation: "",
                dureePrestation: "",
                categoriePrestation: "",
                categorieId: "",
            });
            setMessageValidation("Prestation ajoutee.");
        } catch (err) {
            setGlobalError(err.message || "Ajout de prestation impossible.");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Exemple : on prend le premier jour pour la démo, à adapter pour gérer tous les jours
            const lundi = horaires[0];
            // Découper les heures (format attendu : "08:00 - 18:00")
            const [hreOuvreMatin, hreFermeSoir] = (lundi.hours || '').split(' - ');
            // TODO: Adapter pour gérer tous les jours et tous les champs si besoin
            await createOrUpdateGarageHoraire(token, {
                garageId: 1, // À remplacer par l'ID réel du garage
                hreOuvreMatin: hreOuvreMatin || '08:00',
                hreFermeMatin: '12:00', // À adapter si tu veux gérer la coupure midi
                hreOuvreSoir: '14:00', // À adapter
                hreFermeSoir: hreFermeSoir || '18:00',
            });
            setSuccess('Horaire envoyé au backend !');
            setIsEditing(false);
        } catch (e) {
            setError(e.message || 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const savePlanning = async () => {
        setGlobalError("");
        setMessageValidation("");

        const openDays = orderedWeekDays.filter((d) => {
            const h = dayHours[d.jourId];
            return h && !h.ferme;
        });
        if (openDays.length === 0) {
            setGlobalError("Selectionne au moins un jour ouvert.");
            return;
        }

        setPlanningSaving(true);
        try {
            const planning = [];
            const nextDayHours = { ...dayHours };
            for (const day of openDays) {
                const h = nextDayHours[day.jourId];
                const horaireRes = await updateGarageHorairesSafe(token, {
                    ...(h.horaireId ? { horaireId: h.horaireId } : {}),
                    hreOuvreMatin: h.hreOuvreMatin,
                    hreFermeMatin: h.hreFermeMatin,
                    hreOuvreSoir: h.hreOuvreSoir,
                    hreFermeSoir: h.hreFermeSoir,
                    garageId: profile?.idGarage,
                    userId: connectedUserId,
                });
                const horaireId = horaireRes?.horaire?.idHoraire;
                if (!horaireId) throw new Error("Horaire non retourne par le backend.");
                nextDayHours[day.jourId] = { ...nextDayHours[day.jourId], horaireId };
                planning.push({ jourId: day.jourId, horaireId, semaineParite: 0 });
                planning.push({ jourId: day.jourId, horaireId, semaineParite: 1 });
            }

            await apiClient.updateGaragePlanningSemaine(token, {
                garageId: profile?.idGarage,
                userId: connectedUserId,
                planning,
            });

            setDayHours(nextDayHours);
            setIsEditingHoraires(false);
            setMessageValidation("Horaires enregistres avec succes.");
        } catch (err) {
            setGlobalError(err.message || "Impossible d'enregistrer les horaires.");
        } finally {
            setPlanningSaving(false);
        }
    };

    const updateRdvEdit = (rdvId, field, value) => {
        setRdvEdits((prev) => ({
            ...prev,
            [rdvId]: {
                ...(prev[rdvId] || {}),
                [field]: value,
            },
        }));
    };

    const saveRdv = async (rdvId) => {
        if (String(rdvId).startsWith("demo-")) {
            const edit = rdvEdits[rdvId] || {};
            setRdvs((prev) =>
                prev.map((rdv) => {
                    if (rdv.idRdv !== rdvId) return rdv;
                    return {
                        ...rdv,
                        status: edit.statusLabel || rdv.status,
                        motifRefus: edit.motifRefus || rdv.motifRefus || "",
                    };
                })
            );
            setMessageValidation("Rendez-vous de demonstration: modification locale uniquement.");
            setGlobalError("");
            return;
        }

        try {
            const edit = rdvEdits[rdvId] || {};
            const payload = {};

            if (edit.statusLabel) payload.statusLabel = edit.statusLabel;
            if (edit.motifRefus) payload.motifRefus = edit.motifRefus;

            await apiClient.updateGarageRdvStatus(token, rdvId, payload);

            const rdvRes = await getGarageRdvListSafe(token, profile?.idGarage, connectedUserId);
            const rdvList = Array.isArray(rdvRes?.rdv) ? rdvRes.rdv : [];
            setRdvs(rdvList);
            setMessageValidation("Rendez-vous modifie avec succes.");
        } catch (err) {
            setGlobalError(err.message || "Modification du rendez-vous impossible.");
        }
    };

    const createNewRdv = async (e) => {
        e.preventDefault();
        setGlobalError("");
        setMessageValidation("");

        const vehiculeId = Number(newRdvForm.vehiculeId);
        if (!Number.isInteger(vehiculeId) || vehiculeId <= 0) {
            setGlobalError("Veuillez saisir un ID vehicule valide.");
            return;
        }

        if (!newRdvForm.dateDebut || !newRdvForm.dateFin) {
            setGlobalError("Veuillez renseigner la date de debut et de fin.");
            return;
        }

        if (new Date(newRdvForm.dateFin) <= new Date(newRdvForm.dateDebut)) {
            setGlobalError("La date de fin doit etre apres la date de debut.");
            return;
        }

        try {
            await apiClient.createGarageRdv(token, {
                vehiculeId,
                dateDebut: newRdvForm.dateDebut,
                dateFin: newRdvForm.dateFin,
                commentaire: "",
                motifRefus: "",
            });
            setMessageValidation("Rendez-vous cree avec succes.");
            setShowRdvForm(false);
            setNewRdvForm({ vehiculeId: "", dateDebut: "", dateFin: "", duration: 60 });

            // Reload RDVs
            const rdvRes = await getGarageRdvListSafe(token, profile?.idGarage, connectedUserId);
            const rdvList = Array.isArray(rdvRes?.rdv) ? rdvRes.rdv : [];
            setRdvs(rdvList);
        } catch (err) {
            setGlobalError(err.message || "Erreur lors de la creation du RDV.");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setGlobalError("");
        setMessageValidation("");

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setGlobalError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setGlobalError("Le nouveau mot de passe doit avoir au moins 6 caracteres.");
            return;
        }

        try {
            await apiClient.changePassword(token, {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            });
            setMessageValidation("Mot de passe change avec succes.");
            setShowPasswordForm(false);
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setGlobalError(err.message || "Erreur lors du changement de mot de passe.");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    if (!user) return <p>Chargement...</p>;

    return (
        <div className="garage-panel">
            <div className="garage-hero">
                <div>
                    <p className="garage-tag">Espace Garage</p>
                    <h1>Bienvenue {user.nom}</h1>
                    <p>Tableau de bord connecte au backend: securite, profil, rendez-vous et prestations.</p>
                </div>
                <button className="btn btn-logout" onClick={handleLogout}>Se deconnecter</button>
            </div>

            {globalError && <div className="alert alert-error">{globalError}</div>}
            {messageActivation && <div className="alert alert-info">{messageActivation}</div>}


            <div className="garage-grid">
                <section className="garage-card">
                    <h2>Securite 2FA</h2>
                    <div className="status-line">
                        <span className={is2FAActivated ? "badge on" : "badge off"}>
                            {is2FAActivated ? "2FA activee" : "2FA inactive"}
                        </span>
                    </div>

                    <div className="actions-row">
                        <button className="btn" onClick={activer2FA} disabled={is2FAActivated}>Activer 2FA</button>
                        <button className="btn btn-danger" onClick={desactiver2FA} disabled={!is2FAActivated}>Desactiver 2FA</button>
                    </div>

                    {is2FARequired && (
                        <form onSubmit={handle2FASubmit} className="form-inline">
                            <input
                                type="text"
                                placeholder="Code 2FA"
                                value={code2FA}
                                onChange={(e) => setCode2FA(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary">Valider</button>
                        </form>
                    )}

                    <hr style={{ margin: "16px 0", borderColor: "#e5e7eb" }} />

                    <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Modifier le mot de passe</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        style={{ marginBottom: "12px" }}
                    >
                        {showPasswordForm ? "Annuler" : "Changer mot de passe"}
                    </button>

                    {showPasswordForm && (
                        <form onSubmit={handleChangePassword} style={{ marginTop: "12px" }}>
                            <div style={{ display: "grid", gap: "10px" }}>
                                <label>
                                    Ancien mot de passe
                                    <input
                                        type="password"
                                        placeholder="Ancien mot de passe"
                                        value={passwordForm.oldPassword}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Nouveau mot de passe
                                    <input
                                        type="password"
                                        placeholder="Nouveau mot de passe"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                                        required
                                    />
                                </label>
                                <label>
                                    Confirmer mot de passe
                                    <input
                                        type="password"
                                        placeholder="Confirmer mot de passe"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                        required
                                    />
                                </label>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: "12px" }}>
                                Valider changement
                            </button>
                        </form>
                    )}
                </section>

                <section className="garage-card">
                    <h2>Profil Garage</h2>
                    {!profile ? (
                        <p>Aucune donnee profil chargee.</p>
                    ) : (
                        <ul className="profile-list">
                            <li><strong>Nom:</strong> {profile.nomGarage || "-"}</li>
                            <li><strong>Email:</strong> {profile.emailGarage || "-"}</li>
                            <li><strong>Telephone:</strong> {profile.telephoneGarage || "-"}</li>
                            <li><strong>Adresse:</strong> {profile.adresseGarage || "-"}</li>
                            <li><strong>Valide:</strong> {profile.isValide ? "Oui" : "Non"}</li>
                        </ul>
                    )}
                </section>

                <section className="garage-card garage-card-wide">
                    <div className="horaires-header">
                        <h2>Horaires d'ouverture</h2>
                        {!isEditingHoraires ? (
                            <button className="btn" onClick={() => setIsEditingHoraires(true)}>Modifier</button>

                        ) : (
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn" onClick={() => setIsEditingHoraires(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={savePlanning} disabled={planningSaving}>
                                    {planningSaving ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        )}
                    </div>
                    <table className="horaires-table">
                        <tbody>
                            {orderedWeekDays.map((day) => {
                                const h = dayHours[day.jourId] || DEFAULT_DAY_HOURS;
                                return (
                                    <tr key={day.jourId} className="horaires-row">
                                        <td className="horaires-day">{day.libJour}</td>
                                        <td className="horaires-ferme-cell">
                                            <select
                                                className="horaires-ferme-select"
                                                disabled={!isEditingHoraires}
                                                value={h.ferme ? "ferme" : "ouvert"}
                                                onChange={(e) => setDayHours((prev) => ({
                                                    ...prev,
                                                    [day.jourId]: { ...prev[day.jourId], ferme: e.target.value === "ferme" },
                                                }))}
                                            >
                                                <option value="ouvert">Ouvert</option>
                                                <option value="ferme">Fermé toute la journée</option>
                                            </select>
                                        </td>
                                        <td className="horaires-times-cell">
                                            {!h.ferme && (
                                                <div className="horaires-times">
                                                    <input
                                                        type="time"
                                                        className="horaires-time-input"
                                                        disabled={!isEditingHoraires}
                                                        value={h.hreOuvreMatin}
                                                        onChange={(e) => setDayHours((prev) => ({ ...prev, [day.jourId]: { ...prev[day.jourId], hreOuvreMatin: e.target.value } }))}
                                                    />
                                                    <input
                                                        type="time"
                                                        className="horaires-time-input"
                                                        disabled={!isEditingHoraires}
                                                        value={h.hreFermeMatin}
                                                        onChange={(e) => setDayHours((prev) => ({ ...prev, [day.jourId]: { ...prev[day.jourId], hreFermeMatin: e.target.value } }))}
                                                    />
                                                    <input
                                                        type="time"
                                                        className="horaires-time-input"
                                                        disabled={!isEditingHoraires}
                                                        value={h.hreOuvreSoir}
                                                        onChange={(e) => setDayHours((prev) => ({ ...prev, [day.jourId]: { ...prev[day.jourId], hreOuvreSoir: e.target.value } }))}
                                                    />
                                                    <input
                                                        type="time"
                                                        className="horaires-time-input"
                                                        disabled={!isEditingHoraires}
                                                        value={h.hreFermeSoir}
                                                        onChange={(e) => setDayHours((prev) => ({ ...prev, [day.jourId]: { ...prev[day.jourId], hreFermeSoir: e.target.value } }))}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>

                <section className="garage-card garage-card-wide">

                    {messageValidation && <div className="alert alert-success">{messageValidation}</div>}
                    <h2>Rendez-vous Garage</h2>
                    {rdvs.length === 0 ? (
                        <p>Aucun rendez-vous pour le moment.</p>
                    ) : (
                        <div className="rdv-table-wrap">
                            <table className="rdv-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Date debut</th>
                                        <th>Date fin</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rdvs.map((rdv) => (
                                        <tr key={rdv.idRdv}>
                                            <td>#{rdv.idRdv}</td>
                                            <td>{rdv.dateDebut || "-"}</td>
                                            <td>{rdv.dateFin || "-"}</td>
                                            <td>
                                                <div className="rdv-actions">
                                                    {rdv.status !== "AnnulerClient" && (
                                                        <select
                                                            value={rdvEdits[rdv.idRdv]?.statusLabel || rdv.status || ""}
                                                            onChange={(e) => updateRdvEdit(rdv.idRdv, "statusLabel", e.target.value)}
                                                        >
                                                            <option value="">Choisir un statut</option>
                                                            {RDV_STATUS_OPTIONS.map((status) => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <input
                                                        type="text"
                                                        placeholder="Motif de refus (optionnel)"
                                                        value={rdvEdits[rdv.idRdv]?.motifRefus || ""}
                                                        onChange={(e) => updateRdvEdit(rdv.idRdv, "motifRefus", e.target.value)}
                                                        disabled
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                {rdv.status !== "AnnulerClient" && (
                                                    <button className="btn" onClick={() => saveRdv(rdv.idRdv)}>
                                                        Modifier
                                                    </button>
                                                )}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="garage-card garage-card-wide">
                    <div className="ol-toolbar">
                        <div className="ol-nav">
                            <button className="btn ol-nav-btn" onClick={olGoToPrevWeek}>&#8249;</button>
                            <span className="ol-week-label">{olFormatWeek(currentWeekStart)}</span>
                            <button className="btn ol-nav-btn" onClick={olGoToNextWeek}>&#8250;</button>
                        </div>
                        <button className="btn ol-today-btn" onClick={olGoToToday}>Aujourd'hui</button>
                    </div>

                    <div className="ol-agenda">
                        {/* Day headers */}
                        <div className="ol-header-row">
                            <div className="ol-corner" />
                            {weekDates.map((date, i) => {
                                const labels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                                const isToday = olIsSameDay(date, todayDate);
                                const worked = olIsWorkDay(date);
                                return (
                                    <div key={i} className={`ol-day-head ${isToday ? "ol-is-today" : ""} ${!worked ? "ol-day-off" : ""}`}>
                                        <span className="ol-day-label">{labels[date.getDay()]}</span>
                                        <span className={`ol-day-num ${isToday ? "ol-today-circle" : ""}`}>{date.getDate()}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Scrollable grid */}
                        <div className="ol-body-scroll">
                            <div className="ol-body" style={{ height: OL_TOTAL_H }}>
                                {/* Time gutter */}
                                <div className="ol-time-gutter">
                                    {OL_HOUR_SLOTS.map((h) => (
                                        <div
                                            key={h}
                                            className="ol-time-tick"
                                            style={{ top: (h - OL_START_H) * 60 * PX_PER_MIN }}
                                        >
                                            {String(h).padStart(2, "0")}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Day columns */}
                                <div className="ol-cols">
                                    {weekDates.map((date, di) => {
                                        const dayRdvs = olRdvsForDay(date);
                                        const isToday = olIsSameDay(date, todayDate);
                                        const worked = olIsWorkDay(date);
                                        return (
                                            <div
                                                key={di}
                                                className={`ol-day-col ${!worked ? "ol-col-off" : ""} ${isToday ? "ol-col-today" : ""}`}
                                                onClick={(e) => olHandleColClick(e, date)}
                                            >
                                                {/* Hour lines */}
                                                {OL_HOUR_SLOTS.map((h) => (
                                                    <React.Fragment key={h}>
                                                        <div className="ol-h-line" style={{ top: (h - OL_START_H) * 60 * PX_PER_MIN }} />
                                                        <div className="ol-h-line-half" style={{ top: (h - OL_START_H) * 60 * PX_PER_MIN + 30 * PX_PER_MIN }} />
                                                    </React.Fragment>
                                                ))}

                                                {/* Current time line */}
                                                {isToday && nowMinutes >= OL_START_H * 60 && nowMinutes <= OL_END_H * 60 && (
                                                    <div className="ol-now-line" style={{ top: (nowMinutes - OL_START_H * 60) * PX_PER_MIN }} />
                                                )}

                                                {/* RDV events */}
                                                {dayRdvs.map((rdv) => {
                                                    const { top, height } = olRdvPosition(rdv);
                                                    const sc = OL_STATUS_COLORS[rdv.status] || OL_STATUS_COLORS["En attente"];
                                                    const startD = olParseDate(rdv.dateDebut);
                                                    return (
                                                        <div
                                                            key={rdv.idRdv}
                                                            className="ol-event"
                                                            style={{ top, height, background: sc.bg, borderLeftColor: sc.border, color: sc.color }}
                                                            title={`RDV #${rdv.idRdv} — ${rdv.status || ""}`}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRdv(rdv); setShowRdvForm(false); }}
                                                        >
                                                            <span className="ol-event-time">
                                                                {startD?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                            <span className="ol-event-title">RDV #{rdv.idRdv}</span>
                                                            {rdv.client && (
                                                                <span className="ol-event-client">{rdv.client.nom} {rdv.client.prenom}</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ol-legend" aria-label="Legende des statuts de rendez-vous">
                        <span className="ol-legend-label">Statuts :</span>
                        <div className="ol-legend-item">
                            <span className="ol-legend-dot pending" />
                            <span>En attente</span>
                        </div>
                        <div className="ol-legend-item">
                            <span className="ol-legend-dot confirmed" />
                            <span>Confirmer</span>
                        </div>
                        <div className="ol-legend-item">
                            <span className="ol-legend-dot refused" />
                            <span>Refuser</span>
                        </div>
                        <div className="ol-legend-item">
                            <span className="ol-legend-dot done" />
                            <span>Termine</span>
                        </div>
                    </div>

                    {/* Side panel: detail or create */}
                    {(selectedRdv || showRdvForm) && (
                        <div className="ol-side-panel">
                            {selectedRdv ? (
                                <div>
                                    <div className="ol-panel-header">
                                        <h3>RDV #{selectedRdv.idRdv}</h3>
                                        <button className="btn ol-close-btn" onClick={() => setSelectedRdv(null)}>✕</button>
                                    </div>
                                    <p style={{ margin: "0 0 6px", color: "#d1d5db", fontSize: "14px" }}>
                                        <strong>Date :</strong> {olParseDate(selectedRdv.dateDebut)?.toLocaleString("fr-FR")}
                                    </p>
                                    {selectedRdv.dateFin && (
                                        <p style={{ margin: "0 0 6px", color: "#d1d5db", fontSize: "14px" }}>
                                            <strong>Fin :</strong> {olParseDate(selectedRdv.dateFin)?.toLocaleString("fr-FR")}
                                        </p>
                                    )}
                                    {selectedRdv.client && (
                                        <p style={{ margin: "0 0 12px", color: "#d1d5db", fontSize: "14px" }}>
                                            <strong>Client :</strong> {selectedRdv.client.nom} {selectedRdv.client.prenom}
                                        </p>
                                    )}
                                    <div style={{ display: "grid", gap: "8px" }}>
                                        <select
                                            value={rdvEdits[selectedRdv.idRdv]?.statusLabel || selectedRdv.status || ""}
                                            onChange={(e) => updateRdvEdit(selectedRdv.idRdv, "statusLabel", e.target.value)}
                                        >
                                            <option value="">Choisir un statut</option>
                                            {RDV_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Motif de refus (optionnel)"
                                            value={rdvEdits[selectedRdv.idRdv]?.motifRefus || ""}
                                            onChange={(e) => updateRdvEdit(selectedRdv.idRdv, "motifRefus", e.target.value)}
                                        />
                                        <button className="btn btn-primary" onClick={() => saveRdv(selectedRdv.idRdv)}>
                                            Enregistrer
                                        </button>
                                    </div>
                                </div>
                            ) : showRdvForm ? (
                                <form onSubmit={createNewRdv}>
                                    <div className="ol-panel-header">
                                        <h3>Nouveau rendez-vous</h3>
                                        <button type="button" className="btn ol-close-btn" onClick={() => setShowRdvForm(false)}>✕</button>
                                    </div>
                                    <div style={{ display: "grid", gap: "10px" }}>
                                        <label>
                                            ID vehicule
                                            <input
                                                type="number"
                                                min="1"
                                                value={newRdvForm.vehiculeId}
                                                onChange={(e) => setNewRdvForm((p) => ({ ...p, vehiculeId: e.target.value }))}
                                                required
                                            />
                                        </label>
                                        <label>
                                            Date debut
                                            <input
                                                type="datetime-local"
                                                value={newRdvForm.dateDebut}
                                                onChange={(e) => setNewRdvForm((p) => ({ ...p, dateDebut: e.target.value }))}
                                                required
                                            />
                                        </label>
                                        <label>
                                            Date fin
                                            <input
                                                type="datetime-local"
                                                value={newRdvForm.dateFin}
                                                onChange={(e) => setNewRdvForm((p) => ({ ...p, dateFin: e.target.value }))}
                                                required
                                            />
                                        </label>
                                        <button type="submit" className="btn btn-primary">Créer le RDV</button>
                                    </div>
                                </form>
                            ) : null}
                        </div>
                    )}
                </section>

                <section className="garage-card garage-card-wide">
                    <h2>Ajouter une prestation</h2>
                    <form onSubmit={handleAddPrestation} className="prestation-form">
                        <input
                            type="text"
                            placeholder="Nom prestation"
                            value={newPrestation.nomPrestation}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, nomPrestation: e.target.value }))}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={newPrestation.descriptionPrestation}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, descriptionPrestation: e.target.value }))}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Duree"
                            value={newPrestation.dureePrestation}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, dureePrestation: e.target.value }))}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Categorie prestation"
                            value={newPrestation.categoriePrestation}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, categoriePrestation: e.target.value }))}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Categorie ID"
                            value={newPrestation.categorieId}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, categorieId: e.target.value }))}
                            required
                        />
                        <button type="submit" className="btn btn-primary">Ajouter</button>
                    </form>
                </section>
            </div>
        </div>
    );
}
