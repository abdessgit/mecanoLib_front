import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Wrench,
 
  LogOut,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  BarChart3,
  Plus,
  History
} from 'lucide-react';
//import { motion } from 'framer-motion';
import {
  Button,

  Card,
  CardContent,
  StatusBadge,
  Modal
} from '../../../components/index.jsx';
import { useApp } from '../../../context/AppContext.jsx';
import { services } from '../../../data/mockData.js';
import {
  changeRendezVousStatus,
  changeGaragePassword,
  clearStoredAuth,
  getAssociations,
  getFrenchAddressSuggestions,
  getFrenchCitySuggestions,
  getGarageProfile,
  getGarageRendezVous,
  
  getHorairesByGarage,
  getJours,
  getStatusRendezVous,
  getStoredAuth,
  getVilles,
  isJwtExpired,
  isValidEmailFormat,
  upsertGarageHoraire,
  updateGaragePlanning,
  updateGarageProfile,
} from '../../../api/garageApi.js';
import { AuthConnexion } from '../../connexion/AuthConnexion.jsx';
import './DashboardGarage.css';

import { PrestationsManager } from '../../../components/index.jsx';

const FALLBACK_DAYS = [
  { jourId: '1', libJour: 'Lundi' },
  { jourId: '2', libJour: 'Mardi' },
  { jourId: '3', libJour: 'Mercredi' },
  { jourId: '4', libJour: 'Jeudi' },
  { jourId: '5', libJour: 'Vendredi' },
  { jourId: '6', libJour: 'Samedi' },
  { jourId: '7', libJour: 'Dimanche' },
];

const buildDefaultWeekSchedule = (days = FALLBACK_DAYS) =>
  days.map((jour) => ({
    jourId: String(jour?.jourId ?? ''),
    libJour: jour?.libJour || 'Jour',
    horaireId: '',
    hasAssociation: false,
    mode: 'closed',
    hreOuvreMatin: '08:00',
    hreFermeMatin: '12:00',
    hreOuvreSoir: '14:00',
    hreFermeSoir: '18:00',
  }));

const normalizeDayLabel = (value = '') => value.toString().trim().toLowerCase();

const DEFAULT_STATUS_MAP = {
  reserved: 1,
  pending: 1,
  confirmed: 2,
  completed: 3,
  refused: 4,
  cancelled_client: 5,
  cancelled_garage: 5,
};


// Helper pour obtenir la date locale au format YYYY-MM-DD (évite les problèmes de timezone UTC)
const toLocalISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper pour obtenir l'heure locale au format HH:MM
const toLocalTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const mapStatusIdToKey = (statusId, label = '') => {
  const normalizedLabel = String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Détection par label (plus précise)
  if (normalizedLabel.includes('confirm')) return 'confirmed';
  if (normalizedLabel.includes('term')) return 'completed';
  if (normalizedLabel.includes('refus')) return 'refused';
  if (normalizedLabel.includes('annul')) {
    // Distinction entre annulation client et garage
    if (normalizedLabel.includes('client')) return 'cancelled_client';
    return 'cancelled_garage';
  }
  if (normalizedLabel.includes('attente')) return 'pending';

  // Fallback par ID
  switch (Number(statusId)) {
    case 1:
      return 'pending';
    case 2:
      return 'confirmed';
    case 3:
      return 'completed';
    case 4:
      return 'refused';
    case 5:
      return 'cancelled_client';
    case 6:
      return 'cancelled_garage';
    default:
      return 'pending';
  }
};

const toMinutes = (time) => {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  return (hours * 60) + minutes;
};

const fromMinutes = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
};

const buildSlotsBetween = (start, end) => {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (endMin <= startMin) return [];

  const slots = [];
  for (let t = startMin; t + 30 <= endMin; t += 30) {
    slots.push(fromMinutes(t));
  }
  return slots;
};

const getWeekStart = (date) => {
  const current = new Date(date);
  const dayIndex = current.getDay();
  const diff = dayIndex === 0 ? -6 : 1 - dayIndex;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

const normalizeHorairePayload = (payload) => {
  const source = payload?.horaire || payload || {};
  const horaireSource = source?.horaire || source;
  const id =
    horaireSource?.id_horaire ??
    horaireSource?.idHoraire ??
    source?.id_horaire ??
    source?.idHoraire ??
    source?.id ??
    '';

  return {
    id: id ? String(id) : '',
    hreOuvreMatin: horaireSource?.hre_ouvre_matin || horaireSource?.hreOuvreMatin || '08:00',
    hreFermeMatin: horaireSource?.hre_ferme_matin || horaireSource?.hreFermeMatin || '12:00',
    hreOuvreSoir: horaireSource?.hre_ouvre_soir || horaireSource?.hreOuvreSoir || '14:00',
    hreFermeSoir: horaireSource?.hre_ferme_soir || horaireSource?.hreFermeSoir || '18:00',
  };
};

const GarageDashboard = () => {

  const navigate = useNavigate();
  const {  garageAuth, logoutGarage, updateAppointmentStatus } = useApp();
  const { logout } = useContext(AuthConnexion);
  const { token, role, garageId: storedGarageId, profile: storedProfile } = getStoredAuth();
  const isAuthenticated = Boolean(token) && !isJwtExpired(token) && role === 'garage';
  const storedGarageName = storedProfile?.garage?.nomGarage
    || storedProfile?.garage?.nom_garage
    || storedProfile?.nomGarage
    || storedProfile?.nom_garage
    || garageAuth.user?.name
    || 'Garage';
  const storedGarageEmail = storedProfile?.garage?.emailGarage
    || storedProfile?.garage?.email_garage
    || storedProfile?.emailGarage
    || storedProfile?.email_garage
    || storedProfile?.email
    || storedProfile?.emailUtilisateur
    || garageAuth.user?.email
    || '';
  const storedUserId = storedProfile?.idUtilisateur
    || storedProfile?.id_utilisateur
    || storedProfile?.userId
    || storedProfile?.idUser
    || storedProfile?.utilisateur?.idUtilisateur
    || storedProfile?.utilisateur?.id_utilisateur
    || storedProfile?.utilisateur?.id
    || storedProfile?.user?.id
    || '';
  
  const [activeTab, setActiveTab] = useState('appointments');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [connectedGarageName, setConnectedGarageName] = useState(storedGarageName);
  const [garageId, setGarageId] = useState(storedGarageId || '');
  const [garageForm, setGarageForm] = useState({
    nomGarage: '',
    emailGarage: '',
    telephoneGarage: '',
    adresseGarage: '',
    ville: '',
    postalCode: '',
    id_ville: '',
    code_insee: '',
  });
  const [villes, setVilles] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState(buildDefaultWeekSchedule());
  const [initialWeekSchedule, setInitialWeekSchedule] = useState(buildDefaultWeekSchedule());
  
  // Historique states

  const [remoteAppointments, setRemoteAppointments] = useState([]);
  const [statusMap, setStatusMap] = useState(DEFAULT_STATUS_MAP);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA states
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [is2FAActivated, setIs2FAActivated] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [messageActivation, setMessageActivation] = useState('');
  const [messageValidation, setMessageValidation] = useState('');

/*  useEffect(() => {
    if (!token) return;
    const check2FA = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/users/connecter', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setIs2FAActivated(data.is2fa === true);
      } catch (err) {
        console.error(err);
      }
    };
    check2FA();
  }, [token]);*/

 // activation du code 2FA 
    const activer2FA = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/activer_2fa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: storedGarageEmail })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setMessageActivation(" Vérifie ton email pour scanner le QR code");
            setIs2FARequired(true);
            setIs2FAActivated(true);

        } catch (err) {
            setMessageActivation(err.message);
        }
    };
    // Verefication de code 2FA generer 
    const handle2FASubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/verify_2fa", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                email: storedGarageEmail,
                code: code2FA
              })
            });

            const text = await res.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Réponse serveur invalide (pas du JSON)");
            }

            if (!res.ok) throw new Error(data.message);

            setMessageValidation("2FA validé avec succès ");
            setIs2FARequired(false);

        } catch (err) {
            setMessageValidation(err.message);
        }
    };
  const desactiver2FA = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/users/desactiver_2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: storedGarageEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessageValidation('2FA désactivé');
      setIs2FARequired(false);
      setIs2FAActivated(false);
    } catch (err) {
      setMessageValidation(err.message);
    }
  };

  const normalizeText = useCallback((value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase(), []);

  const findMatchingVilleId = useCallback(({ cityName, postcode, codeInsee }) => {
    const matchedVille = villes.find((ville) => {
      const sameName = normalizeText(ville?.nom_ville) === normalizeText(cityName);
      const samePostcode = String(ville?.code_postal || '') === String(postcode || '');
      const sameInsee = String(ville?.code_insee || ville?.code_inssee || '') === String(codeInsee || '');
      return sameInsee || (sameName && samePostcode) || sameName;
    });

    return matchedVille?.id_ville ? String(matchedVille.id_ville) : '';
  }, [normalizeText, villes]);

  const getLocalCitySuggestions = useCallback((value) => {
    const query = normalizeText(value);
    if (!query) return [];

    return villes
      .filter((ville) => normalizeText(ville?.nom_ville).startsWith(query))
      .slice(0, 6)
      .map((ville) => ({
        city: ville?.nom_ville || '',
        postcode: ville?.code_postal || '',
        codeInsee: ville?.code_insee || ville?.code_inssee || '',
        label: `${ville?.nom_ville || ''} ${ville?.code_postal || ''}`.trim(),
      }));
  }, [normalizeText, villes]);

  useEffect(() => {
    const loadVilles = async () => {
      try {
        const villeData = await getVilles();
        if (Array.isArray(villeData)) {
          setVilles(villeData);
        }
      } catch {
        // L'autocompletion officielle reste disponible meme si la liste locale echoue.
      }
    };

    loadVilles();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearStoredAuth();
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const normalizeGaragePayload = useCallback((payload) => {
    const source = payload?.garage || payload?.data?.garage || payload || {};
    const id = source?.idGarage ?? source?.id_garage ?? source?.id ?? storedGarageId ?? '';
    const villeObject = typeof source?.ville === 'object' && source?.ville !== null ? source.ville : {};
    const villeName = typeof source?.ville === 'string'
      ? source.ville
      : source?.nom_ville || source?.villeGarage || source?.ville_garage || villeObject?.nom_ville || villeObject?.nomVille || '';

    return {
      id: id ? String(id) : '',
      nomGarage: source?.nomGarage || source?.nom_garage || source?.nom || storedGarageName || '',
      emailGarage: source?.emailGarage || source?.email_garage || source?.email || storedGarageEmail || '',
      telephoneGarage: source?.telephoneGarage || source?.telephone_garage || source?.telephone || '',
      adresseGarage: source?.adresseGarage || source?.adresse_garage || source?.adresse || '',
      ville: villeName,
      postalCode: source?.cp || source?.code_postal || source?.codePostal || villeObject?.code_postal || villeObject?.cp || '',
      id_ville: String(source?.id_ville || source?.idVille || source?.villeId || villeObject?.id_ville || ''),
      code_insee: source?.code_insee || source?.codeInsee || villeObject?.code_insee || villeObject?.code_inssee || '',
    };
  }, [storedGarageEmail, storedGarageId, storedGarageName]);

  useEffect(() => {
    const loadConnectedGarageName = async () => {
      if (!token || !isAuthenticated) return;
      try {
        const profile = await getGarageProfile(token, storedGarageId || garageId || undefined);
        const normalized = normalizeGaragePayload(profile);
        if (normalized.nomGarage) {
          setConnectedGarageName(normalized.nomGarage);
        }
        if (normalized.id) {
          setGarageId(normalized.id);
        }
      } catch {
        // Garder le nom deja disponible localement si l'API echoue.
      }
    };

    loadConnectedGarageName();
  }, [token, isAuthenticated, storedGarageId, garageId, normalizeGaragePayload]);

  const loadGarageSettings = useCallback(async () => {
    if (!token) return;
    setSettingsLoading(true);
    setSettingsError('');

    try {
      const profile = await getGarageProfile(token, storedGarageId || garageId || undefined);
      const normalizedGarage = normalizeGaragePayload(profile);

      setGarageId(normalizedGarage.id || storedGarageId || '');
      setGarageForm({
        nomGarage: normalizedGarage.nomGarage,
        emailGarage: normalizedGarage.emailGarage,
        telephoneGarage: normalizedGarage.telephoneGarage,
        adresseGarage: normalizedGarage.adresseGarage,
        ville: normalizedGarage.ville,
        postalCode: normalizedGarage.postalCode,
        id_ville: normalizedGarage.id_ville,
        code_insee: normalizedGarage.code_insee,
      });

      if (normalizedGarage.id) {
        const [horairesResult, joursResult, associationsResult] = await Promise.allSettled([
          getHorairesByGarage(token, normalizedGarage.id),
          getJours(),
          getAssociations(),
        ]);

        const horairesResponse = horairesResult.status === 'fulfilled' ? horairesResult.value : [];
        const joursResponse = joursResult.status === 'fulfilled' ? joursResult.value : [];
        const associationsResponse = associationsResult.status === 'fulfilled' ? associationsResult.value : [];

        const order = {
          lundi: 1,
          mardi: 2,
          mercredi: 3,
          jeudi: 4,
          vendredi: 5,
          samedi: 6,
          dimanche: 7,
        };

        const jours = (Array.isArray(joursResponse) ? joursResponse : [])
          .map((jour) => ({
            jourId: String(jour?.id_jour ?? jour?.idJour ?? jour?.id ?? ''),
            libJour: jour?.lib_jour || jour?.libJour || 'Jour',
          }))
          .filter((jour) => jour.jourId)
          .sort((a, b) => {
            const aKey = (a.libJour || '').toLowerCase();
            const bKey = (b.libJour || '').toLowerCase();
            return (order[aKey] || 99) - (order[bKey] || 99);
          });

        const normalizedHoraires = (Array.isArray(horairesResponse) ? horairesResponse : [])
          .map((item) => normalizeHorairePayload(item))
          .filter((item) => item.id);

        const findHoraireIdByTimes = ({ hreOuvreMatin, hreFermeMatin, hreOuvreSoir, hreFermeSoir }) => {
          const matched = normalizedHoraires.find((item) => (
            item.hreOuvreMatin === hreOuvreMatin
            && item.hreFermeMatin === hreFermeMatin
            && item.hreOuvreSoir === hreOuvreSoir
            && item.hreFermeSoir === hreFermeSoir
          ));

          return matched?.id || '';
        };

        const defaultHoraireId = findHoraireIdByTimes({
          hreOuvreMatin: '08:00',
          hreFermeMatin: '12:00',
          hreOuvreSoir: '14:00',
          hreFermeSoir: '18:00',
        });

        const assocForGarage = (Array.isArray(associationsResponse) ? associationsResponse : [])
          .filter((assoc) => String(assoc?.id_garage ?? assoc?.idGarage ?? assoc?.garage?.id_garage ?? assoc?.garage?.idGarage ?? '') === String(normalizedGarage.id));

        const weekDays = FALLBACK_DAYS.map((fallbackDay) => {
          const matchedDay = jours.find((jour) => (
            String(jour.jourId) === String(fallbackDay.jourId)
            || normalizeDayLabel(jour.libJour) === normalizeDayLabel(fallbackDay.libJour)
          ));

          return matchedDay || fallbackDay;
        });

        const initialWeek = weekDays.map((jour) => {
          const assoc = assocForGarage.find(
            (item) => String(item?.id_jour ?? item?.idJour ?? item?.jour?.id_jour ?? item?.jour?.idJour ?? '') === String(jour.jourId)
          );

          if (!assoc) {
            return {
              jourId: jour.jourId,
              libJour: jour.libJour,
              horaireId: String(defaultHoraireId || ''),
              hasAssociation: false,
              mode: 'open',
              hreOuvreMatin: '08:00',
              hreFermeMatin: '12:00',
              hreOuvreSoir: '14:00',
              hreFermeSoir: '18:00',
            };
          }

          const assocHoraireId = String(
            assoc?.id_horaire
            ?? assoc?.idHoraire
            ?? assoc?.horaire?.id_horaire
            ?? assoc?.horaire?.idHoraire
            ?? ''
          );

          const linkedHoraire = normalizedHoraires.find((item) => String(item.id) === assocHoraireId);

          const matinOuvre = assoc?.hre_ouvre_matin || assoc?.hreOuvreMatin || assoc?.horaire?.hre_ouvre_matin || assoc?.horaire?.hreOuvreMatin || linkedHoraire?.hreOuvreMatin || '08:00';
          const matinFerme = assoc?.hre_ferme_matin || assoc?.hreFermeMatin || assoc?.horaire?.hre_ferme_matin || assoc?.horaire?.hreFermeMatin || linkedHoraire?.hreFermeMatin || '12:00';
          const soirOuvre = assoc?.hre_ouvre_soir || assoc?.hreOuvreSoir || assoc?.horaire?.hre_ouvre_soir || assoc?.horaire?.hreOuvreSoir || linkedHoraire?.hreOuvreSoir || '14:00';
          const soirFerme = assoc?.hre_ferme_soir || assoc?.hreFermeSoir || assoc?.horaire?.hre_ferme_soir || assoc?.horaire?.hreFermeSoir || linkedHoraire?.hreFermeSoir || '18:00';

          const matinClosed = matinOuvre === '00:00' && matinFerme === '00:00';
          const soirClosed = soirOuvre === '00:00' && soirFerme === '00:00';

          let mode = 'open';
          if (matinClosed && soirClosed) mode = 'closed';
          else if (matinClosed) mode = 'closed_morning';
          else if (soirClosed) mode = 'closed_afternoon';

          const resolvedHoraireId = assocHoraireId || findHoraireIdByTimes({
            hreOuvreMatin: matinOuvre,
            hreFermeMatin: matinFerme,
            hreOuvreSoir: soirOuvre,
            hreFermeSoir: soirFerme,
          });

          return {
            jourId: jour.jourId,
            libJour: jour.libJour,
            horaireId: String(resolvedHoraireId || ''),
            hasAssociation: true,
            mode,
            hreOuvreMatin: matinOuvre,
            hreFermeMatin: matinFerme,
            hreOuvreSoir: soirOuvre,
            hreFermeSoir: soirFerme,
          };
        });

        setWeekSchedule(initialWeek);
        setInitialWeekSchedule(initialWeek);
      }
    } catch (err) {
      setWeekSchedule((prev) => (prev?.length ? prev : buildDefaultWeekSchedule()));
      setSettingsError(err.message || 'Impossible de charger les parametres du garage.');
    } finally {
      setSettingsLoading(false);
    }
  }, [token, storedGarageId, garageId, normalizeGaragePayload]);

  useEffect(() => {
    if (isAuthenticated && (activeTab === 'settings' || activeTab === 'calendar')) {
      loadGarageSettings();
    }
  }, [isAuthenticated, activeTab, loadGarageSettings]);

  useEffect(() => {
    const loadStatuses = async () => {
      if (!token || !isAuthenticated) return;

      try {
        const response = await getStatusRendezVous(token);
        const nextStatusMap = { ...DEFAULT_STATUS_MAP };

        (Array.isArray(response) ? response : []).forEach((item) => {
          const statusKey = mapStatusIdToKey(item?.id_status_rdv, item?.lib_status_rdv);
          nextStatusMap[statusKey] = Number(item?.id_status_rdv || nextStatusMap[statusKey] || 0);
        });

        setStatusMap(nextStatusMap);
      } catch {
        setStatusMap(DEFAULT_STATUS_MAP);
      }
    };

    loadStatuses();
  }, [token, isAuthenticated]);

  const loadRemoteGarageAppointments = useCallback(async () => {
    const currentGarageId = garageId || storedGarageId;
    console.log('🔍 ID Garage utilisé pour charger les RDV:', currentGarageId);
    console.log('🔍 garageId (state):', garageId, '| storedGarageId (localStorage):', storedGarageId);
    
    if (!currentGarageId) {
      console.warn('⚠️ Aucun ID garage trouvé !');
      setRemoteAppointments([]);
      return;
    }

    try {
      console.log('🔄 Chargement des RDV du garage ID:', currentGarageId);
      const response = await getGarageRendezVous(token, currentGarageId);
      console.log('✅ RDV reçus:', response);
      
      console.log('📦 Structure premier RDV:', response?.[0]);
      
      const normalized = (Array.isArray(response) ? response : []).map((item) => {
        const start = item?.date_debut ? new Date(String(item.date_debut).replace(' ', 'T')) : null;
        
        // Debug: log les clés disponibles
        if (item?.id_rdv && item.id_rdv < 5) {
          console.log(`🔍 RDV ${item.id_rdv} - Clés:`, Object.keys(item || {}));
          console.log(`🔍 RDV ${item.id_rdv} - id_client:`, item?.id_client, 'client:', item?.client, 'utilisateur:', item?.utilisateur);
        }
        
        // Extraire les infos client si disponibles (plusieurs formats possibles)
        let client = item?.client || item?.utilisateur || item?.user || {};
        // Si c'est juste un ID, chercher dans d'autres champs
        if (!client?.prenom && !client?.nom && item?.nom_client) {
          client = { 
            prenom: item?.prenom_client || '', 
            nom: item?.nom_client || '',
            email: item?.email_client || '' 
          };
        }
        
        const vehicule = item?.vehicule || item?.vehicle || item?.voiture || {};
        const prestation = item?.prestation || item?.service || {};

        return {
          id: `api-${item?.id_rdv}`,
          backendId: String(item?.id_rdv || ''),
          garageId: String(item?.id_garage || currentGarageId),
          garageName: connectedGarageName || storedGarageName || 'Garage',
          service: String(prestation?.id_prestation || item?.id_prestation || 'rdv'),
          serviceName: prestation?.nom_prestation || item?.nom_prestation || item?.lib_prestation || 'Rendez-vous',
          client: {
            firstName: client?.prenom || client?.prenom_client || item?.prenom_client || '',
            lastName: client?.nom || client?.nom_client || item?.nom_client || '',
            email: client?.email || client?.email_utilisateur || item?.email_client || '',
            phone: client?.telephone || client?.tel || item?.tel_client || '',
          },
          vehicle: {
            plate: vehicule?.immatriculation || vehicule?.plaque || item?.immatriculation || '-',
            // Gérer le cas où marque est un objet (on prend nom_marque) ou une string
            brand: typeof vehicule?.marque === 'string' 
              ? vehicule.marque 
              : (vehicule?.marque?.nom_marque || item?.marque_vehicule || ''),
            model: typeof vehicule?.modele === 'string' 
              ? vehicule.modele 
              : (vehicule?.modele?.nom_modele || item?.modele_vehicule || ''),
          },
          date: start && !Number.isNaN(start.getTime()) ? toLocalISODate(start) : '',
          time: start && !Number.isNaN(start.getTime()) ? toLocalTime(start) : '',
          status: mapStatusIdToKey(item?.id_status_rdv, item?.lib_status_rdv),
          notes: item?.commantaire_client || item?.motif_refus || '',
        };
      }).filter((item) => item.date && item.time);

      console.log('📋 RDV normalisés:', normalized);
      setRemoteAppointments(normalized);
    } catch (err) {
      console.error('❌ Erreur chargement RDV:', err);
      setRemoteAppointments([]);
    }
  }, [garageId, storedGarageId, token, connectedGarageName, storedGarageName]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRemoteGarageAppointments();
    }
  }, [isAuthenticated, loadRemoteGarageAppointments]);

  // Charger les historiques
 

  // Charger les historiques quand l'onglet est actif


  const garageAppointments = useMemo(() => {
    // On utilise UNIQUEMENT les rendez-vous de l'API (remoteAppointments)
    const validRemote = (Array.isArray(remoteAppointments) ? remoteAppointments : [])
      .filter((apt) => apt?.backendId); // Juste vérifier qu'il y a un backendId
    
    console.log('📊 garageAppointments:', validRemote.length, 'RDV depuis API');
    console.log('📋 Premier RDV:', validRemote[0]);
    
    return validRemote;
  }, [remoteAppointments]);

  // Filtrer les rendez-vous
  const filteredAppointments = useMemo(() => {
    console.log('🔍 Filtrage - statusFilter:', statusFilter, 'searchQuery:', searchQuery);
    console.log('🔍 Nombre RDV avant filtre:', garageAppointments.length);
    console.log('🔍 Premier RDV:', garageAppointments[0]);
    
    const filtered = garageAppointments.filter((apt) => {
      // Normaliser le statut pour comparaison
      const aptStatus = String(apt?.status || '').toLowerCase().trim();
      const filterStatus = String(statusFilter || '').toLowerCase().trim();
      
      // Si filtre = 'all', tout accepter
      // Sinon comparer exactement ou partiellement
      const matchesStatus = filterStatus === 'all' || aptStatus === filterStatus;
      
      const searchHaystack = `${apt?.client?.firstName || ''} ${apt?.client?.lastName || ''} ${apt?.vehicle?.plate || ''} ${apt?.serviceName || ''} ${apt?.id || ''}`.toLowerCase();
      const matchesSearch = !searchQuery || searchHaystack.includes(searchQuery.toLowerCase());
      
      console.log('🔍 RDV', apt.id, '- statut:', aptStatus, '- matchesStatus:', matchesStatus);
      
      return matchesStatus && matchesSearch;
    });
    
    console.log('🔍 Nombre RDV après filtre:', filtered.length);
    return filtered;
  }, [garageAppointments, statusFilter, searchQuery]);

  const pendingAppointments = useMemo(() => {
    return [...garageAppointments]
      .filter((appointment) => {
        const status = String(appointment?.status || '').toLowerCase().trim();
        return ['pending', 'reserved', 'en attente', '2'].includes(status) || status.includes('attente');
      })
      .sort((a, b) => new Date(`${a?.date || ''}T${a?.time || '00:00'}`).getTime() - new Date(`${b?.date || ''}T${b?.time || '00:00'}`).getTime());
  }, [garageAppointments]);

  // Fonction utilitaire pour vérifier si un rendez-vous est actif (affichable)
  const isAppointmentActive = useCallback((status) => {
    const normalizedStatus = String(status || '').toLowerCase().trim();
    // Liste des statuts inactifs (annulés/refusés)
    const inactiveStatuses = [
      'cancelled_client', 'cancelled_garage', 'refused',
      'annulé client', 'annulé garage', 'refusé',
      'annule client', 'annule garage', 'refuse',
      '4', '5', '6'  // IDs des statuts: Refusé(4), Annulé client(5), Annulé garage(6)
    ];
    return !inactiveStatuses.includes(normalizedStatus);
  }, []);

  const weekCalendarDays = useMemo(() => {
    const weekStart = getWeekStart(currentDate);

    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);

      const isoDate = toLocalISODate(dayDate);
      const dayName = normalizeDayLabel(dayDate.toLocaleDateString('fr-FR', { weekday: 'long' }));
      const daySchedule = (weekSchedule || []).find((day) => normalizeDayLabel(day?.libJour) === dayName);
      const morningSlots = daySchedule ? buildSlotsBetween(daySchedule.hreOuvreMatin, daySchedule.hreFermeMatin) : [];
      const eveningSlots = daySchedule ? buildSlotsBetween(daySchedule.hreOuvreSoir, daySchedule.hreFermeSoir) : [];
      const daySlots = [...morningSlots, ...eveningSlots];

      return {
        isoDate,
        label: dayDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        slots: daySlots.map((time) => ({
          time,
          appointment: garageAppointments.find((appointment) => (
            appointment?.date === isoDate
            && appointment?.time === time
            && isAppointmentActive(appointment?.status)
          )) || null,
        })),
      };
    });
  }, [currentDate, weekSchedule, garageAppointments, isAppointmentActive]);

  if (!isAuthenticated) {
    return null;
  }

  // Statistiques
  const today = toLocalISODate(new Date());
  const stats = [
    { 
      label: 'RDV du jour', 
      value: garageAppointments.filter((a) => a.date === today && isAppointmentActive(a.status)).length,
      icon: Calendar,
      color: 'blue'
    },
    { 
      label: 'À confirmer', 
      value: garageAppointments.filter((a) => {
        const s = String(a?.status || '').toLowerCase();
        return ['pending', 'reserved', 'en attente'].includes(s) || s.includes('attente');
      }).length,
      icon: Clock,
      color: 'yellow'
    },
    { 
      label: 'Confirmés', 
      value: garageAppointments.filter((a) => {
        const s = String(a?.status || '').toLowerCase();
        return s === 'confirmed' || s === 'confirmé' || s === '2';
      }).length,
      icon: CheckCircle,
      color: 'green'
    },
    { 
      label: 'Total clients', 
      value: new Set(garageAppointments.map((a) => a?.client?.email || a?.id).filter(Boolean)).size,
      icon: Users,
      color: 'purple'
    },
  ];

  const handleLogout = () => {
    clearStoredAuth();
    logoutGarage();
    logout();
    navigate('/');
  };

  const handleViewDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
    setIsNotificationsOpen(false);
  };

  const handleNotificationClick = (appointment) => {
    setStatusFilter('pending');
    setActiveTab('appointments');
    setHighlightedAppointmentId(String(appointment?.id || ''));
    handleViewDetail(appointment);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(`garage-appointment-${appointment?.id}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    const targetAppointment = garageAppointments.find((appointment) => appointment.id === appointmentId);

    try {
      const hasBackendBinding = Boolean(targetAppointment?.backendId) || String(targetAppointment?.id || '').startsWith('api-');
      const backendId = hasBackendBinding
        ? Number(targetAppointment?.backendId || String(targetAppointment?.id || '').replace(/\D+/g, ''))
        : 0;
      const statusId = Number(statusMap?.[newStatus] || DEFAULT_STATUS_MAP[newStatus] || 0);

      if (backendId && token && statusId) {
        await changeRendezVousStatus(token, {
          id_rdv: backendId,
          id_status_rdv: statusId,
        });
      }

      updateAppointmentStatus(appointmentId, newStatus);
      setRemoteAppointments((prev) => prev.map((appointment) => (
        appointment.id === appointmentId || appointment.backendId === String(backendId)
          ? { ...appointment, status: newStatus }
          : appointment
      )));

      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }
    } catch (error) {
      setSettingsError(error.message || 'Impossible de changer le statut du rendez-vous.');
    }
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || serviceId;
  };

  const navigateDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const searchFrenchCities = async (value) => {
    if (!value.trim()) {
      setCitySuggestions([]);
      return;
    }

    const localSuggestions = getLocalCitySuggestions(value);
    setCitySuggestions(localSuggestions);
    setCityLoading(true);
    try {
      const suggestions = await getFrenchCitySuggestions(value);
      const merged = [...localSuggestions];

      suggestions.forEach((suggestion) => {
        const exists = merged.some((item) => item.label === suggestion.label);
        if (!exists) {
          merged.push(suggestion);
        }
      });

      setCitySuggestions(merged);
    } catch {
      setCitySuggestions(localSuggestions);
    } finally {
      setCityLoading(false);
    }
  };

  const searchFrenchAddresses = async (value, city = '', postcode = '') => {
    if (!value.trim()) {
      setAddressSuggestions([]);
      return;
    }

    setAddressLoading(true);
    try {
      const suggestions = await getFrenchAddressSuggestions(value, { city, postcode });
      setAddressSuggestions(suggestions);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleGarageFieldChange = (event) => {
    const { name, value } = event.target;

    setGarageForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'ville' ? { id_ville: '', code_insee: '', postalCode: '' } : {}),
    }));

    if (name === 'ville') {
      searchFrenchCities(value);
    }

    if (name === 'adresseGarage') {
      searchFrenchAddresses(value, garageForm.ville, garageForm.postalCode);
    }
  };

  const selectCitySuggestion = (suggestion) => {
    const matchedVilleId = findMatchingVilleId({
      cityName: suggestion.city,
      postcode: suggestion.postcode,
      codeInsee: suggestion.codeInsee,
    });

    setGarageForm((current) => ({
      ...current,
      ville: suggestion.city,
      postalCode: suggestion.postcode,
      code_insee: suggestion.codeInsee,
      id_ville: matchedVilleId,
    }));
    setCitySuggestions([]);
    setSettingsError('');
  };

  const selectAddressSuggestion = (suggestion) => {
    const matchedVilleId = findMatchingVilleId({
      cityName: suggestion.city,
      postcode: suggestion.postcode,
      codeInsee: suggestion.codeInsee,
    });

    setGarageForm((current) => ({
      ...current,
      adresseGarage: suggestion.address,
      ville: suggestion.city || current.ville,
      postalCode: suggestion.postcode || current.postalCode,
      code_insee: suggestion.codeInsee || current.code_insee,
      id_ville: matchedVilleId || current.id_ville,
    }));
    setAddressSuggestions([]);
    setSettingsError('');
  };

  const handleSaveGarageInfo = async () => {
    if (!token) return;

    const resolvedVilleId = garageForm.id_ville || findMatchingVilleId({
      cityName: garageForm.ville,
      postcode: garageForm.postalCode,
      codeInsee: garageForm.code_insee,
    });

    if (!garageForm.nomGarage.trim() || !garageForm.emailGarage.trim() || !garageForm.telephoneGarage.trim() || !garageForm.adresseGarage.trim()) {
      setSettingsError('Merci de remplir le nom, l email, le telephone et l adresse du garage.');
      return;
    }

    if (!isValidEmailFormat(garageForm.emailGarage)) {
      setSettingsError('Merci de saisir une adresse email valide avant la modification.');
      return;
    }

    setSettingsSaving(true);
    setSettingsMessage('');
    setSettingsError('');

    try {
      await updateGarageProfile(token, {
        idGarage: garageId || undefined,
        nomGarage: garageForm.nomGarage.trim(),
        emailGarage: garageForm.emailGarage.trim(),
        telephoneGarage: garageForm.telephoneGarage.trim(),
        adresseGarage: garageForm.adresseGarage.trim(),
        ville: garageForm.ville.trim(),
        postalCode: garageForm.postalCode.trim(),
        codeInsee: garageForm.code_insee || undefined,
        villeId: resolvedVilleId ? Number(resolvedVilleId) : undefined,
      });
      setConnectedGarageName(garageForm.nomGarage.trim());
      setGarageForm((prev) => ({ ...prev, id_ville: resolvedVilleId || prev.id_ville }));
      setSettingsMessage('Informations du garage mises a jour avec succes.');
      await loadGarageSettings();
    } catch (err) {
      setSettingsError(err.message || 'Impossible de modifier les informations du garage.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
    setSettingsError('');
    setSettingsMessage('');
  };

  const handleSavePassword = async () => {
    if (!token) return;

    // Validation des champs
    if (!passwordForm.currentPassword.trim() || !passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      setSettingsError('Merci de renseigner le mot de passe actuel et le nouveau mot de passe.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setSettingsError('Le nouveau mot de passe doit contenir au minimum 6 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSettingsError('La confirmation du nouveau mot de passe ne correspond pas.');
      return;
    }

    setSettingsSaving(true);
    setSettingsMessage('');
    setSettingsError('');

    console.log('🔄 Tentative de changement de mot de passe...');
    console.log('  - Garage ID:', garageId);
    console.log('  - User ID:', storedUserId);
    console.log('  - Email:', storedGarageEmail);

    try {
      const payload = {
        idGarage: garageId || undefined,
        userId: storedUserId || undefined,
        emailGarage: storedGarageEmail || undefined,
        emailUtilisateur: storedGarageEmail || undefined,
        currentPassword: passwordForm.currentPassword,
        ancienMdp: passwordForm.currentPassword,
        oldPassword: passwordForm.currentPassword,
        mdp: passwordForm.newPassword,
        mdpUtilisateur: passwordForm.newPassword,
        password: passwordForm.newPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      };

      console.log('📤 Payload envoyé:', { ...payload, currentPassword: '***', mdp: '***', password: '***', newPassword: '***' });

      const result = await changeGaragePassword(token, payload);
      console.log('✅ Résultat:', result);

      // Vider le formulaire
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSettingsMessage('Mot de passe mis à jour avec succès ! Vous pouvez vous reconnecter avec le nouveau mot de passe.');
    } catch (err) {
      console.error('❌ Erreur changement mot de passe:', err);
      setSettingsError(err.message || 'Impossible de modifier le mot de passe. Vérifiez que le mot de passe actuel est correct.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveHoraires = async () => {
    if (!token || !garageId) {
      setSettingsError('Garage introuvable pour la mise a jour des horaires.');
      return;
    }

    setSettingsSaving(true);
    setSettingsMessage('');
    setSettingsError('');

    try {
      const hasDayChanged = (day) => {
        const initialDay = (initialWeekSchedule || []).find((item) => String(item.jourId) === String(day.jourId));
        if (!initialDay) return true;

        return (
          initialDay.mode !== day.mode
          || initialDay.hreOuvreMatin !== day.hreOuvreMatin
          || initialDay.hreFermeMatin !== day.hreFermeMatin
          || initialDay.hreOuvreSoir !== day.hreOuvreSoir
          || initialDay.hreFermeSoir !== day.hreFermeSoir
        );
      };

      const daysToPersist = (weekSchedule || []).filter((day) => !day.hasAssociation || hasDayChanged(day));

      if (!daysToPersist.length) {
        setSettingsMessage('Aucune modification detectee sur les horaires.');
        setSettingsSaving(false);
        return;
      }

      const planningToCreate = [];
      const nextSchedule = [...weekSchedule];

      for (const day of daysToPersist) {
        const hadExistingAssociation = Boolean(day.hasAssociation);
        const payloadHours = day.mode === 'closed'
          ? {
              hreOuvreMatin: '00:00',
              hreFermeMatin: '00:00',
              hreOuvreSoir: '00:00',
              hreFermeSoir: '00:00',
            }
          : {
              hreOuvreMatin: day.mode === 'closed_morning' ? '00:00' : day.hreOuvreMatin,
              hreFermeMatin: day.mode === 'closed_morning' ? '00:00' : day.hreFermeMatin,
              hreOuvreSoir: day.mode === 'closed_afternoon' ? '00:00' : day.hreOuvreSoir,
              hreFermeSoir: day.mode === 'closed_afternoon' ? '00:00' : day.hreFermeSoir,
            };

        const response = await upsertGarageHoraire(token, {
          idGarage: garageId,
          idHoraire: day.horaireId || undefined,
          ...payloadHours,
        });

        const normalizedHoraire = normalizeHorairePayload(response?.horaire || response);
        const resolvedHoraireId = normalizedHoraire.id || day.horaireId;
        if (!resolvedHoraireId) {
          throw new Error(`Impossible de determiner l horaire pour ${day.libJour}.`);
        }

        if (!hadExistingAssociation) {
          planningToCreate.push({
            jourId: Number(day.jourId),
            idJour: Number(day.jourId),
            id_jour: Number(day.jourId),
            horaireId: Number(resolvedHoraireId),
            idHoraire: Number(resolvedHoraireId),
            id_horaire: Number(resolvedHoraireId),
          });
        }

        const index = nextSchedule.findIndex((item) => String(item.jourId) === String(day.jourId));
        if (index >= 0) {
          nextSchedule[index] = {
            ...nextSchedule[index],
            horaireId: String(resolvedHoraireId),
            hasAssociation: true,
          };
        }
      }

      if (planningToCreate.length) {
        try {
          await updateGaragePlanning(token, {
            idGarage: garageId,
            planning: planningToCreate,
          });
        } catch (planningError) {
          const message = planningError?.message || '';
          const isDuplicateAssociationError = /Associer|identity map|already present/i.test(message);

          if (!isDuplicateAssociationError) {
            throw planningError;
          }
        }
      }

      setWeekSchedule(nextSchedule);
      setInitialWeekSchedule(nextSchedule);
      setSettingsMessage('Horaires d ouverture mis a jour avec succes.');
      await loadGarageSettings();
    } catch (err) {
      setSettingsError(err.message || 'Impossible de modifier les horaires du garage.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleWeekDayChange = (jourId, field, value) => {
    setWeekSchedule((prev) =>
      prev.map((day) => (String(day.jourId) === String(jourId) ? { ...day, [field]: value } : day))
    );
  };

  const openGarageSettings = () => {
    setSettingsMessage('');
    setSettingsError('');
    setActiveTab('settings');
  };

 

  return (
    <div className="garage-dashboard">

      {/* Sidebar */}
      <aside className="garage-dashboard-sidebar">
        <div className="garage-dashboard-sidebar-header">
          <div className="garage-dashboard-logo">
            <div className="garage-dashboard-logo-icon">
              <Wrench size={24} />
            </div>
            <span className="garage-dashboard-logo-text">MecanoLib</span>
          </div>
        </div>
        <nav className="garage-dashboard-nav">
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={20} />
            <span>Rendez-vous</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <BarChart3 size={20} />
            <span>Agenda</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <Users size={20} />
            <span>Clients</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'prestations' ? 'active' : ''}`}
            onClick={() => setActiveTab('prestations')}
          >
            <Wrench size={20} />
            <span>Prestations</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={20} />
            <span>Historique</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
        </nav>

        <div className="garage-dashboard-sidebar-footer">
          <button className="garage-dashboard-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="garage-dashboard-main">
        {/* Header */}
        <header className="garage-dashboard-header">
          <div className="garage-dashboard-header-left">
            <div className="garage-dashboard-user">
              <div className="garage-dashboard-user-avatar">
                {connectedGarageName?.charAt(0) || ''}
              </div>
              <span className="garage-dashboard-user-name">
                {connectedGarageName || 'Garage'}
              </span>
            </div>
          </div>
          <div className="garage-dashboard-header-right">
            <div className="garage-dashboard-notifications">
              <button
                type="button"
                className="garage-dashboard-header-button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                aria-label="Voir les rendez-vous en attente"
                title="Rendez-vous en attente"
              >
                <Bell size={24} color="#ffffff" />
                <span className="garage-dashboard-header-badge">{pendingAppointments.length}</span>
              </button>

              {isNotificationsOpen && (
                <div className="garage-dashboard-notifications-panel">
                  <div className="garage-dashboard-notifications-header">
                    <strong>Rendez-vous en attente</strong>
                    <span>{pendingAppointments.length}</span>
                  </div>

                  <div className="garage-dashboard-notifications-list">
                    {pendingAppointments.length === 0 ? (
                      <div className="garage-dashboard-notifications-empty">
                        Aucun rendez-vous en attente de validation.
                      </div>
                    ) : (
                      pendingAppointments.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          className="garage-dashboard-notification-item"
                          onClick={() => handleNotificationClick(appointment)}
                        >
                          <div className="garage-dashboard-notification-top">
                            <span className="garage-dashboard-notification-client">
                              {(appointment.client?.firstName || appointment.client?.lastName)
                                ? `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim()
                                : 'Client inconnu'}
                            </span>
                            <span className="garage-dashboard-notification-status">À valider</span>
                          </div>
                          <span className="garage-dashboard-notification-service">
                            {appointment.serviceName || getServiceName(appointment.service)}
                          </span>
                          <span className="garage-dashboard-notification-meta">
                            {new Date(appointment.date).toLocaleDateString('fr-FR')} à {appointment.time}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="garage-dashboard-content">
          {activeTab === 'appointments' && (
            <>
              <Card className="garage-dashboard-quick-actions">
                <CardContent className="garage-dashboard-quick-action-card">
                  <div className="garage-dashboard-quick-action-text">
                    <h3>Informations du garage</h3>
                    <p>Besoin de mettre a jour vos coordonnees ou votre mot de passe de connexion ? Accedez rapidement aux actions de votre compte.</p>
                  </div>
                  <div className="garage-dashboard-quick-action-actions">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={openGarageSettings}
                      className="garage-dashboard-quick-action-button"
                    >
                      <Settings size={16} />
                      Modifier les informations du garage
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="garage-dashboard-stats">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`garage-dashboard-stat garage-dashboard-stat-${stat.color}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="garage-dashboard-stat-icon">
                      <stat.icon size={24} />
                    </div>
                    <div className="garage-dashboard-stat-content">
                      <span className="garage-dashboard-stat-value">{stat.value}</span>
                      <span className="garage-dashboard-stat-label">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <Card className="garage-dashboard-filters">
                <CardContent className="garage-dashboard-filters-content">
                  <div className="garage-dashboard-search">
                    <Search size={18} className="garage-dashboard-search-icon" />
                    <input
                      type="text"
                      placeholder="Rechercher un RDV, client, immatriculation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="garage-dashboard-search-input"
                    />
                  </div>
                  
                  <div className="garage-dashboard-filter-group">
                    <Filter size={18} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="garage-dashboard-filter-select"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="reserved">Réservés</option>
                      <option value="pending">En attente (Pending)</option>
                      <option value="confirmed">Confirmés (Confirmed)</option>
                      <option value="completed">Terminés</option>
                      <option value="cancelled_client">Annulés client</option>
                      <option value="cancelled_garage">Annulés garage</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments Table */}
              <Card>
                <CardContent className="garage-dashboard-table-container">
                  <table className="garage-dashboard-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Véhicule</th>
                        <th>Prestation</th>
                        <th>Date & Heure</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((appointment) => (
                        <tr
                          id={`garage-appointment-${appointment.id}`}
                          key={appointment.id}
                          className={String(highlightedAppointmentId) === String(appointment.id) ? 'garage-dashboard-table-row-active' : ''}
                        >
                          <td>
                            <div className="garage-dashboard-table-client">
                              <span className="garage-dashboard-table-name">
                                {(appointment.client?.firstName || appointment.client?.lastName) 
                                  ? `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim()
                                  : 'Client inconnu'}
                              </span>
                              {appointment.client?.email && (
                                <span className="garage-dashboard-table-email">
                                  {appointment.client.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="garage-dashboard-table-vehicle">
                              <span className="garage-dashboard-table-plate">
                                {appointment.vehicle?.plate || '-'}
                              </span>
                              <span className="garage-dashboard-table-car">
                                {typeof appointment.vehicle?.brand === 'string' ? appointment.vehicle.brand : ''} {typeof appointment.vehicle?.model === 'string' ? appointment.vehicle.model : ''}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="garage-dashboard-table-service">
                              {appointment.serviceName || getServiceName(appointment.service)}
                            </span>
                          </td>
                          <td>
                            <div className="garage-dashboard-table-datetime">
                              <span>
                                {new Date(appointment.date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="garage-dashboard-table-time">
                                {appointment.time}
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={appointment.status} />
                          </td>
                          <td>
                            <div className="garage-dashboard-table-actions">
                              {['pending', 'reserved'].includes(appointment.status) && (
                                <>
                                  <button
                                    className="garage-dashboard-table-action garage-dashboard-table-action-confirm"
                                    onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                    title="Confirmer"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                  <button
                                    className="garage-dashboard-table-action garage-dashboard-table-action-refuse"
                                    onClick={() => handleStatusChange(appointment.id, 'refused')}
                                    title="Refuser"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              <button
                                className="garage-dashboard-table-action"
                                onClick={() => handleViewDetail(appointment)}
                                title="Voir détails"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredAppointments.length === 0 && (
                    <div className="garage-dashboard-empty">
                      <Calendar size={48} />
                      <p>Aucun rendez-vous trouvé</p>
                      <small>
                        {garageAppointments.length === 0 
                          ? 'Aucun rendez-vous dans ce garage.' 
                          : `${garageAppointments.length} RDV total - vérifiez les filtres.`}
                      </small>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'calendar' && (
            <Card>
              <CardContent className="garage-dashboard-calendar">
                <div className="garage-dashboard-calendar-header">
                  <button 
                    className="garage-dashboard-calendar-nav"
                    onClick={() => navigateDate(-7)}
                    title="Semaine précédente"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="garage-dashboard-calendar-title-wrapper">
                    <h3 className="garage-dashboard-calendar-title">
                      Agenda Hebdomadaire
                    </h3>
                    <span className="garage-dashboard-calendar-subtitle">
                      Créneaux de 30 minutes
                    </span>
                  </div>
                  <button 
                    className="garage-dashboard-calendar-nav"
                    onClick={() => navigateDate(7)}
                    title="Semaine suivante"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="garage-dashboard-calendar-legend">
                  <span className="garage-dashboard-calendar-chip reserved">
                    <span className="garage-calendar-dot" style={{background: '#3b82f6'}}></span>
                    Créneau réservé
                  </span>
                  <span className="garage-dashboard-calendar-chip free">
                    <span className="garage-calendar-dot" style={{background: '#22c55e'}}></span>
                    Créneau disponible
                  </span>
                </div>
                <div className="garage-dashboard-calendar-week">
                  {weekCalendarDays.map((day) => (
                    <div key={day.isoDate} className="garage-dashboard-calendar-day">
                      <div className="garage-dashboard-calendar-day-header">
                        <strong>{day.label}</strong>
                        <span>{day.slots.filter((slot) => slot.appointment).length} réservé(s)</span>
                      </div>

                      <div className="garage-dashboard-calendar-grid">
                        {day.slots.length === 0 ? (
                          <div className="garage-dashboard-calendar-empty-day">Garage fermé</div>
                        ) : day.slots.map((slot) => (
                          <div
                            key={`${day.isoDate}-${slot.time}`}
                            className={`garage-dashboard-calendar-slot ${
                              slot.appointment ? 'has-appointment' : 'is-free'
                            }`}
                          >
                            <span className="garage-dashboard-calendar-time">{slot.time}</span>
                            <div className="garage-dashboard-calendar-appointment">
                              {slot.appointment ? (
                                <span className="garage-calendar-apt-reserved-text">Réservé</span>
                              ) : (
                                <>
                                  <span className="garage-calendar-apt-service">Disponible</span>
                                  <span className="garage-calendar-apt-client">Créneau libre</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card>
              <CardContent className="garage-dashboard-clients">
                <div className="garage-dashboard-clients-header">
                  <h3>Liste des clients</h3>
                  <Button variant="outline" size="sm">
                    <Plus size={16} />
                    Ajouter un client
                  </Button>
                </div>
                
                <div className="garage-dashboard-clients-list">
                  {Array.from(new Map(garageAppointments.map((a) => [a.client.email || a.id, a])).values())
                    .map((apt) => (
                      <div key={apt.client.email} className="garage-dashboard-client">
                        <div className="garage-dashboard-client-avatar">
                          {apt.client.firstName.charAt(0)}{apt.client.lastName.charAt(0)}
                        </div>
                        <div className="garage-dashboard-client-info">
                          <span className="garage-dashboard-client-name">
                            {apt.client.firstName} {apt.client.lastName}
                          </span>
                          <span className="garage-dashboard-client-email">
                            {apt.client.email}
                          </span>
                        </div>
                        <div className="garage-dashboard-client-stats">
                          <span>
                            {garageAppointments.filter((a) => (apt.client.email ? a.client.email === apt.client.email : a.id === apt.id)).length} RDV
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'prestations' && (
            <Card>
              <CardContent>
                <PrestationsManager token={token} garageId={garageId} />
              </CardContent>
            </Card>
          )}
          {activeTab === 'history' && (
            <Card>
              <CardContent className="garage-dashboard-history">
                <div className="garage-dashboard-history-header">
                  <h3>Historique des interventions</h3>
                  <p>Retrouvez l'historique des interventions terminées sur les véhicules.</p>
                </div>
                <div className="garage-dashboard-history-content">
                  {(() => {
                    // Filtrer les RDV terminés (completed) pour l'historique
                    const completedAppointments = garageAppointments.filter((apt) => {
                      const status = String(apt?.status || '').toLowerCase();
                      return status === 'completed' || status === 'termine' || status === 'terminé' || status === '3';
                    }).sort((a, b) => new Date(`${b?.date || ''}T${b?.time || '00:00'}`).getTime() - new Date(`${a?.date || ''}T${a?.time || '00:00'}`).getTime());

                    if (completedAppointments.length === 0) {
                      return (
                        <div className="garage-dashboard-empty">
                          <History size={48} />
                          <p>Aucun historique d'intervention</p>
                          <small>Les interventions terminées apparaîtront ici. Changez le statut d'un RDV à "Terminé" pour l'ajouter à l'historique.</small>
                        </div>
                      );
                    }

                    return (
                      <div className="garage-dashboard-history-list">
                        {completedAppointments.map((apt) => (
                          <div key={apt.id} className="garage-dashboard-history-item">
                            <div className="garage-dashboard-history-date">
                              <strong>{new Date(apt.date).toLocaleDateString('fr-FR')}</strong>
                              <span>{apt.time}</span>
                            </div>
                            <div className="garage-dashboard-history-details">
                              <p className="garage-dashboard-history-client">
                                <strong>Client:</strong> {(apt.client?.firstName || apt.client?.lastName) ? `${apt.client.firstName} ${apt.client.lastName}`.trim() : 'Client inconnu'}
                              </p>
                              <p className="garage-dashboard-history-vehicle">
                                <strong>Véhicule:</strong> {apt.vehicle?.plate || '-'} {apt.vehicle?.brand} {apt.vehicle?.model}
                              </p>
                              <p className="garage-dashboard-history-service">
                                <strong>Prestation:</strong> {apt.serviceName || getServiceName(apt.service)}
                              </p>
                              {apt.notes && (
                                <p className="garage-dashboard-history-notes">
                                  <strong>Notes:</strong> {apt.notes}
                                </p>
                              )}
                              <small className="garage-dashboard-history-rdv">
                                RDV #{apt.backendId || apt.id}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
          {activeTab === 'settings' && (
            <div className="garage-dashboard-settings">
              {settingsError && <div className="garage-dashboard-settings-error">{settingsError}</div>}
              {settingsMessage && <div className="garage-dashboard-settings-note">{settingsMessage}</div>}

              <Card>
                <CardContent className="garage-dashboard-setting">
                  <div className="garage-dashboard-setting-header">
                    <h3>Informations du garage</h3>
                    <Button variant="outline" size="sm" onClick={handleSaveGarageInfo} disabled={settingsLoading || settingsSaving}>
                      {settingsSaving ? 'Modification...' : 'Modifier'}
                    </Button>
                  </div>
                  <div className="garage-dashboard-setting-form">
                    <div className="garage-dashboard-setting-field">
                      <label className="garage-dashboard-setting-label">Nom du garage</label>
                      <input
                        type="text"
                        name="nomGarage"
                        className="garage-dashboard-setting-input"
                        value={garageForm.nomGarage}
                        onChange={handleGarageFieldChange}
                      />
                    </div>
                    <div className="garage-dashboard-setting-field">
                      <label className="garage-dashboard-setting-label">Email</label>
                      <input
                        type="email"
                        name="emailGarage"
                        className="garage-dashboard-setting-input"
                        value={garageForm.emailGarage}
                        onChange={handleGarageFieldChange}
                      />
                    </div>
                    <div className="garage-dashboard-setting-field">
                      <label className="garage-dashboard-setting-label">Telephone</label>
                      <input
                        type="text"
                        name="telephoneGarage"
                        className="garage-dashboard-setting-input"
                        value={garageForm.telephoneGarage}
                        onChange={handleGarageFieldChange}
                      />
                    </div>
                    <div className="garage-dashboard-setting-field garage-dashboard-setting-field-full">
                      <label className="garage-dashboard-setting-label">Ville</label>
                      <input
                        type="text"
                        name="ville"
                        className="garage-dashboard-setting-input"
                        value={garageForm.ville}
                        onChange={handleGarageFieldChange}
                        onFocus={() => garageForm.ville && searchFrenchCities(garageForm.ville)}
                        autoComplete="off"
                        placeholder="Commencez a taper la ville"
                      />
                      {cityLoading && <span className="garage-dashboard-setting-hint">Recherche des villes...</span>}
                      {citySuggestions.length > 0 && (
                        <div className="garage-dashboard-autocomplete-list">
                          {citySuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.city}-${suggestion.postcode}-${suggestion.codeInsee}`}
                              type="button"
                              className="garage-dashboard-autocomplete-item"
                              onClick={() => selectCitySuggestion(suggestion)}
                            >
                              <span>{suggestion.label}</span>
                              <small>Code postal: {suggestion.postcode || '-'} • INSEE: {suggestion.codeInsee || '-'}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="garage-dashboard-setting-field">
                      <label className="garage-dashboard-setting-label">Code postal</label>
                      <input
                        type="text"
                        name="postalCode"
                        className="garage-dashboard-setting-input"
                        value={garageForm.postalCode}
                        onChange={handleGarageFieldChange}
                        placeholder="Rempli automatiquement via la ville"
                      />
                    </div>
                    <div className="garage-dashboard-setting-field garage-dashboard-setting-field-full">
                      <label className="garage-dashboard-setting-label">Adresse</label>
                      <input
                        type="text"
                        name="adresseGarage"
                        className="garage-dashboard-setting-input"
                        value={garageForm.adresseGarage}
                        onChange={handleGarageFieldChange}
                        onFocus={() => garageForm.adresseGarage && searchFrenchAddresses(garageForm.adresseGarage, garageForm.ville, garageForm.postalCode)}
                        autoComplete="off"
                        placeholder="Commencez a taper l adresse"
                      />
                      {addressLoading && <span className="garage-dashboard-setting-hint">Recherche des adresses...</span>}
                      {addressSuggestions.length > 0 && (
                        <div className="garage-dashboard-autocomplete-list">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.address}-${index}`}
                              type="button"
                              className="garage-dashboard-autocomplete-item"
                              onClick={() => selectAddressSuggestion(suggestion)}
                            >
                              <span>{suggestion.address}</span>
                              <small>{suggestion.city || '-'} • {suggestion.postcode || '-'}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="garage-dashboard-setting">
                  <div className="garage-dashboard-setting-header">
                    <h3>Securite du compte</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleSavePassword} disabled={settingsSaving}>
                      {settingsSaving ? 'Modification...' : 'Mettre a jour'}
                    </Button>
                  </div>
                  <div className="garage-dashboard-setting-form">
                    <div className="garage-dashboard-2fa-section">
                      <div className="garage-dashboard-2fa-header">
                        <span className="garage-dashboard-setting-label">Authentification a deux facteurs (2FA)</span>
                        <span className={`garage-dashboard-2fa-status ${is2FAActivated ? 'active' : 'inactive'}`}>
                          {is2FAActivated ? 'Activee' : 'Desactivee'}
                        </span>
                      </div>
                      <div className="garage-dashboard-2fa-actions">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={activer2FA}
                          disabled={is2FAActivated || settingsSaving}
                        >
                          {is2FAActivated ? '2FA deja activee' : 'Activer 2FA'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={desactiver2FA}
                          disabled={!is2FAActivated || settingsSaving}
                        >
                          Desactiver 2FA
                        </Button>
                      </div>
                      {messageActivation && (
                        <p className="garage-dashboard-setting-hint" style={{ color: '#facc15' }}>{messageActivation}</p>
                      )}
                      {is2FARequired && (
                        <form onSubmit={handle2FASubmit} className="garage-dashboard-2fa-form">
                          <input
                            type="text"
                            className="garage-dashboard-setting-input"
                            placeholder="Entrez le code 2FA"
                            value={code2FA}
                            onChange={(e) => setCode2FA(e.target.value)}
                            required
                          />
                          <Button type="submit" variant="primary" size="sm">
                            Valider 2FA
                          </Button>
                        </form>
                      )}
                      {messageValidation && (
                        <p className="garage-dashboard-setting-hint" style={{ color: is2FAActivated ? '#22c55e' : '#ef4444' }}>{messageValidation}</p>
                      )}
                    </div>

                    <hr className="garage-dashboard-2fa-divider" />

                    <div className="garage-dashboard-setting-field">
                      <label className="garage-dashboard-setting-label">Mot de passe actuel</label>
                      <input
                        type="password"
                        name="currentPassword"
                        className="garage-dashboard-setting-input"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordFieldChange}
                        autoComplete="current-password"
                      />
                    </div>
                    <div className="garage-dashboard-setting-field">
                      <label className="garage-dashboard-setting-label">Nouveau mot de passe</label>
                      <input
                        type="password"
                        name="newPassword"
                        className="garage-dashboard-setting-input"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFieldChange}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="garage-dashboard-setting-field garage-dashboard-setting-field-full">
                      <label className="garage-dashboard-setting-label">Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="garage-dashboard-setting-input"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFieldChange}
                        autoComplete="new-password"
                      />
                      <span className="garage-dashboard-setting-hint">
                        Le mot de passe doit contenir au minimum 6 caracteres.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="garage-dashboard-setting">
                  <div className="garage-dashboard-setting-header">
                    <h3>Horaires d'ouverture</h3>
                    <Button variant="outline" size="sm" onClick={handleSaveHoraires} disabled={settingsLoading || settingsSaving || !garageId}>
                      {settingsSaving ? 'Modification...' : 'Modifier'}
                    </Button>
                  </div>
                  <div className="garage-dashboard-week-schedule">
                    {(weekSchedule || []).map((day) => (
                      <div key={day.jourId} className="garage-dashboard-week-row">
                        <div className="garage-dashboard-week-day">
                          <span className="garage-dashboard-setting-value">{day.libJour}</span>
                          <select
                            className="garage-dashboard-week-mode"
                            value={day.mode}
                            onChange={(e) => handleWeekDayChange(day.jourId, 'mode', e.target.value)}
                          >
                            <option value="open">Ouvert (avec pause midi)</option>
                            <option value="closed">Ferme toute la journee</option>
                            <option value="closed_morning">Ferme le matin</option>
                            <option value="closed_afternoon">Ferme l apres-midi</option>
                          </select>
                        </div>

                        <div className="garage-dashboard-week-times">
                          <input
                            type="time"
                            className="garage-dashboard-setting-input"
                            value={day.hreOuvreMatin}
                            disabled={day.mode === 'closed' || day.mode === 'closed_morning'}
                            onChange={(e) => handleWeekDayChange(day.jourId, 'hreOuvreMatin', e.target.value)}
                          />
                          <input
                            type="time"
                            className="garage-dashboard-setting-input"
                            value={day.hreFermeMatin}
                            disabled={day.mode === 'closed' || day.mode === 'closed_morning'}
                            onChange={(e) => handleWeekDayChange(day.jourId, 'hreFermeMatin', e.target.value)}
                          />
                          <input
                            type="time"
                            className="garage-dashboard-setting-input"
                            value={day.hreOuvreSoir}
                            disabled={day.mode === 'closed' || day.mode === 'closed_afternoon'}
                            onChange={(e) => handleWeekDayChange(day.jourId, 'hreOuvreSoir', e.target.value)}
                          />
                          <input
                            type="time"
                            className="garage-dashboard-setting-input"
                            value={day.hreFermeSoir}
                            disabled={day.mode === 'closed' || day.mode === 'closed_afternoon'}
                            onChange={(e) => handleWeekDayChange(day.jourId, 'hreFermeSoir', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Détails du rendez-vous ${selectedAppointment?.id}`}
        size="lg"
        footer={
          ['pending', 'reserved'].includes(selectedAppointment?.status) && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'refused');
                  setIsDetailModalOpen(false);
                }}
              >
                <XCircle size={18} />
                Refuser
              </Button>
              <Button
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'confirmed');
                  setIsDetailModalOpen(false);
                }}
              >
                <CheckCircle size={18} />
                Confirmer
              </Button>
            </>
          )
        }
      >
        {selectedAppointment && (
          <div className="garage-dashboard-modal-content">
            <div className="garage-dashboard-modal-section">
              <h4>Client</h4>
              <p><strong>{selectedAppointment.client.firstName} {selectedAppointment.client.lastName}</strong></p>
              <p>{selectedAppointment.client.email}</p>
              <p>{selectedAppointment.client.phone}</p>
            </div>
            
            <div className="garage-dashboard-modal-section">
              <h4>Véhicule</h4>
              <p><strong>Immatriculation:</strong> {selectedAppointment.vehicle.plate}</p>
              {typeof selectedAppointment.vehicle.brand === 'string' && selectedAppointment.vehicle.brand && (
                <p><strong>Marque:</strong> {selectedAppointment.vehicle.brand}</p>
              )}
              {selectedAppointment.vehicle.model && (
                <p><strong>Modèle:</strong> {selectedAppointment.vehicle.model}</p>
              )}
            </div>
            
            <div className="garage-dashboard-modal-section">
              <h4>Rendez-vous</h4>
              <p><strong>Prestation:</strong> {selectedAppointment.serviceName || getServiceName(selectedAppointment.service)}</p>
              <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure:</strong> {selectedAppointment.time}</p>
              <p><strong>Statut:</strong> <StatusBadge status={selectedAppointment.status} /></p>
            </div>
            
            {selectedAppointment.notes && (
              <div className="garage-dashboard-modal-section">
                <h4>Notes</h4>
                <p>{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GarageDashboard;
