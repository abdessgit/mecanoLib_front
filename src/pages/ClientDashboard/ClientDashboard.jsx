import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  Car,
  Edit3,
  Hash,
  LogOut,
  MailCheck,
  Phone,
  Plus,
  Save,
  Trash2,
  User2,
  Wrench,
  X,
} from 'lucide-react';
import { Button, Card, CardContent, Input } from '../../components';
import { useApp } from '../../context/AppContext';
import {
  addVehicule,
  clearStoredAuth,
  deleteVehicule,
  getClientIdFromProfile,
  getClientRendezVous,
  getClientProfile,
  getMarques,
  getModelesByMarque,
  getProfile,
  getStoredAuth,
  getVehiculesClient,
  isJwtExpired,
  normalizeClientProfile,
  updateClientProfile,
} from '../../services/api';
import './ClientDashboard.css';

const EMPTY_VEHICLE_FORM = {
  immatriculation: '',
  annee: '',
  id_marque: '',
  id_modele: '',
};

const buildInfoForm = (source = {}) => ({
  id: String(source?.id || ''),
  prenom: source?.prenom || '',
  nom: source?.nom || '',
  email: source?.email || '',
  telephone: source?.telephone || '',
  ville: source?.ville || '',
  codePostal: source?.codePostal || '',
  adresse: source?.adresse || '',
  codeInsee: source?.codeInsee || '',
});

const STATUS_LABELS = {
  1: 'En attente',
  2: 'Confirmé',
  3: 'Terminé',
  4: 'Refusé',
  5: 'Annulé',
  'pending': 'En attente',
  'confirmed': 'Confirmé',
  'completed': 'Terminé',
  'refused': 'Refusé',
  'cancelled_client': 'Annulé client',
  'cancelled_garage': 'Annulé garage',
};

const normalizeStatusClass = (value = '') => {
  const normalized = value.toString().toLowerCase().trim();
  
  // Mapper les labels français vers les classes CSS
  if (normalized.includes('attente') || normalized === 'pending') return 'pending';
  if (normalized.includes('confirme') || normalized === 'confirmed') return 'confirmed';
  if (normalized.includes('termine') || normalized === 'completed') return 'completed';
  if (normalized.includes('refuse') || normalized === 'refused') return 'refused';
  if (normalized.includes('annule') && normalized.includes('client')) return 'cancelled_client';
  if (normalized.includes('annule') && normalized.includes('garage')) return 'cancelled_garage';
  if (normalized.includes('annule') || normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('no_show')) return 'no_show';
  
  // Fallback: normalisation simple
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
};

const normalizeVehicule = (item) => {
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
    immatriculation: item?.immatriculation || item?.imatriculationVehicule || item?.plaque_immatriculation || 'Non renseignee',
    annee: item?.annee || item?.annee_vehicule || item?.anneeVehicule || '-',
    marque:
      item?.nom_marque ||
      item?.nomMarque ||
      marqueSource?.nom_marque ||
      marqueSource?.nomMarque ||
      marqueSource?.nom ||
      item?.marque ||
      'Marque non renseignee',
    modele:
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
  };
};

const extractMarqueModeles = (item) => {
  const rawModeles = [];

  if (Array.isArray(item?.modeles)) rawModeles.push(...item.modeles);
  if (Array.isArray(item?.modele)) rawModeles.push(...item.modele);
  else if (item?.modele && typeof item.modele === 'object') rawModeles.push(item.modele);
  if (item?.id_modele || item?.idModele || item?.nom_modele || item?.nomModele) rawModeles.push(item);

  return Array.from(new Map(
    rawModeles
      .map((modele) => ({
        id: String(modele?.id_modele ?? modele?.idModele ?? modele?.id ?? ''),
        name: modele?.nom_modele || modele?.nomModele || modele?.nom || 'Modele',
        marqueId: String(item?.id_marque ?? item?.idMarque ?? item?.id ?? ''),
      }))
      .filter((modele) => modele.id || modele.name)
      .map((modele) => [String(modele.id || modele.name || ''), modele])
  ).values());
};

const normalizeRendezVous = (item, index) => {
  const startRaw = item?.date_debut || item?.dateDebut || item?.date || item?.date_rdv || item?.appointment_date || '';
  const startDate = startRaw ? new Date(startRaw) : null;
  const dateLabel = startDate && !Number.isNaN(startDate.getTime())
    ? `${startDate.toLocaleDateString('fr-FR')} a ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : String(startRaw || 'Date non precisee');

  const statusId = Number(item?.id_status_rdv ?? item?.status?.id ?? item?.statusRdv?.idStatusRdv ?? 0);

  const backendId = item?.id_rdv ?? item?.id ?? null;
  
  return {
    id: String(backendId ?? `rdv-${index + 1}`),
    backendId: backendId ? String(backendId) : null,
    garage: item?.garage?.nom_garage || item?.garage?.nomGarage || item?.garage_name || item?.garage || 'Garage',
    service: item?.prestation?.nom_prestation || item?.prestation?.nomPrestation || item?.service || item?.motif || item?.commantaire_client || 'Rendez-vous',
    prix: item?.prestation?.prix || item?.prix || null, // Prix de la prestation
    dateLabel,
    status: item?.status?.libStatusRdv || item?.status?.lib_status_rdv || item?.etat || item?.status || STATUS_LABELS[statusId] || 'En attente',
    startsAt: startDate && !Number.isNaN(startDate.getTime()) ? startDate.getTime() : Number.MAX_SAFE_INTEGER,
  };
};

const ClientDashboard = () => {
  const { token, role, clientId: storedClientId, profile: storedProfile } = getStoredAuth();
  const cachedProfileRef = useRef(storedProfile || null);
  const { appointments: localAppointments = [] } = useApp();
  const [profile, setProfile] = useState(() => cachedProfileRef.current);
  const [loading, setLoading] = useState(() => !cachedProfileRef.current);
  const [dashboardError, setDashboardError] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState(() => buildInfoForm());
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleMessage, setVehicleMessage] = useState('');
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE_FORM);
  const [marques, setMarques] = useState([]);
  const [modeles, setModeles] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [rdvsLoading, setRdvsLoading] = useState(false);

  const clientInfo = useMemo(() => {
    const normalized = normalizeClientProfile(profile);

    return {
      ...normalized,
      id: normalized.id || String(storedClientId || ''),
      telephone: normalized.telephone || 'Non renseigne',
      adresse: normalized.adresse || 'Non renseignee',
      pays: normalized.pays || 'France',
    };
  }, [profile, storedClientId]);

  const fallbackAppointments = useMemo(() => {
    const clientEmail = String(clientInfo.email || '').trim().toLowerCase();
    if (!clientEmail) return [];

    return (Array.isArray(localAppointments) ? localAppointments : [])
      .filter((appointment) => String(appointment?.client?.email || '').trim().toLowerCase() === clientEmail)
      .map((appointment, index) => {
        const dateValue = appointment?.date ? new Date(`${appointment.date}T${appointment.time || '00:00'}:00`) : null;
        return {
          id: appointment?.id || `local-rdv-${index + 1}`,
          garage: appointment?.garage?.name || appointment?.garageName || 'Garage',
          service: appointment?.serviceName || appointment?.service || 'Rendez-vous',
          dateLabel: appointment?.date
            ? `${new Date(appointment.date).toLocaleDateString('fr-FR')} a ${appointment?.time || ''}`
            : 'Date non precisee',
          status: STATUS_LABELS[appointment?.status] || appointment?.status || 'En attente',
          startsAt: dateValue && !Number.isNaN(dateValue.getTime()) ? dateValue.getTime() : Number.MAX_SAFE_INTEGER,
        };
      });
  }, [clientInfo.email, localAppointments]);

  const clientAppointments = rdvs.length ? rdvs : (rdvsLoading ? [] : fallbackAppointments);
  const nextAppointment = useMemo(() => {
    const sorted = [...clientAppointments].sort((a, b) => a.startsAt - b.startsAt);
    return sorted[0] || null;
  }, [clientAppointments]);

  const loadMarques = useCallback(async () => {
    try {
      const data = await getMarques(token);
      const groupedMarques = new Map();

      (Array.isArray(data) ? data : []).forEach((item) => {
        const marqueId = String(item?.id_marque ?? item?.idMarque ?? item?.id ?? '');
        if (!marqueId) return;

        const marqueName = item?.nom_marque || item?.nomMarque || item?.nom || 'Marque';
        const marqueKey = marqueName.trim().toLowerCase() || marqueId;
        const existing = groupedMarques.get(marqueKey) || {
          id: marqueId,
          name: marqueName,
          label: marqueName,
          modeles: [],
        };

        const mergedModeles = new Map(
          (Array.isArray(existing.modeles) ? existing.modeles : []).map((modele) => [
            String(modele.id || modele.name || ''),
            modele,
          ])
        );

        extractMarqueModeles(item).forEach((modele) => {
          const key = String(modele.id || modele.name || '');
          if (key && !mergedModeles.has(key)) {
            mergedModeles.set(key, modele);
          }
        });

        groupedMarques.set(marqueKey, {
          id: existing.id || marqueId,
          name: marqueName,
          label: marqueName,
          modeles: Array.from(mergedModeles.values()),
        });
      });

      setMarques(Array.from(groupedMarques.values()));
    } catch {
      setMarques([]);
    }
  }, [token]);

  const loadVehicles = useCallback(async (resolvedClientId) => {
    if (!token || !resolvedClientId) {
      setVehicles([]);
      return;
    }

    setVehiclesLoading(true);
    setVehicleError('');
    try {
      const data = await getVehiculesClient(token, resolvedClientId);
      const normalized = (Array.isArray(data) ? data : []).map((item) => normalizeVehicule(item));
      setVehicles(normalized);
    } catch (error) {
      setVehicleError(error.message || 'Impossible de charger les vehicules du client.');
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, [token]);

  const loadRendezVous = useCallback(async (resolvedClientId) => {
    if (!token || !resolvedClientId) {
      setRdvs([]);
      return;
    }

    setRdvsLoading(true);
    try {
      const data = await getClientRendezVous(token, resolvedClientId);
      const normalized = (Array.isArray(data) ? data : []).map((item, index) => normalizeRendezVous(item, index));
      setRdvs(normalized);
    } catch (err) {
      console.error('Erreur chargement RDV:', err);
      setRdvs([]);
    } finally {
      setRdvsLoading(false);
    }
  }, [token]);

  const loadDashboard = useCallback(async () => {
    if (!token || role !== 'client' || isJwtExpired(token)) {
      clearStoredAuth();
      setProfile(null);
      setLoading(false);
      return;
    }

    setDashboardError('');

    try {
      const [connectedResult, dbProfileResult] = await Promise.allSettled([
        getProfile(token),
        getClientProfile(token),
      ]);

      if (connectedResult.status !== 'fulfilled' && dbProfileResult.status !== 'fulfilled') {
        if (cachedProfileRef.current) {
          setProfile(cachedProfileRef.current);
          setInfoForm(buildInfoForm(normalizeClientProfile(cachedProfileRef.current)));
          setDashboardError('Serveur lent : affichage des données locales.');
          return;
        }

        throw connectedResult.reason || dbProfileResult.reason || new Error('Impossible de charger votre profil client.');
      }

      const connectedData = connectedResult.status === 'fulfilled' ? connectedResult.value : {};
      const dbProfileData = dbProfileResult.status === 'fulfilled' ? dbProfileResult.value : {};
      const mergedProfile = {
        ...(connectedData && typeof connectedData === 'object' ? connectedData : {}),
        ...(dbProfileData && typeof dbProfileData === 'object' ? dbProfileData : {}),
        connectedUser: connectedData,
        dbProfile: dbProfileData,
        client: dbProfileData?.client || dbProfileData?.data?.client || connectedData?.client || connectedData?.data?.client,
        clients: dbProfileData?.clients || dbProfileData?.data?.clients || connectedData?.clients || connectedData?.data?.clients || [],
        profil: dbProfileData?.profil || connectedData?.profil || dbProfileData || connectedData,
        utilisateur: connectedData?.utilisateur || dbProfileData?.utilisateur || connectedData?.data?.utilisateur || dbProfileData?.data?.utilisateur,
        user: connectedData?.user || dbProfileData?.user || connectedData?.data?.user || dbProfileData?.data?.user,
      };

      setProfile(mergedProfile);
      cachedProfileRef.current = mergedProfile;
      setInfoForm(buildInfoForm(normalizeClientProfile(mergedProfile)));

      const resolvedClientId = getClientIdFromProfile(mergedProfile) || storedClientId || mergedProfile?.id || mergedProfile?.data?.id || '';
      setLoading(false);

      void Promise.allSettled([
        loadMarques(),
        loadVehicles(resolvedClientId),
        loadRendezVous(resolvedClientId),
      ]);
    } catch (error) {
      setDashboardError(error.message || 'Impossible de charger votre espace client.');
    } finally {
      setLoading(false);
    }
  }, [token, role, storedClientId, loadMarques, loadRendezVous, loadVehicles]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const loadModeles = async () => {
      if (!vehicleForm.id_marque) {
        setModeles([]);
        return;
      }

      const selectedMarque = marques.find((item) => item.id === String(vehicleForm.id_marque));
      if (selectedMarque?.modeles?.length) {
        setModeles(selectedMarque.modeles);
        return;
      }

      try {
        const data = await getModelesByMarque(vehicleForm.id_marque, token);
        const normalized = (Array.isArray(data) ? data : []).map((item) => ({
          id: String(item?.id_modele ?? item?.idModele ?? item?.id ?? ''),
          name: item?.nom_modele || item?.nomModele || item?.nom || 'Modele',
          marqueId: String(item?.marqueId ?? vehicleForm.id_marque ?? ''),
        })).filter((item) => item.id);
        setModeles(Array.from(new Map(normalized.map((item) => [item.id, item])).values()));
      } catch {
        setModeles([]);
      }
    };

    loadModeles();
  }, [vehicleForm.id_marque, marques, token]);

  if (!token || role !== 'client' || isJwtExpired(token)) {
    return <Navigate to="/client" replace />;
  }

  const handleLogout = () => {
    clearStoredAuth();
    window.location.href = '/client';
  };

  const handleStartInfoEdit = () => {
    setInfoForm(buildInfoForm(clientInfo));
    setInfoError('');
    setInfoMessage('');
    setIsEditingInfo(true);
  };

  const handleCancelInfoEdit = () => {
    setInfoForm(buildInfoForm(clientInfo));
    setInfoError('');
    setInfoMessage('');
    setIsEditingInfo(false);
  };

  const handleInfoFieldChange = (event) => {
    const { name, value } = event.target;
    setInfoForm((current) => ({
      ...current,
      [name]: value,
    }));
    setInfoError('');
    setInfoMessage('');
  };

  const handleSaveInfo = async (event) => {
    event.preventDefault();

    if (!infoForm.telephone.trim()) {
      setInfoError('Le numero de telephone est obligatoire.');
      return;
    }

    setInfoSaving(true);
    setInfoError('');
    setInfoMessage('');

    try {
      await updateClientProfile(token, {
        id: clientInfo.id,
        prenom: infoForm.prenom.trim(),
        nom: infoForm.nom.trim(),
        email: infoForm.email.trim(),
        telephone: infoForm.telephone.trim(),
        ville: infoForm.ville.trim(),
        codePostal: infoForm.codePostal.trim(),
        adresse: infoForm.adresse.trim(),
        codeInsee: infoForm.codeInsee.trim(),
      });

      await loadDashboard();
      setInfoMessage('Numero de telephone mis a jour avec succes.');
      setIsEditingInfo(false);
    } catch (error) {
      setInfoError(error.message || 'Impossible de modifier vos informations.');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleVehicleFieldChange = (event) => {
    const { name, value } = event.target;
    setVehicleForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'id_marque' ? { id_modele: '' } : {}),
    }));
    setVehicleError('');
    setVehicleMessage('');
  };

  const handleAddVehicle = async (event) => {
    event.preventDefault();

    if (!clientInfo.id) {
      setVehicleError('Identifiant client introuvable pour ajouter un vehicule.');
      return;
    }

    if (!vehicleForm.immatriculation.trim() || !vehicleForm.annee.trim() || !vehicleForm.id_marque) {
      setVehicleError('Merci de renseigner l immatriculation, l annee et la marque.');
      return;
    }

    setVehicleSaving(true);
    setVehicleError('');
    setVehicleMessage('');

    try {
      const selectedModele = modeles.find((item) => item.id === String(vehicleForm.id_modele));
      const resolvedMarqueId = String(selectedModele?.marqueId || vehicleForm.id_marque || '').trim();

      await addVehicule(token, {
        immatriculation: vehicleForm.immatriculation.trim(),
        annee: vehicleForm.annee.trim(),
        id_client: Number(clientInfo.id),
        id_marque: Number(resolvedMarqueId),
        ...(vehicleForm.id_modele ? { id_modele: Number(vehicleForm.id_modele) } : {}),
      });

      setVehicleForm(EMPTY_VEHICLE_FORM);
      setVehicleMessage('Vehicule ajoute avec succes.');
      await loadVehicles(clientInfo.id);
    } catch (error) {
      setVehicleError(error.message || 'Impossible d ajouter le vehicule.');
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!vehicleId || !window.confirm('Supprimer ce vehicule ?')) {
      return;
    }

    setVehicleError('');
    setVehicleMessage('');

    try {
      await deleteVehicule(token, vehicleId);
      setVehicleMessage('Vehicule supprime avec succes.');
      await loadVehicles(clientInfo.id);
    } catch (error) {
      setVehicleError(error.message || 'Impossible de supprimer le vehicule.');
    }
  };

  if (loading && !profile) {
    return (
      <div className="client-dashboard">
        <div className="client-dashboard-shell">
          <div className="client-dashboard-empty">
            <p>Chargement de votre espace client...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-dashboard">
      <div className="client-dashboard-shell">
        <div className="client-dashboard-header">
          <div>
            <span className="client-dashboard-kicker">Espace client</span>
            <h1>Bonjour {clientInfo.prenom || 'Client'}</h1>
            <p>Retrouvez vos informations personnelles, vos vehicules et vos rendez-vous.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="client-dashboard-logout">
            <LogOut size={18} />
            Deconnexion
          </Button>
        </div>

        {dashboardError && (
          <div className="client-dashboard-error-banner">{dashboardError}</div>
        )}

        <div className="client-dashboard-alert">
          <MailCheck size={20} />
          <div>
            <strong>Compte client actif</strong>
            <span>Votre email de contact est {clientInfo.email || 'non renseigne'}.</span>
          </div>
        </div>

        <div className="client-dashboard-grid">
          <Card className="client-dashboard-card">
            <CardContent className="client-dashboard-card-content">
              <div className="client-dashboard-section-header client-dashboard-section-header-tight">
                <div>
                  <h2>Mes informations</h2>
                  <p>Retrouvez vos informations personnelles.</p>
                </div>
              </div>

              {infoError && <div className="client-dashboard-error-banner">{infoError}</div>}
              {infoMessage && <div className="client-dashboard-success-banner">{infoMessage}</div>}

              <div className="client-dashboard-list">
                <div className="client-dashboard-info-row">
                  <User2 size={16} />
                  <div>
                    <small>Nom</small>
                    <span>{`${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim() || 'Non renseigne'}</span>
                  </div>
                </div>
                <div className="client-dashboard-info-row">
                  <MailCheck size={16} />
                  <div>
                    <small>Email</small>
                    <span>{clientInfo.email || 'Non renseigne'}</span>
                  </div>
                </div>
                <div className="client-dashboard-info-row client-dashboard-phone-row">
                  <Phone size={16} />
                  <div className="client-dashboard-phone-content">
                    <small>Telephone</small>
                    {!isEditingInfo ? (
                      <div className="client-dashboard-phone-display">
                        <span>{clientInfo.telephone || 'Non renseigne'}</span>
                        <Button type="button" variant="outline" size="sm" onClick={handleStartInfoEdit} className="client-dashboard-edit-btn">
                          <Edit3 size={16} />
                          Modifier
                        </Button>
                      </div>
                    ) : (
                      <form className="client-dashboard-phone-form" onSubmit={handleSaveInfo}>
                        <Input
                          label="Nouveau numero"
                          name="telephone"
                          value={infoForm.telephone}
                          onChange={handleInfoFieldChange}
                          placeholder="06 12 34 56 78"
                          required
                        />
                        <div className="client-dashboard-phone-actions">
                          <Button type="button" variant="ghost" onClick={handleCancelInfoEdit}>
                            <X size={16} />
                            Annuler
                          </Button>
                          <Button type="submit" loading={infoSaving} disabled={infoSaving}>
                            {!infoSaving && <Save size={16} />}
                            {infoSaving ? 'Enregistrement...' : 'Enregistrer'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="client-dashboard-card">
            <CardContent className="client-dashboard-card-content">
              <div className="client-dashboard-section-header client-dashboard-section-header-tight">
                <div>
                  <h2>Mes vehicules</h2>
                  <p>{vehicles.length} vehicule(s) enregistre(s)</p>
                </div>
              </div>

              {vehiclesLoading ? (
                <div className="client-dashboard-empty"><p>Chargement des vehicules...</p></div>
              ) : vehicles.length === 0 ? (
                <div className="client-dashboard-empty"><p>Aucun vehicule enregistre pour le moment.</p></div>
              ) : (
                <div className="client-dashboard-vehicle-list">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="client-dashboard-vehicle-card">
                      <div>
                        <strong>{vehicle.immatriculation}</strong>
                        <span>{vehicle.marque}{vehicle.modele ? ` • ${vehicle.modele}` : ''}</span>
                        <small>Annee : {vehicle.annee}</small>
                      </div>
                      <button
                        type="button"
                        className="client-dashboard-delete-btn"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        title="Supprimer ce vehicule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="client-dashboard-card client-dashboard-form-card">
          <CardContent className="client-dashboard-card-content">
            <div className="client-dashboard-section-header">
              <div>
                <h2>Ajouter un vehicule</h2>
                <p>Ajoutez une voiture liee a votre compte client.</p>
              </div>
            </div>

            {vehicleError && <div className="client-dashboard-error-banner">{vehicleError}</div>}
            {vehicleMessage && <div className="client-dashboard-success-banner">{vehicleMessage}</div>}

            <form className="client-dashboard-form" onSubmit={handleAddVehicle}>
              <div className="client-dashboard-form-grid client-dashboard-form-grid-2">
                <Input
                  label="Immatriculation"
                  name="immatriculation"
                  value={vehicleForm.immatriculation}
                  onChange={handleVehicleFieldChange}
                  placeholder="AB-123-CD"
                  required
                />
                <div className="client-dashboard-select-field">
                  <label className="client-dashboard-select-label">Annee</label>
                  <select
                    name="annee"
                    value={vehicleForm.annee}
                    onChange={handleVehicleFieldChange}
                    className="client-dashboard-select"
                    required
                  >
                    <option value="">Choisir une annee</option>
                    {Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="client-dashboard-form-grid client-dashboard-form-grid-2">
                <div className="client-dashboard-select-field">
                  <label className="client-dashboard-select-label">Marque</label>
                  <select
                    name="id_marque"
                    value={vehicleForm.id_marque}
                    onChange={handleVehicleFieldChange}
                    className="client-dashboard-select"
                    required
                    disabled={marques.length === 0}
                  >
                    <option value="">Choisir une marque depuis la base</option>
                    {marques.map((marque) => (
                      <option key={marque.id || marque.name} value={marque.id}>{marque.label || marque.name}</option>
                    ))}
                  </select>
                </div>

                <div className="client-dashboard-select-field">
                  <label className="client-dashboard-select-label">Modele</label>
                  <select
                    name="id_modele"
                    value={vehicleForm.id_modele}
                    onChange={handleVehicleFieldChange}
                    className="client-dashboard-select"
                    disabled={!vehicleForm.id_marque || modeles.length === 0}
                  >
                    <option value="">Choisir un modele depuis la base</option>
                    {modeles.map((modele) => (
                      <option key={modele.id} value={modele.id}>{modele.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="client-dashboard-form-actions">
                <Button type="submit" loading={vehicleSaving} disabled={vehicleSaving || !clientInfo.id}>
                  {!vehicleSaving && <Plus size={18} />}
                  {vehicleSaving ? 'Ajout...' : 'Ajouter le vehicule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="client-dashboard-card client-dashboard-appointments-card">
          <CardContent className="client-dashboard-card-content">
            <div className="client-dashboard-section-header">
              <div>
                <h2>Mes rendez-vous</h2>
                <p>{clientAppointments.length} rendez-vous associe(s) a votre compte.</p>
              </div>
              <Link to="/booking" className="client-dashboard-book-link">
                <Calendar size={18} />
                Prendre un rendez-vous
              </Link>
            </div>

            {rdvsLoading ? (
              <div className="client-dashboard-skeleton">
                <div className="client-dashboard-skeleton-item" />
                <div className="client-dashboard-skeleton-item" />
                <div className="client-dashboard-skeleton-item" />
              </div>
            ) : nextAppointment ? (
              <div className="client-dashboard-next-appointment">
                <span className="client-dashboard-next-label">Prochain rendez-vous</span>
                <strong>{nextAppointment.service}</strong>
                <p>{nextAppointment.dateLabel}</p>
              </div>
            ) : (
              <div className="client-dashboard-empty">
                <p>Aucun rendez-vous associe a votre compte pour le moment.</p>
              </div>
            )}

            {clientAppointments.length > 0 && (
              <div className="client-dashboard-appointment-list">
                {clientAppointments.map((appointment) => (
                  <div key={appointment.id} className="client-dashboard-appointment-item">
                    <div>
                      <strong>{appointment.service}</strong>
                      <span>{appointment.garage}</span>
                      <small>{appointment.dateLabel}</small>
                    </div>
                    <div className="client-dashboard-appointment-actions">
                      {(() => {
                        const status = String(appointment.status || '').toLowerCase();
                        const isConfirmed = status.includes('confirm') || status === '2';
                        return (
                          <>
                            {isConfirmed && appointment.prix && (
                              <span className="client-dashboard-price">
                                {typeof appointment.prix === 'number' 
                                  ? appointment.prix.toFixed(2).replace('.', ',') + ' €'
                                  : appointment.prix}
                              </span>
                            )}
                            <span className={`client-dashboard-status client-dashboard-status-${normalizeStatusClass(appointment.status)}`}>
                              {STATUS_LABELS[appointment.status] || appointment.status}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
