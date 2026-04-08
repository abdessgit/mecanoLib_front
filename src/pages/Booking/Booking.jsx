import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calendar, 
  Clock, 
  User, 
  Car, 
  FileText,
  Droplets,
  Circle,
  Cpu,
  Battery,
  Shield,
  Wrench,
  ArrowRight,
  MapPin,
  Phone,
  Globe,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, TimeSlot, Card, CardContent } from '../../components';
import { serviceCategories as fallbackServiceCategories, services as fallbackServices } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import {
  createRendezVous,
  getAssociations,
  getCategories,
  getFrenchCitySuggestions,
  getGarageRendezVous,
  getGaragesByVille,
  getModeles,
  getPrestationsByCategorie,
  getStatusRendezVous,
  getStoredAuth,
  getVehiculesClient,
  getVilles,
  isJwtExpired,
  isValidEmailFormat,
  normalizeClientProfile,
} from '../../services/api';
import './Booking.css';

const categoryIcons = [Circle, Shield, Cpu, Droplets, Battery, Wrench];
const BOOKING_CATALOG_STORAGE_KEY = 'mecanolib_booking_catalog';
const BOOKING_DRAFT_STORAGE_KEY = 'mecanolib_booking_draft';

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  notes: '',
};

const extractBookingVehicleModeleId = (item = {}) => {
  const marqueSource = typeof item?.marque === 'object' && item?.marque !== null ? item.marque : {};
  const modeleSource = typeof item?.modele === 'object' && item?.modele !== null ? item.modele : {};
  const modeleFromList =
    (Array.isArray(item?.modeles) ? item.modeles[0] : null) ||
    (Array.isArray(item?.modele) ? item.modele[0] : null) ||
    (Array.isArray(marqueSource?.modeles) ? marqueSource.modeles[0] : null) ||
    (Array.isArray(marqueSource?.modele) ? marqueSource.modele[0] : null) ||
    {};

  return String(
    item?.id_modele ??
    item?.idModele ??
    item?.idmodele ??
    (typeof item?.modele === 'number' ? item.modele : undefined) ??
    modeleSource?.id_modele ??
    modeleSource?.idModele ??
    modeleSource?.idmodele ??
    modeleSource?.id ??
    modeleFromList?.id_modele ??
    modeleFromList?.idModele ??
    modeleFromList?.idmodele ??
    modeleFromList?.id ??
    marqueSource?.id_modele ??
    marqueSource?.idModele ??
    marqueSource?.idmodele ??
    (typeof marqueSource?.modele === 'number' ? marqueSource.modele : undefined) ??
    ''
  ).trim();
};

const normalizeBookingVehicle = (item = {}) => {
  const marqueSource = typeof item?.marque === 'object' && item?.marque !== null ? item.marque : {};
  const modeleSource = typeof item?.modele === 'object' && item?.modele !== null
    ? item.modele
    : (typeof marqueSource?.modele === 'object' && marqueSource?.modele !== null ? marqueSource.modele : {});
  const modeleFromList =
    (Array.isArray(item?.modeles) ? item.modeles[0] : null) ||
    (Array.isArray(item?.modele) ? item.modele[0] : null) ||
    (Array.isArray(marqueSource?.modeles) ? marqueSource.modeles[0] : null) ||
    (Array.isArray(marqueSource?.modele) ? marqueSource.modele[0] : null) ||
    {};

  return {
    id: String(item?.id_vehicule ?? item?.idVehicule ?? item?.id ?? ''),
    plate: item?.immatriculation || item?.imatriculationVehicule || item?.plaque_immatriculation || '',
    brand:
      item?.nom_marque ||
      item?.nomMarque ||
      marqueSource?.nom_marque ||
      marqueSource?.nomMarque ||
      marqueSource?.nom ||
      (typeof item?.marque === 'string' ? item.marque : '') ||
      '',
    model:
      item?.nom_modele ||
      item?.nomModele ||
      item?.nommodele ||
      modeleSource?.nom_modele ||
      modeleSource?.nomModele ||
      modeleSource?.nommodele ||
      modeleSource?.nom ||
      modeleFromList?.nom_modele ||
      modeleFromList?.nomModele ||
      modeleFromList?.nommodele ||
      modeleFromList?.nom ||
      (typeof marqueSource?.modele === 'string' ? marqueSource.modele : '') ||
      (typeof item?.modele === 'string' ? item.modele : '') ||
      '',
    modelId: extractBookingVehicleModeleId(item),
    year: item?.annee || item?.annee_vehicule || item?.anneeVehicule || '',
  };
};

const loadStoredBookingDraft = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatBookingSubmitError = (error) => {
  const message = String(error?.message || '').trim();

  if (/statut\s*["']?en attente["']?\s*introuvable/i.test(message)) {
    return 'Votre demande de rendez-vous ne peut pas être finalisée pour le moment. Merci de réessayer dans quelques instants.';
  }

  return message || 'Impossible de réserver ce créneau.';
};

const saveStoredBookingDraft = (draft) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignorer les erreurs de stockage navigateur
  }
};

const clearStoredBookingDraft = () => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(BOOKING_DRAFT_STORAGE_KEY);
  } catch {
    // ignorer les erreurs de stockage navigateur
  }
};

const attachCategoryIcons = (catalog = []) => (
  (Array.isArray(catalog) ? catalog : []).map((category, index) => ({
    ...category,
    icon: categoryIcons[index % categoryIcons.length] || Wrench,
    prestations: Array.isArray(category?.prestations) ? category.prestations : [],
  }))
);

const loadStoredBookingCatalog = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(BOOKING_CATALOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? attachCategoryIcons(parsed) : null;
  } catch {
    return null;
  }
};

const saveStoredBookingCatalog = (catalog) => {
  if (typeof window === 'undefined') return;

  try {
    const serializableCatalog = (Array.isArray(catalog) ? catalog : []).map((category) => {
      const nextCategory = { ...category };
      delete nextCategory.icon;
      return nextCategory;
    });
    window.localStorage.setItem(BOOKING_CATALOG_STORAGE_KEY, JSON.stringify(serializableCatalog));
  } catch {
    // ignorer les erreurs de cache navigateur
  }
};

const buildFallbackBookingCatalog = () => {
  const categories = Array.isArray(fallbackServiceCategories) ? fallbackServiceCategories : [];
  const prestations = Array.isArray(fallbackServices) ? fallbackServices : [];

  return attachCategoryIcons(
    categories
      .filter((category) => String(category?.id || '') !== 'all')
      .map((category, index) => ({
        id: String(category?.id ?? `fallback-${index + 1}`),
        name: category?.name || `Categorie ${index + 1}`,
        prestations: prestations
          .filter((service) => String(service?.category || '') === String(category?.id || ''))
          .map((service, serviceIndex) => ({
            id: String(service?.id ?? `${category?.id || 'cat'}-${serviceIndex + 1}`),
            name: service?.name || `Prestation ${serviceIndex + 1}`,
          })),
      }))
      .filter((category) => Array.isArray(category.prestations) && category.prestations.length > 0)
  );
};

const extractCatalogItems = (payload, preferredKeys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of preferredKeys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.value)) return payload.value;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

const normalizeCatalogCategory = (item, index) => ({
  id: String(item?.id_categorie ?? item?.idCategorie ?? item?.id ?? `${index + 1}`),
  name: item?.nom_categorie || item?.nomCategorie || item?.nom || `Categorie ${index + 1}`,
  icon: categoryIcons[index % categoryIcons.length],
  prestations: [],
});

const normalizeCatalogPrestation = (item, index) => ({
  id: String(item?.id_prestation ?? item?.idPrestation ?? item?.id ?? index + 1),
  name:
    item?.nom_prestation ||
    item?.nomprestation ||
    item?.nomPrestation ||
    item?.nom ||
    `Prestation ${index + 1}`,
});

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createAppointment, updateBookingStep, appointments = [] } = useApp();
  const { token: authToken, clientId: authClientId, profile: authProfile } = getStoredAuth();
  const hasClientAuth = Boolean(authToken) && !isJwtExpired(authToken);
  const normalizedClientProfile = useMemo(
    () => normalizeClientProfile(authProfile || {}),
    [authProfile],
  );
  const initialCatalog = useMemo(() => {
    const storedCatalog = loadStoredBookingCatalog();
    return Array.isArray(storedCatalog) && storedCatalog.length > 0
      ? storedCatalog
      : buildFallbackBookingCatalog();
  }, []);
  
  const [step, setStep] = useState(1);
  const [bookingCategories, setBookingCategories] = useState(() => initialCatalog);
  const [catalogLoading, setCatalogLoading] = useState(() => initialCatalog.length === 0);
  const [catalogError, setCatalogError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [, setHoveredCategory] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [clientVehicles, setClientVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [statusRdvList, setStatusRdvList] = useState([]);
  const [statusRdvLoading, setStatusRdvLoading] = useState(false);

  // --- Garage step state ---
  const [city, setCity] = useState('');
  const [selectedVilleId, setSelectedVilleId] = useState('');
  const [villes, setVilles] = useState([]);
  const [villesLoading, setVillesLoading] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCityMeta, setSelectedCityMeta] = useState({ postcode: '', codeInsee: '' });
  const [garages, setGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [garageLoading, setGarageLoading] = useState(false);
  const [garageError, setGarageError] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [garageAssociations, setGarageAssociations] = useState([]);
  const [remoteAppointments, setRemoteAppointments] = useState([]);
  const [prestationsLoading, setPrestationsLoading] = useState(false);
  const catalogInteractionLockedRef = useRef(false);
  const lastLoadedCategoryRef = useRef('');
  const restoreAppliedRef = useRef(false);

  // Charger les statuts des rendez-vous
  useEffect(() => {
    const loadStatusRdv = async () => {
      if (!hasClientAuth || !authToken) return;
      setStatusRdvLoading(true);
      try {
        const statuses = await getStatusRendezVous(authToken);
        setStatusRdvList(Array.isArray(statuses) ? statuses : []);
        console.log('✅ Statuts RDV chargés:', statuses);
      } catch (err) {
        console.error('❌ Erreur chargement statuts:', err);
        setStatusRdvList([]);
      } finally {
        setStatusRdvLoading(false);
      }
    };

    loadStatusRdv();
  }, [hasClientAuth, authToken]);

  useEffect(() => {
    const loadCatalog = async () => {
      if (!initialCatalog.length) {
        setCatalogLoading(true);
      }
      setCatalogError('');

      try {
        const categoriesResponse = await getCategories();
        const categories = attachCategoryIcons(
          extractCatalogItems(categoriesResponse, ['categories']).map(normalizeCatalogCategory)
        ).map((category) => {
          const cachedCategory = initialCatalog.find((item) => String(item.id) === String(category.id));
          return cachedCategory?.prestations?.length
            ? { ...category, prestations: cachedCategory.prestations }
            : category;
        });

        if (categories.length) {
          saveStoredBookingCatalog(categories);

          if (!catalogInteractionLockedRef.current) {
            setBookingCategories(categories);
            setSelectedCategory((current) => (categories.some((cat) => cat.id === current) ? current : String(categories[0].id)));
            setHoveredCategory((current) => (categories.some((cat) => cat.id === current) ? current : String(categories[0].id)));
          }
        } else if (!catalogInteractionLockedRef.current && initialCatalog.length > 0) {
          setBookingCategories(initialCatalog);
        }
      } catch (err) {
        if (!initialCatalog.length) {
          setCatalogError(err.message || 'Impossible de charger les categories et prestations.');
        } else {
          setBookingCategories(initialCatalog);
          setCatalogError('');
        }
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, [initialCatalog]);

  useEffect(() => {
    const loadVilles = async () => {
      setVillesLoading(true);
      try {
        const response = await getVilles();
        const items = (Array.isArray(response) ? response : []).map((item) => ({
          id: String(item?.id_ville ?? item?.idVille ?? item?.id ?? ''),
          name: item?.nom_ville || item?.nomVille || item?.nom || 'Ville',
          postalCode: item?.code_postal || item?.cp || '',
          codeInsee: item?.code_insee || item?.code_inssee || '',
        })).filter((item) => item.id);
        setVilles(items);
      } catch {
        setVilles([]);
      } finally {
        setVillesLoading(false);
      }
    };

    loadVilles();
  }, []);

  useEffect(() => {
    const loadClientVehicles = async () => {
      if (!hasClientAuth || !authClientId) {
        setClientVehicles([]);
        setSelectedVehicleId('');
        return;
      }

      setVehiclesLoading(true);
      try {
        const data = await getVehiculesClient(authToken, authClientId);
        let normalized = (Array.isArray(data) ? data : []).map(normalizeBookingVehicle).filter((item) => item.id);

        const missingModeleIds = Array.from(
          new Set(
            normalized
              .filter((item) => !item.model && item.modelId)
              .map((item) => String(item.modelId))
              .filter(Boolean)
          )
        );

        if (missingModeleIds.length > 0) {
          try {
            const modelesData = await getModeles();
            const modeleNamesById = new Map(
              (Array.isArray(modelesData) ? modelesData : []).map((modele) => [
                String(modele?.id_modele ?? modele?.idModele ?? modele?.idmodele ?? modele?.id ?? ''),
                modele?.nom_modele || modele?.nomModele || modele?.nommodele || modele?.nom || '',
              ])
            );

            normalized = normalized.map((item) => (
              !item.model && item.modelId && modeleNamesById.get(String(item.modelId))
                ? { ...item, model: modeleNamesById.get(String(item.modelId)) }
                : item
            ));
          } catch {
            // ignorer si le catalogue modeles n'est pas disponible
          }
        }

        setClientVehicles(normalized);
        setSelectedVehicleId((current) => (
          normalized.some((vehicle) => String(vehicle.id) === String(current)) ? current : ''
        ));
      } catch {
        setClientVehicles([]);
        setSelectedVehicleId('');
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadClientVehicles();
  }, [authClientId, authToken, hasClientAuth]);

  const selectedClientVehicle = useMemo(
    () => clientVehicles.find((vehicle) => String(vehicle.id) === String(selectedVehicleId)) || null,
    [clientVehicles, selectedVehicleId],
  );

  useEffect(() => {
    if (!selectedClientVehicle) {
      if (clientVehicles.length > 0) {
        setFormData((current) => ({
          ...current,
          plate: '',
          brand: '',
          model: '',
          year: '',
        }));
      }
      return;
    }

    setFormData((current) => ({
      ...current,
      plate: selectedClientVehicle.plate || current.plate,
      brand: selectedClientVehicle.brand || current.brand,
      model: selectedClientVehicle.model || current.model,
      year: selectedClientVehicle.year || current.year,
    }));
  }, [clientVehicles.length, selectedClientVehicle]);

  useEffect(() => {
    if (restoreAppliedRef.current) {
      return;
    }

    const draft = location.state?.restoreBooking || loadStoredBookingDraft();
    if (!draft || typeof draft !== 'object') {
      return;
    }

    restoreAppliedRef.current = true;

    if (draft.selectedCategory) {
      setSelectedCategory(String(draft.selectedCategory));
      setHoveredCategory(String(draft.selectedCategory));
    }

    if (draft.selectedService) setSelectedService(draft.selectedService);
    if (draft.selectedGarage) setSelectedGarage(draft.selectedGarage);
    if (draft.selectedDate) setSelectedDate(draft.selectedDate);
    if (draft.selectedTime) setSelectedTime(draft.selectedTime);
    if (draft.selectedVehicleId) setSelectedVehicleId(String(draft.selectedVehicleId));
    if (draft.city) setCity(draft.city);
    if (draft.selectedVilleId) setSelectedVilleId(String(draft.selectedVilleId));
    if (draft.selectedCityMeta) {
      setSelectedCityMeta({
        postcode: draft.selectedCityMeta.postcode || '',
        codeInsee: draft.selectedCityMeta.codeInsee || '',
      });
    }
    if (draft.formData) {
      setFormData((current) => ({ ...current, ...draft.formData }));
    }
    if (draft.step) {
      setStep(Math.min(4, Math.max(1, Number(draft.step) || 1)));
    }

    clearStoredBookingDraft();
  }, [location.state]);

  useEffect(() => {
    if (!hasClientAuth) {
      return;
    }

    setFormData((current) => ({
      ...current,
      firstName: current.firstName || normalizedClientProfile?.prenom || '',
      lastName: current.lastName || normalizedClientProfile?.nom || '',
      email: current.email || normalizedClientProfile?.email || '',
      phone: current.phone || normalizedClientProfile?.telephone || '',
    }));
  }, [hasClientAuth, normalizedClientProfile]);

  const activeCategory = (bookingCategories || []).find(
    (cat) => String(cat.id) === String(selectedCategory)
  ) || null;

  // Générer les dates des 14 prochains jours
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        fullLabel: date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        }),
      });
    }
    return dates;
  };

  const availableDates = generateDates();

  const normalizeText = (value = '') =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const findMatchingVilleId = ({ cityName, postcode = '', codeInsee = '' }) => {
    const matchedVille = villes.find((ville) => {
      const sameName = normalizeText(ville?.name) === normalizeText(cityName);
      const samePostcode = String(ville?.postalCode || '') === String(postcode || '');
      const sameInsee = String(ville?.codeInsee || '') === String(codeInsee || '');
      return sameInsee || (sameName && samePostcode) || sameName;
    });

    return matchedVille?.id ? String(matchedVille.id) : '';
  };

  const handleCityInputChange = async (value) => {
    setCity(value);
    setSelectedVilleId('');
    setSelectedCityMeta({ postcode: '', codeInsee: '' });
    setGarageError('');

    if (!value.trim()) {
      setCitySuggestions([]);
      return;
    }

    setCityLoading(true);
    try {
      const suggestions = await getFrenchCitySuggestions(value);
      setCitySuggestions(suggestions);
    } catch {
      setCitySuggestions([]);
    } finally {
      setCityLoading(false);
    }
  };

  const selectCitySuggestion = (suggestion) => {
    const matchedVilleId = findMatchingVilleId({
      cityName: suggestion.city,
      postcode: suggestion.postcode,
      codeInsee: suggestion.codeInsee,
    });

    setCity(suggestion.city);
    setSelectedVilleId(matchedVilleId);
    setSelectedCityMeta({
      postcode: suggestion.postcode || '',
      codeInsee: suggestion.codeInsee || '',
    });
    setCitySuggestions([]);
    setGarageError('');
  };

  const normalizeDay = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const isClosedPair = (start, end) => String(start || '') === '00:00' && String(end || '') === '00:00';

  const buildSlotsBetween = (start, end) => {
    const toMinutes = (time) => {
      const [h, m] = String(time || '00:00').split(':').map(Number);
      return h * 60 + m;
    };

    const fromMinutes = (minutes) => {
      const h = String(Math.floor(minutes / 60)).padStart(2, '0');
      const m = String(minutes % 60).padStart(2, '0');
      return `${h}:${m}`;
    };

    const startMin = toMinutes(start);
    const endMin = toMinutes(end);
    if (endMin <= startMin) return [];

    const slots = [];
    for (let t = startMin; t + 30 <= endMin; t += 30) {
      slots.push(fromMinutes(t));
    }
    return slots;
  };

  const formatDateTimeForApi = (date, time, extraMinutes = 0) => {
    if (!date || !time) {
      throw new Error('Date ou heure manquante');
    }
    
    // Vérifier que date et time sont valides
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    
    if (!dateRegex.test(date)) {
      throw new Error(`Format de date invalide: ${date}`);
    }
    if (!timeRegex.test(time)) {
      throw new Error(`Format d'heure invalide: ${time}`);
    }
    
    const base = new Date(`${date}T${time}:00`);
    
    if (Number.isNaN(base.getTime())) {
      throw new Error(`Date invalide: ${date}T${time}:00`);
    }
    
    base.setMinutes(base.getMinutes() + extraMinutes);

    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    const hh = String(base.getHours()).padStart(2, '0');
    const min = String(base.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
  };

  useEffect(() => {
    const loadGarageSchedule = async () => {
      if (!selectedGarage?.id) {
        setGarageAssociations([]);
        setRemoteAppointments([]);
        setScheduleError('');
        return;
      }

      setScheduleLoading(true);
      setScheduleError('');
      setGarageAssociations([]);
      setRemoteAppointments([]);

      try {
        const [associations, rdvs] = await Promise.all([
          getAssociations(),
          getGarageRendezVous(authToken, selectedGarage.id).catch(() => []),
        ]);

        const filtered = (Array.isArray(associations) ? associations : []).filter(
          (item) => String(item?.id_garage ?? item?.idGarage ?? '') === String(selectedGarage.id)
        );

        const normalizedRdvs = (Array.isArray(rdvs) ? rdvs : []).map((item) => {
          const start = item?.date_debut ? new Date(String(item.date_debut).replace(' ', 'T')) : null;
          return {
            id: String(item?.id_rdv ?? ''),
            date: start && !Number.isNaN(start.getTime()) ? start.toISOString().split('T')[0] : '',
            time: start && !Number.isNaN(start.getTime()) ? start.toTimeString().slice(0, 5) : '',
            statusId: Number(item?.id_status_rdv || 0),
          };
        }).filter((item) => item.date && item.time);

        setGarageAssociations(filtered);
        setRemoteAppointments(normalizedRdvs);
      } catch (err) {
        setScheduleError(err.message || 'Impossible de charger les horaires du garage.');
      } finally {
        setScheduleLoading(false);
      }
    };

    loadGarageSchedule();
  }, [selectedGarage?.id, authToken]);

  const currentTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedGarage?.id) return [];

    const dayName = normalizeDay(
      new Date(`${selectedDate}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long' })
    );

    const daySchedule = garageAssociations.find(
      (item) => normalizeDay(item?.lib_jour ?? item?.libJour) === dayName
    );

    if (!daySchedule) return [];

    const matinStart = daySchedule?.hre_ouvre_matin || daySchedule?.hreOuvreMatin;
    const matinEnd = daySchedule?.hre_ferme_matin || daySchedule?.hreFermeMatin;
    const soirStart = daySchedule?.hre_ouvre_soir || daySchedule?.hreOuvreSoir;
    const soirEnd = daySchedule?.hre_ferme_soir || daySchedule?.hreFermeSoir;

    const morningSlots = isClosedPair(matinStart, matinEnd) ? [] : buildSlotsBetween(matinStart, matinEnd);
    const eveningSlots = isClosedPair(soirStart, soirEnd) ? [] : buildSlotsBetween(soirStart, soirEnd);

    const bookedTimes = new Set(
      [...remoteAppointments, ...(Array.isArray(appointments) ? appointments : [])]
        .filter((appointment) => {
          const status = String(appointment?.status || appointment?.statusId || '').toLowerCase();
          return !['cancelled_client', 'cancelled_garage', 'refused', '4', '5'].includes(status);
        })
        .filter((appointment) => {
          const appointmentGarageId = String(appointment?.garageId ?? appointment?.garage?.id ?? '');
          const appointmentGarageName = normalizeText(appointment?.garage?.name || appointment?.garageName || '');
          const sameGarage = (appointmentGarageId && appointmentGarageId === String(selectedGarage.id))
            || (!appointmentGarageId && appointmentGarageName && appointmentGarageName === normalizeText(selectedGarage.name));

          return sameGarage && appointment?.date === selectedDate;
        })
        .map((appointment) => String(appointment?.time || ''))
        .filter(Boolean)
    );

    return [...morningSlots, ...eveningSlots].map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));
  }, [selectedDate, selectedGarage?.id, selectedGarage?.name, garageAssociations, remoteAppointments, appointments]);

  const handleCategorySelect = (categoryId) => {
    catalogInteractionLockedRef.current = true;
    setSelectedCategory(categoryId);
    setHoveredCategory(categoryId);
    setSelectedService(null);
    setSubmitError('');
  };

  useEffect(() => {
    if (!bookingCategories.length) {
      setSelectedCategory('');
      return;
    }

    setSelectedCategory((current) => (
      bookingCategories.some((cat) => String(cat.id) === String(current))
        ? current
        : String(bookingCategories[0].id)
    ));
  }, [bookingCategories]);

  useEffect(() => {
    if (!selectedCategory) return;

    const normalizedSelectedCategory = String(selectedCategory);
    const selectedCatalogCategory = bookingCategories.find((cat) => String(cat.id) === normalizedSelectedCategory);

    if (lastLoadedCategoryRef.current === normalizedSelectedCategory && Array.isArray(selectedCatalogCategory?.prestations)) {
      return;
    }

    let isMounted = true;

    const loadPrestationsForCategory = async () => {
      lastLoadedCategoryRef.current = normalizedSelectedCategory;
      setPrestationsLoading(true);

      try {
        const prestationsResponse = await getPrestationsByCategorie(selectedCategory);
        const prestations = extractCatalogItems(prestationsResponse, ['prestations']).map(normalizeCatalogPrestation);

        if (!isMounted) return;

        setBookingCategories((current) => current.map((category) => (
          String(category.id) === String(selectedCategory)
            ? { ...category, prestations }
            : category
        )));

        setSelectedService((current) => {
          if (!current || String(current.category) !== String(selectedCategory)) {
            return current;
          }

          const stillExists = prestations.some((service, index) => {
            const serviceId = String(service?.id || `${selectedCategory}-${index}`);
            return serviceId === String(current.id);
          });

          return stillExists ? current : null;
        });
      } catch {
        if (!isMounted) return;

        setBookingCategories((current) => current.map((category) => (
          String(category.id) === String(selectedCategory)
            ? { ...category, prestations: Array.isArray(selectedCatalogCategory?.prestations) ? selectedCatalogCategory.prestations : [] }
            : category
        )));
      } finally {
        if (isMounted) {
          setPrestationsLoading(false);
        }
      }
    };

    loadPrestationsForCategory();

    return () => {
      isMounted = false;
    };
  }, [bookingCategories, selectedCategory]);

  const buildSelectedService = (service, categoryId, index) => ({
    id: String(service?.id || `${categoryId}-${index}`),
    name: service?.name || `Prestation ${index + 1}`,
    duration: Number(service?.duration || 30),
    category: categoryId,
  });

  const handleServiceSelect = (service, categoryId, index) => {
    const nextSelectedService = buildSelectedService(service, categoryId, index);

    catalogInteractionLockedRef.current = true;
    setSelectedCategory(categoryId);
    setHoveredCategory(categoryId);
    setSelectedService(nextSelectedService);
    setSubmitError('');
  };

  const handlePrestationDropdownChange = (serviceId) => {
    if (!serviceId || !activeCategory) {
      setSelectedService(null);
      return;
    }

    const prestations = Array.isArray(activeCategory.prestations) ? activeCategory.prestations : [];
    const serviceIndex = prestations.findIndex((service, index) => {
      const normalizedId = String(service?.id || `${activeCategory.id}-${index}`);
      return normalizedId === String(serviceId);
    });

    if (serviceIndex >= 0) {
      handleServiceSelect(prestations[serviceIndex], activeCategory.id, serviceIndex);
    }
  };

  const confirmSelectedService = (serviceToConfirm = selectedService) => {
    if (!serviceToConfirm) {
      setSubmitError('Choisissez une prestation pour continuer.');
      return;
    }

    catalogInteractionLockedRef.current = true;
    setSelectedService(serviceToConfirm);
    setSubmitError('');
    updateBookingStep(2, { service: serviceToConfirm });
    setStep(2);

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  // --- API backend : recherche garages par ville ---
  const searchGarages = async () => {
    if (!city.trim()) return;

    const resolvedVilleId = selectedVilleId || findMatchingVilleId({ cityName: city });
    if (!resolvedVilleId) {
      setGarageError('Choisissez une ville via les suggestions officielles.');
      return;
    }

    setGarageLoading(true);
    setGarageError('');
    setGarages([]);
    setSelectedGarage(null);
    try {
      const data = await getGaragesByVille(resolvedVilleId);
      const results = (Array.isArray(data?.garages) ? data.garages : []).map((item) => ({
        id: item?.id_garage ?? item?.idGarage ?? item?.id,
        name: item?.nom_garage || item?.nomGarage || item?.nom || 'Garage sans nom',
        address: item?.adresse_garage || item?.adresseGarage || '',
        phone: item?.telephone_garage || item?.telephoneGarage || '',
        website: item?.site_web || item?.website || '',
      }));
      if (!results.length) {
        setGarageError('Aucun garage trouve pour cette ville.');
      }
      setSelectedVilleId(resolvedVilleId);
      setGarages(results);
    } catch {
      setGarageError('Erreur lors de la recherche des garages de cette ville.');
    } finally {
      setGarageLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSubmitError('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setSubmitError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const buildBookingDraft = () => ({
    step,
    selectedCategory,
    selectedService,
    selectedGarage,
    selectedDate,
    selectedTime,
    selectedVehicleId,
    city,
    selectedVilleId,
    selectedCityMeta,
    formData,
  });

  const goToClientAuth = (path) => {
    const restoreBooking = buildBookingDraft();
    saveStoredBookingDraft(restoreBooking);

    navigate(path, {
      state: {
        redirectTo: '/booking',
        restoreBooking,
        prefill: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          city,
          postalCode: selectedCityMeta.postcode,
          codeInsee: selectedCityMeta.codeInsee,
          plate: formData.plate,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
        },
      },
    });
  };

  const handleNext = () => {
    setSubmitSuccess(false);
    if (step === 1) {
      confirmSelectedService();
    } else if (step === 2 && selectedGarage) {
      setStep(3);
      updateBookingStep(3, { garage: selectedGarage });
    } else if (step === 3 && selectedDate && selectedTime) {
      setStep(4);
      updateBookingStep(4, { date: selectedDate, time: selectedTime });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSubmitSuccess(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasClientAuth) {
      setSubmitError('Connectez-vous ou creez un compte pour terminer la reservation.');
      return;
    }

    // Vérifier que les statuts sont chargés
    if (statusRdvLoading) {
      setSubmitError('Chargement des données en cours...');
      return;
    }

    const resolvedEmail = String(formData.email || normalizedClientProfile?.email || '').trim();
    const resolvedPhone = String(formData.phone || normalizedClientProfile?.telephone || '').trim();
    const resolvedFirstName = String(formData.firstName || normalizedClientProfile?.prenom || '').trim();
    const resolvedLastName = String(formData.lastName || normalizedClientProfile?.nom || '').trim();

    if (!isValidEmailFormat(resolvedEmail)) {
      setSubmitError('Merci de saisir une adresse email valide.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setSubmitError('Veuillez sélectionner une date et une heure.');
      return;
    }

    if (!selectedGarage?.id) {
      setSubmitError('Veuillez sélectionner un garage.');
      return;
    }

    if (!selectedService?.id) {
      setSubmitError('Veuillez sélectionner une prestation.');
      return;
    }

    if (!selectedVehicleId) {
      setSubmitError('Veuillez sélectionner un véhicule.');
      return;
    }

    setSubmitError('');
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Trouver dynamiquement l'ID du statut "en attente" ou "pending"
      console.log('🔍 Statuts disponibles:', statusRdvList);
      
      const pendingStatus = statusRdvList.find(s => {
        const libelle = String(s.lib_status_rdv || s.status || '').toLowerCase();
        return libelle.includes('attente') || 
               libelle.includes('pending') ||
               libelle.includes('en attente') ||
               libelle.includes('demande') ||
               libelle.includes('nouveau');
      });
      
      // Si aucun statut trouvé, prendre le premier (généralement ID 1)
      const fallbackStatus = statusRdvList[0];
      const finalStatus = pendingStatus || fallbackStatus;
      
      if (!finalStatus && statusRdvList.length > 0) {
        throw new Error('Aucun statut disponible pour créer le rendez-vous');
      }
      
      const pendingStatusId = finalStatus?.id_status_rdv || finalStatus?.id || 1;
      console.log('📝 Création RDV avec statut ID:', pendingStatusId, 'Statut trouvé:', pendingStatus, 'Fallback:', fallbackStatus);
      
      const payload = {
        service: selectedService.id,
        serviceName: selectedService.name,
        duration: 30,
        date: selectedDate,
        time: selectedTime,
        garageId: String(selectedGarage?.id || ''),
        garage: selectedGarage,
        client: {
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          email: resolvedEmail,
          phone: resolvedPhone,
        },
        vehicle: {
          plate: formData.plate,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
        },
        notes: formData.notes,
        status: 'pending',
      };

      const garageNumericId = Number(selectedGarage?.id || 0);
      const prestationNumericId = Number(selectedService?.id || 0);
      const vehiculeNumericId = Number(selectedVehicleId || 0);

      if (hasClientAuth && garageNumericId > 0 && prestationNumericId > 0 && vehiculeNumericId > 0) {
        const response = await createRendezVous(authToken, {
          id_garage: garageNumericId,
          id_vehicule: vehiculeNumericId,
          id_prestation: prestationNumericId,
          id_status_rdv: pendingStatusId,
          date_debut: formatDateTimeForApi(selectedDate, selectedTime),
          date_fin: formatDateTimeForApi(selectedDate, selectedTime, 30),
          commantaire_client: formData.notes || '',
          motif_refus: '',
        });

        if (response?.id_rdv) {
          payload.id = `RDV-${response.id_rdv}`;
          payload.backendId = String(response.id_rdv);
        }
      }

      const appointment = createAppointment(payload);
      clearStoredBookingDraft();
      
      // Afficher le message de succès avant la redirection
      setSubmitSuccess(true);
      
      // Attendre 3 secondes pour montrer le message puis rediriger
      setTimeout(() => {
        navigate('/booking/confirmation', { state: { appointment } });
      }, 3000);
      
    } catch (error) {
      setSubmitError(formatBookingSubmitError(error));
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedTime && !currentTimeSlots.some((slot) => slot.time === selectedTime && slot.available)) {
      setSelectedTime('');
    }
  }, [currentTimeSlots, selectedTime]);

  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedGarage !== null;
      case 3:
        return selectedDate !== '' && selectedTime !== '';
      case 4:
        return (
          hasClientAuth &&
          formData.firstName &&
          formData.lastName &&
          (clientVehicles.length > 0 ? Boolean(selectedVehicleId) : Boolean(formData.plate))
        );
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, label: 'Choisissez une prestation', icon: Wrench },
    { number: 2, label: 'Choisissez votre garage', icon: MapPin },
    { number: 3, label: 'Choisissez date et heure', icon: Calendar },
    { number: 4, label: 'Vos informations', icon: User },
  ];

  return (
    <div className="booking">
      <div className="booking-container">
        {/* Header */}
        <div className="booking-header">
          <h1 className="booking-title">Prendre rendez-vous</h1>
          <p className="booking-subtitle">
            Réservez votre créneau en quelques étapes simples
          </p>
        </div>

        {/* Progress Steps */}
        <div className="booking-progress">
          {steps.map((s, index) => (
            <div 
              key={s.number}
              className={`booking-progress-step ${
                step === s.number ? 'active' : ''
              } ${step > s.number ? 'completed' : ''}`}
            >
              <div className="booking-progress-icon">
                {step > s.number ? <Check size={18} /> : <s.icon size={18} />}
              </div>
              <span className="booking-progress-label">{s.label}</span>
              {index < steps.length - 1 && (
                <div className={`booking-progress-line ${step > s.number ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="booking-content">
          <AnimatePresence mode="wait">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">
                      Choisissez votre catégorie et votre prestation
                    </h2>
                    <p className="booking-step-intro">
                      Toutes les catégories de la base sont affichées ici. Choisissez une catégorie, puis ses prestations apparaîtront dans le second menu.
                    </p>

                    {catalogError && <p className="booking-step-intro">{catalogError}</p>}

                    <div className="booking-selection-form">
                      <div className="booking-selection-group">
                        <label htmlFor="booking-category-select" className="booking-section-title">
                          <Wrench size={18} /> Catégorie
                        </label>
                        <select
                          id="booking-category-select"
                          value={selectedCategory}
                          onChange={(e) => handleCategorySelect(e.target.value)}
                          className="booking-garage-input"
                        >
                          <option value="">Choisissez une catégorie</option>
                          {(bookingCategories || []).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="booking-selection-group">
                        <label htmlFor="booking-prestation-select" className="booking-section-title">
                          <Check size={18} /> Prestation
                        </label>
                        <select
                          id="booking-prestation-select"
                          value={selectedService?.category === activeCategory?.id ? String(selectedService?.id || '') : ''}
                          onChange={(e) => handlePrestationDropdownChange(e.target.value)}
                          className="booking-garage-input"
                          disabled={!activeCategory || prestationsLoading || !(activeCategory.prestations || []).length}
                        >
                          <option value="">
                            {prestationsLoading
                              ? 'Chargement des prestations...'
                              : activeCategory
                                ? 'Choisissez une prestation'
                                : 'Choisissez d’abord une catégorie'}
                          </option>
                          {(activeCategory?.prestations || []).map((service, index) => {
                            const normalizedService = buildSelectedService(service, activeCategory.id, index);
                            return (
                              <option key={normalizedService.id} value={normalizedService.id}>
                                {normalizedService.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {catalogLoading && <p className="booking-prestations-subtitle">Chargement des catégories...</p>}
                      {!catalogLoading && prestationsLoading && (
                        <p className="booking-prestations-subtitle">Chargement des prestations de cette catégorie...</p>
                      )}
                      {!catalogLoading && bookingCategories.length === 0 && (
                        <p className="booking-prestations-subtitle">Aucune catégorie disponible pour le moment.</p>
                      )}
                      {!catalogLoading && bookingCategories.length > 0 && !activeCategory && (
                        <p className="booking-prestations-subtitle">Choisissez une catégorie pour voir ses prestations.</p>
                      )}
                      {!catalogLoading && activeCategory && !(activeCategory.prestations || []).length && (
                        <p className="booking-prestations-subtitle">Aucune prestation pour cette categorie.</p>
                      )}

                      {selectedService && (
                        <div className="booking-selection-confirm">
                          <p>
                            <strong>Prestation choisie :</strong> {selectedService.name}
                          </p>
                          <p className="booking-selection-helper">Cliquez sur « Continuer vers les garages » pour passer à l’étape suivante.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Choix du garage */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">Choisissez votre garage</h2>
                    <div className="booking-summary">
                      <div className="booking-summary-item">
                        <Wrench size={16} />
                        <span>{selectedService?.name}</span>
                      </div>
                    </div>

                    {/* Recherche par ville */}
                    <div className="booking-garage-search">
                      <label className="booking-section-title">
                        <MapPin size={18} /> Votre ville
                      </label>
                      <div className="booking-garage-search-row">
                        <div className="booking-garage-autocomplete">
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => handleCityInputChange(e.target.value)}
                            className="booking-garage-input"
                            placeholder="Tapez une ville, un code postal ou un code INSEE"
                            autoComplete="off"
                          />
                          <span className="booking-garage-help">
                            Utilisez l’autocomplétion officielle pour renseigner automatiquement le code postal et le code INSEE.
                          </span>
                          {cityLoading && <span className="booking-garage-help">Recherche des villes...</span>}
                          {citySuggestions.length > 0 && (
                            <div className="booking-garage-suggestions">
                              {citySuggestions.map((suggestion) => (
                                <button
                                  key={`${suggestion.city}-${suggestion.postcode}-${suggestion.codeInsee}`}
                                  type="button"
                                  className="booking-garage-suggestion"
                                  onClick={() => selectCitySuggestion(suggestion)}
                                >
                                  <span className="booking-garage-suggestion-title">{suggestion.city}</span>
                                  <span className="booking-garage-suggestion-meta">
                                    CP {suggestion.postcode || '—'} • INSEE {suggestion.codeInsee || '—'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="booking-garage-search-btn"
                          onClick={searchGarages}
                          disabled={garageLoading || villesLoading || !city.trim()}
                        >
                          {garageLoading ? (
                            <span className="booking-garage-spinner" />
                          ) : (
                            <Search size={18} />
                          )}
                          Rechercher
                        </button>
                      </div>
                    </div>

                    {(selectedCityMeta.postcode || selectedCityMeta.codeInsee) && (
                      <div className="booking-city-meta">
                        <div className="booking-city-meta-card">
                          <span className="booking-city-meta-label">Code postal</span>
                          <strong>{selectedCityMeta.postcode || '—'}</strong>
                        </div>
                        <div className="booking-city-meta-card">
                          <span className="booking-city-meta-label">Code INSEE</span>
                          <strong>{selectedCityMeta.codeInsee || '—'}</strong>
                        </div>
                      </div>
                    )}

                    {/* Erreur */}
                    {garageError && (
                      <p className="booking-garage-error">{garageError}</p>
                    )}

                    {/* Résultats */}
                    {garages.length > 0 && (
                      <div className="booking-garage-list">
                        <p className="booking-garage-count">{garages.length} garage{garages.length > 1 ? 's' : ''} trouvé{garages.length > 1 ? 's' : ''} dans <strong>{city || 'cette ville'}</strong></p>
                        <AnimatePresence>
                          {garages.map((garage, i) => (
                            <motion.button
                              key={garage.id}
                              type="button"
                              className={`booking-garage-card ${selectedGarage?.id === garage.id ? 'active' : ''}`}
                              onClick={() => setSelectedGarage(garage)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                            >
                              <div className="booking-garage-card-icon">
                                <Wrench size={20} />
                              </div>
                              <div className="booking-garage-card-info">
                                <span className="booking-garage-card-name">{garage.name}</span>
                                {garage.address && (
                                  <span className="booking-garage-card-address">
                                    <MapPin size={12} /> {garage.address}
                                  </span>
                                )}
                                <div className="booking-garage-card-meta">
                                  {garage.phone && (
                                    <span><Phone size={12} /> {garage.phone}</span>
                                  )}
                                  {garage.website && (
                                    <span><Globe size={12} /> Site web</span>
                                  )}
                                </div>
                              </div>
                              {selectedGarage?.id === garage.id && (
                                <span className="booking-garage-card-check"><Check size={16} /></span>
                              )}
                            </motion.button>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">
                      Sélectionnez une date et un horaire
                    </h2>

                    {/* Selected Service Summary */}
                    <div className="booking-summary">
                      <div className="booking-summary-item">
                        <Wrench size={16} />
                        <span>{selectedService?.name}</span>
                      </div>
                      <div className="booking-summary-item">
                        <Clock size={16} />
                        <span>{selectedService?.duration} min</span>
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div className="booking-date-section">
                      <h3 className="booking-section-title">
                        <Calendar size={18} />
                        Date
                      </h3>
                      <div className="booking-dates">
                        {availableDates.map((date) => (
                          <button
                            key={date.value}
                            className={`booking-date ${
                              selectedDate === date.value ? 'active' : ''
                            }`}
                            onClick={() => handleDateSelect(date.value)}
                          >
                            <span className="booking-date-day">
                              {date.label.split(' ')[0]}
                            </span>
                            <span className="booking-date-num">
                              {date.label.split(' ')[1]}
                            </span>
                            <span className="booking-date-month">
                              {date.label.split(' ')[2]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && (
                      <div className="booking-time-section">
                        <h3 className="booking-section-title">
                          <Clock size={18} />
                          Horaire
                        </h3>
                        {scheduleLoading && <p className="booking-prestations-subtitle">Chargement des creneaux du garage...</p>}
                        {!scheduleLoading && scheduleError && <p className="booking-garage-error">{scheduleError}</p>}
                        {!scheduleLoading && !scheduleError && currentTimeSlots.length === 0 && (
                          <p className="booking-prestations-subtitle">Aucun creneau disponible pour ce jour (garage ferme).</p>
                        )}
                        {!scheduleLoading && currentTimeSlots.some((slot) => !slot.available) && (
                          <p className="booking-prestations-subtitle">Les créneaux barrés sont déjà réservés.</p>
                        )}
                        <div className="booking-times">
                          {currentTimeSlots.map((slot) => (
                            <TimeSlot
                              key={slot.time}
                              time={slot.time}
                              available={slot.available}
                              selected={selectedTime === slot.time}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Client Info */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">
                      Vos informations
                    </h2>

                    <div className="booking-summary booking-summary-full">
                      <div className="booking-summary-item">
                        <Wrench size={16} />
                        <span>{selectedService?.name}</span>
                      </div>
                      {selectedGarage && (
                        <div className="booking-summary-item">
                          <MapPin size={16} />
                          <span>{selectedGarage.name}</span>
                        </div>
                      )}
                      <div className="booking-summary-item">
                        <Calendar size={16} />
                        <span>
                          {new Date(selectedDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="booking-summary-item">
                        <Clock size={16} />
                        <span>{selectedTime}</span>
                      </div>
                    </div>

                    {!hasClientAuth ? (
                      <div className="booking-auth-gate">
                        <div className="booking-auth-badge">
                          <User size={18} />
                          Connexion requise
                        </div>
                        <h3 className="booking-step-title booking-auth-title">Connectez-vous ou creez un compte</h3>
                        <p className="booking-step-intro booking-auth-text">
                          Dans Coordonnees, le client doit avoir un compte MecanoLib pour terminer le reste de la reservation.
                        </p>
                        <div className="booking-auth-actions">
                          <Button type="button" onClick={() => goToClientAuth('/client')} className="booking-auth-button">
                            Se connecter
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => goToClientAuth('/client/register')}
                            className="booking-auth-button"
                          >
                            Creer un compte
                          </Button>
                        </div>
                        <p className="booking-auth-note">
                          Votre selection actuelle est conservee pour reprendre cette etape apres la connexion.
                        </p>
                      </div>
                    ) : (
                      <div className="booking-form">
                        <div className="booking-form-section">
                          <h3 className="booking-form-section-title">
                            <User size={18} />
                            Coordonnées
                          </h3>
                          <div className="booking-form-grid">
                            <Input
                              label="Prénom"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              placeholder="Jean"
                            />
                            <Input
                              label="Nom"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                              placeholder="Dupont"
                            />
                          </div>
                        </div>

                        <div className="booking-form-section">
                          <h3 className="booking-form-section-title">
                            <Car size={18} />
                            Véhicule
                          </h3>
                          {vehiclesLoading && <p className="booking-prestations-subtitle">Chargement de vos véhicules...</p>}
                          {!vehiclesLoading && clientVehicles.length > 0 ? (
                            <div className="booking-selection-group">
                              <label htmlFor="booking-vehicle-select" className="booking-section-title">
                                Immatriculation
                              </label>
                              <select
                                id="booking-vehicle-select"
                                value={selectedVehicleId}
                                onChange={(e) => {
                                  setSelectedVehicleId(e.target.value);
                                  setSubmitError('');
                                }}
                                className="booking-garage-input"
                              >
                                <option value="">Choisissez votre voiture</option>
                                {clientVehicles.map((vehicle) => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate || 'Sans immatriculation'}
                                  </option>
                                ))}
                              </select>
                              <p className="booking-prestations-subtitle">
                                Choisissez une voiture enregistrée sur votre compte client, puis laissez une note et confirmez votre rendez-vous.
                              </p>
                            </div>
                          ) : (
                            <Input
                              label="Immatriculation"
                              name="plate"
                              value={formData.plate}
                              onChange={handleInputChange}
                              required
                              placeholder="AB-123-CD"
                              helperText="Il faut ajouter votre voiture dans votre espace client puis laissez une note et confirmez votre rendez-vous."
                            />
                          )}

                        </div>

                        <div className="booking-form-section">
                          <h3 className="booking-form-section-title">
                            <FileText size={18} />
                            Notes (optionnel)
                          </h3>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Décrivez votre problème ou ajoutez des précisions..."
                            className="booking-textarea"
                            rows={4}
                          />
                        </div>

                        {submitError && <p className="booking-garage-error">{submitError}</p>}

                        {submitSuccess && (
                          <div className="booking-success-message" style={{
                            background: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ 
                              color: '#166534', 
                              fontSize: '1.25rem', 
                              fontWeight: '600',
                              marginBottom: '0.75rem' 
                            }}>
                              Demande envoyée avec succès !
                            </h3>
                            <p style={{ color: '#15803d', fontSize: '1rem', lineHeight: '1.5' }}>
                              Votre demande de rendez-vous a bien été transmise au garage.<br />
                              <strong>Veuillez attendre la confirmation du garage</strong> dans votre espace client.
                            </p>
                            <p style={{ 
                              color: '#166534', 
                              fontSize: '0.875rem', 
                              marginTop: '1rem',
                              fontStyle: 'italic'
                            }}>
                              Redirection en cours...
                            </p>
                          </div>
                        )}

                        <div className="booking-consent">
                          <label className="booking-consent-label">
                            <input type="checkbox" required />
                            <span>
                              J'accepte que mes données soient traitées conformément à la{' '}
                              <a href="#">politique de confidentialité</a>
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="booking-navigation">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="booking-nav-button"
            >
              <ChevronLeft size={18} />
              Retour
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="booking-nav-button booking-nav-button-next"
            >
              {step === 1 ? 'Continuer vers les garages' : 'Continuer'}
              <ChevronRight size={18} />
            </Button>
          ) : step === 4 ? (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting || submitSuccess}
              loading={isSubmitting}
              className="booking-nav-button booking-nav-button-submit"
            >
              {submitSuccess ? 'Demande envoyée' : isSubmitting ? 'Envoi en cours...' : 'Confirmer ma demande'}
              {!isSubmitting && !submitSuccess && <ArrowRight size={18} />}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Booking;
