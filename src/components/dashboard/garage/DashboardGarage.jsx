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

const RDV_STATUS_OPTIONS = ["En attente", "Confirmer", "En cours", "Réparation terminée", "Refuser", "Terminer"];
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
    ferme: false,
    needsAdmin: false,
    selectedLabel: "",
};

function formatHoraireSummary(horaire) {
    if (!horaire) return "";

    const matin = `${horaire.hreOuvreMatin || "--:--"} - ${horaire.hreFermeMatin || "--:--"}`;
    const soir = `${horaire.hreOuvreSoir || "--:--"} - ${horaire.hreFermeSoir || "--:--"}`;
    return `${matin} / ${soir}`;
}

function normalizeHoraireCatalogItem(item) {
    const idHoraire = item?.idHoraire || item?.id_horaire || null;
    const label = item?.libHoraire || item?.label || item?.nom || `Créneau ${idHoraire || ""}`.trim();

    return {
        idHoraire,
        hreOuvreMatin: item?.hreOuvreMatin || item?.hre_ouvre_matin || null,
        hreFermeMatin: item?.hreFermeMatin || item?.hre_ferme_matin || null,
        hreOuvreSoir: item?.hreOuvreSoir || item?.hre_ouvre_soir || null,
        hreFermeSoir: item?.hreFermeSoir || item?.hre_ferme_soir || null,
        label,
        summary: formatHoraireSummary({
            hreOuvreMatin: item?.hreOuvreMatin || item?.hre_ouvre_matin,
            hreFermeMatin: item?.hreFermeMatin || item?.hre_ferme_matin,
            hreOuvreSoir: item?.hreOuvreSoir || item?.hre_ouvre_soir,
            hreFermeSoir: item?.hreFermeSoir || item?.hre_ferme_soir,
        }),
    };
}

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

async function getHorairesCatalogSafe(token) {
    return getApiMethod("getHorairesCatalog")(token);
}

async function getGaragePrestationsSafe(token, garageId) {
    return getApiMethod("getGaragePrestations", "getPrestationsByGarage")(token, garageId);
}

async function requestGarageHoraireSuperAdminSafe(token, data) {
    return getApiMethod("requestGarageHoraireSuperAdmin")(token, data);
}

export default function GarageRdv() {
    const navigate = useNavigate();
    const { user, logout, token } = useContext(AuthConnexion);

    const [is2FARequired, setIs2FARequired] = useState(false);
    const [is2FAActivated, setIs2FAActivated] = useState(false);
    const [code2FA, setCode2FA] = useState("");
    const [messageActivation, setMessageActivation] = useState("");
    const [, setMessageValidation] = useState("");
    const [profile, setProfile] = useState(null);
    const [rdvs, setRdvs] = useState([]);
    const [globalError, setGlobalError] = useState("");
    const [connectedUserId, setConnectedUserId] = useState(null);
    const [weekDays, setWeekDays] = useState(DEFAULT_WEEK_DAYS);
    const [horaireCatalog, setHoraireCatalog] = useState([]);
    const [dayHours, setDayHours] = useState(() =>
        [1, 2, 3, 4, 5, 6, 7].reduce((acc, id) => {
            acc[id] = { ...DEFAULT_DAY_HOURS, ferme: id === 7 };
            return acc;
        }, {})
    );
    const [isEditingHoraires, setIsEditingHoraires] = useState(false);
    const [planningSaving, setPlanningSaving] = useState(false);
    const [showHoraireRequestModal, setShowHoraireRequestModal] = useState(false);
    const [horaireRequestDay, setHoraireRequestDay] = useState(null);
    const [horaireRequests, setHoraireRequests] = useState({});
    const [horaireRequestForm, setHoraireRequestForm] = useState({
        hreOuvreMatin: "08:00",
        hreFermeMatin: "12:00",
        hreOuvreSoir: "14:00",
        hreFermeSoir: "18:00",
        note: "",
    });
    const [rdvEdits, setRdvEdits] = useState({});
    const [messagePlanningValidation, setMessagePlanningValidation] = useState("");
    const [showRdvForm, setShowRdvForm] = useState(false);
    const [newRdvForm, setNewRdvForm] = useState({
        plaque: "",
        vehiculeId: "",
        clientNom: "",
        clientPrenom: "",
        marque: "",
        modele: "",
        dateDebut: "",
        duration: 60,
    });
    const [plateLookupState, setPlateLookupState] = useState({ status: "idle", message: "" });
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
    const [prestationsCatalogue, setPrestationsCatalogue] = useState([]);
    const [garagePrestations, setGaragePrestations] = useState([]);
    const [editingGaragePrestationId, setEditingGaragePrestationId] = useState(null);
    const [editingGaragePrestationPrice, setEditingGaragePrestationPrice] = useState("");
    const [garagePrestationMessage, setGaragePrestationMessage] = useState("");

    const orderedWeekDays = useMemo(
        () => [...weekDays].sort((a, b) => (a.jourId || 999) - (b.jourId || 999)),
        [weekDays]
    );

    const [newPrestation, setNewPrestation] = useState({
        prestationId: "",
        prix: "",
    });

    const refreshGaragePrestations = async (garageId = profile?.idGarage) => {
        if (!garageId) {
            setGaragePrestations([]);
            return;
        }

        try {
            const garagePrestationsRes = await getGaragePrestationsSafe(token, garageId);
            setGaragePrestations(Array.isArray(garagePrestationsRes) ? garagePrestationsRes : []);
        } catch {
            setGaragePrestations([]);
        }
    };

    const getDayHoraireValue = (dayState) => {
        if (dayState?.needsAdmin) return "__REQUEST__";
        if (dayState?.ferme) return "__CLOSED__";
        if (dayState?.horaireId) return String(dayState.horaireId);
        return "";
    };

    const applyDayHoraireValue = (day, nextValue) => {
        if (nextValue === "__CLOSED__") {
            setDayHours((prev) => ({
                ...prev,
                [day.jourId]: {
                    ...prev[day.jourId],
                    ferme: true,
                    needsAdmin: false,
                    horaireId: null,
                    selectedLabel: "",
                },
            }));
            setHoraireRequests((prev) => {
                const next = { ...prev };
                delete next[day.jourId];
                return next;
            });
            return;
        }

        const selectedSlot = horaireCatalog.find((slot) => String(slot.idHoraire) === String(nextValue)) || null;
        setDayHours((prev) => ({
            ...prev,
            [day.jourId]: {
                ...prev[day.jourId],
                ferme: false,
                needsAdmin: false,
                horaireId: selectedSlot?.idHoraire || null,
                selectedLabel: selectedSlot?.summary || selectedSlot?.label || "",
            },
        }));
        setHoraireRequests((prev) => {
            const next = { ...prev };
            delete next[day.jourId];
            return next;
        });
    };

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
        setSelectedRdv(null);
        setNewRdvForm({
            plaque: "",
            vehiculeId: "",
            clientNom: "",
            clientPrenom: "",
            marque: "",
            modele: "",
            dateDebut: toIsoLocal(dateDebut).slice(0, 16),
            duration: 60,
        });
        setPlateLookupState({ status: "idle", message: "" });
        setShowRdvForm(true);
    };

    useEffect(() => {
        if (!showRdvForm) return undefined;

        const plaque = String(newRdvForm.plaque || "").trim();
        if (!plaque) {
            setPlateLookupState({ status: "idle", message: "" });
            setNewRdvForm((prev) => ({
                ...prev,
                vehiculeId: "",
                clientNom: "",
                clientPrenom: "",
                marque: "",
                modele: "",
            }));
            return undefined;
        }

        setPlateLookupState({ status: "loading", message: "Recherche du véhicule..." });
        const timer = setTimeout(async () => {
            try {
                const result = await getApiMethod("searchVehiculeByPlaque")(plaque);
                const client = result?.client;
                const marque = result?.marque;
                const modele = result?.modele;
                setNewRdvForm((prev) => ({
                    ...prev,
                    vehiculeId: result?.vehiculeId || "",
                    clientNom: client?.nom || "",
                    clientPrenom: client?.prenom || "",
                    marque: marque?.nomMarque || "",
                    modele: modele?.nomModele || "",
                }));
                setPlateLookupState({
                    status: "success",
                    message: client ? `Véhicule trouvé pour ${client.prenom} ${client.nom}` : "Véhicule trouvé",
                });
            } catch (err) {
                setNewRdvForm((prev) => ({
                    ...prev,
                    vehiculeId: "",
                    clientNom: "",
                    clientPrenom: "",
                    marque: "",
                    modele: "",
                }));
                setPlateLookupState({
                    status: "error",
                    message: err?.message || "Véhicule introuvable",
                });
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [newRdvForm.plaque, showRdvForm]);

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

                try {
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
                } catch {
                    setRdvs([]);
                    setRdvEdits({});
                }

                try {
                    const planningRes = await getGaragePlanningSafe(token, garageProfile?.idGarage, resolvedUserId);

                    // Parse new bi-weekly structure
                    if (Array.isArray(planningRes?.jours) && planningRes.jours.length > 0) {
                        setWeekDays(planningRes.jours);
                        const newDayHours = {};
                        planningRes.jours.forEach((day) => {
                            const h = day.horaires?.semaine1 || day.horaires?.semaine2 || null;
                            newDayHours[day.jourId] = {
                                horaireId: h?.idHoraire || null,
                                selectedLabel: h?.label || h?.summary || formatHoraireSummary(h),
                                ferme: !day.isActive,
                                needsAdmin: false,
                            };
                        });
                        setDayHours((prev) => ({ ...prev, ...newDayHours }));
                    } else if (planningRes?.horaire) {
                        const h = planningRes.horaire;
                        const common = {
                            horaireId: h.idHoraire || null,
                            selectedLabel: h?.label || h?.summary || formatHoraireSummary(h),
                            ferme: false,
                            needsAdmin: false,
                        };
                        setDayHours([1, 2, 3, 4, 5, 6, 7].reduce((acc, id) => {
                            acc[id] = { ...common, ferme: id === 7 };
                            return acc;
                        }, {}));
                    }
                } catch {
                    // Le dashboard reste utilisable même si le planning n'est pas encore configuré.
                }

                try {
                    const horairesRes = await getHorairesCatalogSafe(token);
                    const catalog = Array.isArray(horairesRes)
                        ? horairesRes
                        : Array.isArray(horairesRes?.horaires)
                            ? horairesRes.horaires
                            : Array.isArray(horairesRes?.data)
                                ? horairesRes.data
                                : [];

                    setHoraireCatalog(
                        catalog
                            .map(normalizeHoraireCatalogItem)
                            .filter((item) => item.idHoraire !== null)
                    );
                } catch {
                    setHoraireCatalog([]);
                }

                try {
                    const prestationsRes = await apiClient.getPrestations();
                    setPrestationsCatalogue(Array.isArray(prestationsRes) ? prestationsRes : []);
                } catch {
                    setPrestationsCatalogue([]);
                }

                try {
                    await refreshGaragePrestations(garageProfile?.idGarage);
                } catch {
                    setGaragePrestations([]);
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
                prestations: [
                    {
                        id: Number(newPrestation.prestationId),
                        prix: Number(newPrestation.prix),
                    },
                ],
                garageId: profile?.idGarage,
            });
            setNewPrestation({
                prestationId: "",
                prix: "",
            });
            setGaragePrestationMessage("Prestation ajoutée ou mise à jour avec son prix.");
            setEditingGaragePrestationId(null);
            setEditingGaragePrestationPrice("");
            await refreshGaragePrestations(profile?.idGarage);
        } catch (err) {
            setGlobalError(err.message || "Ajout de prestation impossible.");
        }
    };

    const startEditGaragePrestation = (prestation) => {
        setEditingGaragePrestationId(prestation.idPrestation);
        setEditingGaragePrestationPrice(prestation.prix !== null && prestation.prix !== undefined ? String(prestation.prix) : "");
    };

    const cancelEditGaragePrestation = () => {
        setEditingGaragePrestationId(null);
        setEditingGaragePrestationPrice("");
    };

    const saveGaragePrestationPrice = async (prestation) => {
        setGlobalError("");
        try {
            await apiClient.addGaragePrestation(token, {
                prestations: [
                    {
                        id: Number(prestation.idPrestation),
                        prix: Number(editingGaragePrestationPrice),
                    },
                ],
                garageId: profile?.idGarage,
            });
            setGaragePrestationMessage(`Prix de ${prestation.nomPrestation} mis à jour avec succès.`);
            cancelEditGaragePrestation();
            await refreshGaragePrestations(profile?.idGarage);
        } catch (err) {
            setGlobalError(err.message || "Modification du prix impossible.");
        }
    };

    const removeGaragePrestation = async (prestation) => {
        setGlobalError("");
        const confirmDelete = window.confirm(
            `Supprimer la prestation ${prestation.nomPrestation} du garage ?`
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await apiClient.deleteGaragePrestation(token, prestation.idPrestation, {
                garageId: profile?.idGarage,
            });
            if (editingGaragePrestationId === prestation.idPrestation) {
                cancelEditGaragePrestation();
            }
            setGaragePrestationMessage(`${prestation.nomPrestation} a été supprimée du garage.`);
            await refreshGaragePrestations(profile?.idGarage);
        } catch (err) {
            setGlobalError(err.message || "Suppression impossible.");
        }
    };

    const savePlanning = async () => {
        setGlobalError("");
        setMessagePlanningValidation("");

        setPlanningSaving(true);
        try {
            const planning = [];
            const nextDayHours = { ...dayHours };
            const requestDays = [];
            const requestDetails = [];

            for (const day of orderedWeekDays) {
                const h = nextDayHours[day.jourId];
                if (h?.needsAdmin) {
                    requestDays.push(day.libJour);
                    const demande = horaireRequests[day.jourId] || null;
                    if (demande) {
                        requestDetails.push(
                            `${day.libJour}: ${demande.hreOuvreMatin}-${demande.hreFermeMatin} / ${demande.hreOuvreSoir}-${demande.hreFermeSoir}${demande.note ? ` | ${demande.note}` : ""}`
                        );
                    } else {
                        requestDetails.push(`${day.libJour}: demande sans détail`);
                    }
                    continue;
                }

                if (h?.ferme) {
                    nextDayHours[day.jourId] = { ...nextDayHours[day.jourId], horaireId: null, ferme: true, needsAdmin: false };
                    planning.push({ jourId: day.jourId, horaireId: null });
                    continue;
                }

                if (!h?.horaireId) {
                    requestDays.push(day.libJour);
                    continue;
                }

                nextDayHours[day.jourId] = {
                    ...nextDayHours[day.jourId],
                    horaireId: h.horaireId,
                    ferme: false,
                    needsAdmin: false,
                };
                planning.push({ jourId: day.jourId, horaireId: h.horaireId });
            }

            await apiClient.updateGaragePlanningSemaine(token, {
                garageId: profile?.idGarage,
                userId: connectedUserId,
                planning,
            });

            if (requestDays.length > 0) {
                await requestGarageHoraireSuperAdminSafe(token, {
                    garageId: profile?.idGarage,
                    userId: connectedUserId,
                    jours: requestDays,
                    motif: requestDetails.length > 0
                        ? `Demande de nouveaux créneaux:\n${requestDetails.join("\n")}`
                        : "Aucun créneau standard ne correspond au besoin du garage.",
                });
            }

            setDayHours(nextDayHours);
            setIsEditingHoraires(false);
            setMessagePlanningValidation(
                requestDays.length > 0
                    ? `Horaires enregistres. Demande envoyee au super admin pour: ${requestDays.join(", ")}.`
                    : "Horaires enregistres avec succes."
            );
        } catch (err) {
            setGlobalError(err.message || "Impossible d'enregistrer les horaires.");
        } finally {
            setPlanningSaving(false);
        }
    };

    const openHoraireRequestModal = (day) => {
        const demandeExistante = horaireRequests[day.jourId];
        setHoraireRequestDay(day);
        setHoraireRequestForm(
            demandeExistante || {
                hreOuvreMatin: "08:00",
                hreFermeMatin: "12:00",
                hreOuvreSoir: "14:00",
                hreFermeSoir: "18:00",
                note: "",
            }
        );
        setShowHoraireRequestModal(true);
    };

    const submitHoraireRequest = (e) => {
        e.preventDefault();

        if (!horaireRequestDay) return;

        const demande = {
            hreOuvreMatin: horaireRequestForm.hreOuvreMatin,
            hreFermeMatin: horaireRequestForm.hreFermeMatin,
            hreOuvreSoir: horaireRequestForm.hreOuvreSoir,
            hreFermeSoir: horaireRequestForm.hreFermeSoir,
            note: String(horaireRequestForm.note || "").trim(),
        };

        setHoraireRequests((prev) => ({
            ...prev,
            [horaireRequestDay.jourId]: demande,
        }));

        setDayHours((prev) => ({
            ...prev,
            [horaireRequestDay.jourId]: {
                ...prev[horaireRequestDay.jourId],
                ferme: false,
                needsAdmin: true,
                horaireId: null,
                selectedLabel: `${demande.hreOuvreMatin}-${demande.hreFermeMatin} / ${demande.hreOuvreSoir}-${demande.hreFermeSoir}`,
            },
        }));

        setShowHoraireRequestModal(false);
        setHoraireRequestDay(null);
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
            setGlobalError("Veuillez saisir une plaque de vehicule enregistree.");
            return;
        }

        if (!newRdvForm.dateDebut) {
            setGlobalError("Veuillez renseigner la date de debut.");
            return;
        }

        const start = new Date(newRdvForm.dateDebut);
        if (Number.isNaN(start.getTime())) {
            setGlobalError("Date de debut invalide.");
            return;
        }

        const duration = Number(newRdvForm.duration) || 60;
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        try {
            await apiClient.createGarageRdv(token, {
                vehiculeId,
                dateDebut: newRdvForm.dateDebut,
                dateFin: toIsoLocal(end).slice(0, 16),
                commentaire: "",
                motifRefus: "",
            });
            setMessageValidation("Rendez-vous cree avec succes.");
            setShowRdvForm(false);
            setNewRdvForm({ plaque: "", vehiculeId: "", clientNom: "", clientPrenom: "", marque: "", modele: "", dateDebut: "", duration: 60 });
            setPlateLookupState({ status: "idle", message: "" });

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

                <section className="garage-card garage-card-wide horaires-card">
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
                    {messagePlanningValidation && <div className="alert alert-success">{messagePlanningValidation}</div>}
                    <div className="horaires-list">
                        {orderedWeekDays.map((day) => {
                            const h = dayHours[day.jourId] || DEFAULT_DAY_HOURS;
                            const selectedHoraire = horaireCatalog.find((slot) => slot.idHoraire === h.horaireId) || null;
                            const summaryText = h.ferme
                                ? "Fermé"
                                : h.needsAdmin
                                    ? "Demande au super admin"
                                    : h.selectedLabel || selectedHoraire?.summary || "Aucun créneau choisi";

                            return (
                                <div key={day.jourId} className="horaires-item">
                                    <div className="horaires-summary">
                                        <span className="horaires-day">{day.libJour}</span>
                                        <span className={`horaires-pill ${h.ferme ? "is-closed" : h.needsAdmin ? "is-warn" : "is-open"}`}>
                                            {h.ferme ? "Fermé" : h.needsAdmin ? "A valider" : selectedHoraire?.label || "Ouvert"}
                                        </span>
                                        <span className="horaires-summary-text">{summaryText}</span>
                                    </div>
                                    <div className="horaires-edit">
                                        <label className="horaires-select-wrap">
                                            <span className="horaires-toggle-label">Choisir un créneau</span>
                                            <select
                                                className="horaires-select"
                                                value={getDayHoraireValue(h)}
                                                disabled={!isEditingHoraires}
                                                onChange={(event) => {
                                                    const nextValue = event.target.value;
                                                    if (nextValue === "__REQUEST__") {
                                                        openHoraireRequestModal(day);
                                                        return;
                                                    }
                                                    applyDayHoraireValue(day, nextValue);
                                                }}
                                            >
                                                <option value="">Aucun créneau choisi</option>
                                                <option value="__CLOSED__">Fermé</option>
                                                {horaireCatalog.map((slot) => (
                                                    <option key={slot.idHoraire} value={String(slot.idHoraire)}>
                                                        {slot.label}
                                                    </option>
                                                ))}
                                                <option value="__REQUEST__">Demander nouveaux créneaux</option>
                                            </select>
                                        </label>

                                        <button
                                            type="button"
                                            className={`horaires-chip horaires-chip-secondary ${h.needsAdmin ? "active" : ""}`}
                                            disabled={!isEditingHoraires}
                                            onClick={() => openHoraireRequestModal(day)}
                                        >
                                            Demander nouveaux créneaux
                                        </button>
                                        {h.needsAdmin && (
                                            <p className="horaires-admin-note">
                                                Ce créneau n’existe pas en base. Une demande sera envoyée au super admin.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {showHoraireRequestModal && (
                        <div className="horaires-modal-backdrop" onClick={() => setShowHoraireRequestModal(false)}>
                            <form className="ol-modal" onSubmit={submitHoraireRequest} onClick={(e) => e.stopPropagation()}>
                                <div className="ol-panel-header">
                                    <h3>Demander nouveaux créneaux {horaireRequestDay ? `- ${horaireRequestDay.libJour}` : ""}</h3>
                                    <button type="button" className="btn ol-close-btn" onClick={() => setShowHoraireRequestModal(false)}>✕</button>
                                </div>

                                <div className="ol-modal-grid">
                                    <label>
                                        Ouverture matin
                                        <input
                                            type="time"
                                            value={horaireRequestForm.hreOuvreMatin}
                                            onChange={(e) => setHoraireRequestForm((prev) => ({ ...prev, hreOuvreMatin: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Fermeture matin
                                        <input
                                            type="time"
                                            value={horaireRequestForm.hreFermeMatin}
                                            onChange={(e) => setHoraireRequestForm((prev) => ({ ...prev, hreFermeMatin: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Ouverture après-midi
                                        <input
                                            type="time"
                                            value={horaireRequestForm.hreOuvreSoir}
                                            onChange={(e) => setHoraireRequestForm((prev) => ({ ...prev, hreOuvreSoir: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Fermeture après-midi
                                        <input
                                            type="time"
                                            value={horaireRequestForm.hreFermeSoir}
                                            onChange={(e) => setHoraireRequestForm((prev) => ({ ...prev, hreFermeSoir: e.target.value }))}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Message (optionnel)
                                        <textarea
                                            rows={3}
                                            placeholder="Ex: Besoin d'ouvrir plus tôt le lundi"
                                            value={horaireRequestForm.note}
                                            onChange={(e) => setHoraireRequestForm((prev) => ({ ...prev, note: e.target.value }))}
                                        />
                                    </label>
                                </div>

                                <div className="ol-modal-actions">
                                    <button type="button" className="btn" onClick={() => setShowHoraireRequestModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">Valider la demande</button>
                                </div>
                            </form>
                        </div>
                    )}
                </section>

                <section className="garage-card garage-card-wide">
                    <h2>Rendez-vous Garage</h2>
                    {rdvs.length === 0 ? (
                        <p>Aucun rendez-vous pour le moment.</p>
                    ) : (
                        <div className="rdv-table-wrap">
                            <table className="rdv-table">
                                <thead>
                                    <tr>
                                        <th>Nom client</th>
                                        <th>Plaque</th>
                                        <th>Marque</th>
                                        <th>Date debut</th>
                                        <th>Date fin</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rdvs.map((rdv) => (
                                        <tr key={rdv.idRdv}>
                                            <td>{[rdv.client?.prenom, rdv.client?.nom].filter(Boolean).join(" ") || rdv.client?.nom || "-"}</td>
                                            <td>{rdv.vehicule?.immatriculation || rdv.immatriculation || rdv.plaque || "-"}</td>
                                            <td>{rdv.vehicule?.marque || rdv.marque || "-"}</td>
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
                    {selectedRdv && (
                        <div className="ol-side-panel">
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
                    )}

                    {showRdvForm && (
                        <div className="ol-modal-backdrop" onClick={() => setShowRdvForm(false)}>
                            <form className="ol-modal" onSubmit={createNewRdv} onClick={(e) => e.stopPropagation()}>
                                <div className="ol-panel-header">
                                    <h3>Nouveau rendez-vous</h3>
                                    <button type="button" className="btn ol-close-btn" onClick={() => setShowRdvForm(false)}>✕</button>
                                </div>

                                <div className="ol-modal-grid">
                                    <label>
                                        Plaque immatriculation
                                        <input
                                            type="text"
                                            placeholder="Ex: AB-123-CD"
                                            value={newRdvForm.plaque}
                                            onChange={(e) => setNewRdvForm((p) => ({ ...p, plaque: e.target.value.toUpperCase() }))}
                                            required
                                        />
                                    </label>

                                    <div className="ol-modal-summary">
                                        {plateLookupState.status === "loading" && <span>Recherche du vehicule...</span>}
                                        {plateLookupState.status === "success" && <span>{plateLookupState.message}</span>}
                                        {plateLookupState.status === "error" && <span>{plateLookupState.message}</span>}
                                    </div>

                                    <div className="ol-modal-summary ol-modal-summary-fields">
                                        <div><strong>Client :</strong> {newRdvForm.clientPrenom || newRdvForm.clientNom ? `${newRdvForm.clientPrenom} ${newRdvForm.clientNom}`.trim() : "-"}</div>
                                        <div><strong>Marque :</strong> {newRdvForm.marque || "-"}</div>
                                        <div><strong>Modèle :</strong> {newRdvForm.modele || "-"}</div>
                                    </div>

                                    <label>
                                        Date de debut
                                        <input
                                            type="datetime-local"
                                            value={newRdvForm.dateDebut}
                                            onChange={(e) => setNewRdvForm((p) => ({ ...p, dateDebut: e.target.value }))}
                                            required
                                        />
                                    </label>

                                    <label>
                                        Duree
                                        <select
                                            value={newRdvForm.duration}
                                            onChange={(e) => setNewRdvForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                                        >
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 heure</option>
                                            <option value={90}>1h30</option>
                                            <option value={120}>2 heures</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="ol-modal-summary">
                                    {newRdvForm.dateDebut ? (
                                        <>
                                            <strong>Fin automatique :</strong>
                                            <span>
                                                {(() => {
                                                    const start = new Date(newRdvForm.dateDebut);
                                                    if (Number.isNaN(start.getTime())) return "Date invalide";
                                                    const end = new Date(start);
                                                    end.setMinutes(end.getMinutes() + (Number(newRdvForm.duration) || 60));
                                                    return end.toLocaleString("fr-FR");
                                                })()}
                                            </span>
                                        </>
                                    ) : (
                                        <span>Choisis une date sur l’agenda pour pre-remplir le rendez-vous.</span>
                                    )}
                                </div>

                                <div className="ol-modal-actions">
                                    <button type="button" className="btn" onClick={() => setShowRdvForm(false)}>
                                        Annuler
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Créer le RDV
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </section>

                <section className="garage-card garage-card-wide">
                    <h2>Prestations du garage</h2>
                    {garagePrestationMessage && <div className="alert alert-success">{garagePrestationMessage}</div>}
                    {garagePrestations.length > 0 ? (
                        <div className="garage-prestations-grid">
                            {garagePrestations.map((prestation) => (
                                <article key={`${prestation.idPrestation}-${prestation.idCategorie || "na"}`} className="garage-prestation-item">
                                    <div className="garage-prestation-item__head">
                                        <strong>{prestation.nomPrestation}</strong>
                                        <span className="garage-prestation-price">
                                            {prestation.prix !== null && prestation.prix !== undefined && prestation.prix !== ""
                                                ? `${Number(prestation.prix).toFixed(2)} €`
                                                : "Prix non défini"}
                                        </span>
                                    </div>
                                    <p>{prestation.descriptionPrestation || "Aucune description"}</p>
                                    <small>
                                        {prestation.nomCategorie || prestation.categorie?.nomCategorie || "Catégorie non définie"}
                                        {prestation.dureePrestation ? ` • ${prestation.dureePrestation}` : ""}
                                    </small>
                                    <div className="garage-prestation-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                                        {editingGaragePrestationId === prestation.idPrestation ? (
                                            <>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editingGaragePrestationPrice}
                                                    onChange={(e) => setEditingGaragePrestationPrice(e.target.value)}
                                                    aria-label={`Modifier le prix de ${prestation.nomPrestation}`}
                                                />
                                                <button type="button" className="btn btn-primary" onClick={() => saveGaragePrestationPrice(prestation)}>
                                                    Enregistrer
                                                </button>
                                                <button type="button" className="btn" onClick={cancelEditGaragePrestation}>
                                                    Annuler
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="button" className="btn btn-primary" onClick={() => startEditGaragePrestation(prestation)}>
                                                    Modifier le prix
                                                </button>
                                                <button type="button" className="btn" onClick={() => removeGaragePrestation(prestation)}>
                                                    Supprimer
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p>Aucune prestation n’est encore rattachée à ce garage.</p>
                    )}
                </section>

                <section className="garage-card garage-card-wide">
                    <h2>Choisir une prestation</h2>
                    <form onSubmit={handleAddPrestation} className="prestation-form">
                        <select
                            value={newPrestation.prestationId}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, prestationId: e.target.value }))}
                            required
                        >
                            <option value="">Sélectionner une prestation</option>
                            {prestationsCatalogue.map((prestation) => (
                                <option key={prestation.idPrestation} value={prestation.idPrestation}>
                                    {prestation.nomPrestation}
                                    {prestation.categorie ? ` - ${prestation.categorie}` : ""}
                                    {prestation.dureePrestation ? ` (${prestation.dureePrestation})` : ""}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Prix"
                            value={newPrestation.prix}
                            onChange={(e) => setNewPrestation((p) => ({ ...p, prix: e.target.value }))}
                            required
                        />
                        <button type="submit" className="btn btn-primary">Ajouter</button>
                    </form>
                </section>
            </div>
        </div>
    );
}
