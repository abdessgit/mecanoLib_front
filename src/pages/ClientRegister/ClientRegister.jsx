import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Car, ShieldCheck, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card, CardContent } from '../../components';
import {
  getFrenchAddressSuggestions,
  getFrenchCitySuggestions,
  getMarques,
  getModelesByMarque,
  isValidEmailFormat,
  isValidPhoneFormat,
  registerClient as registerClientApi,
} from '../../services/api';
import './ClientRegister.css';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  postalCode: '',
  address: '',
  codeInsee: '',
  password: '',
  confirmPassword: '',
  plate: '',
  year: '',
  brand: '',
  brandId: '',
  model: '',
  modelId: '',
};

const extractBrandModeles = (item) => {
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

const groupVehicleBrands = (items = []) => {
  const grouped = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const marqueId = String(item?.id_marque ?? item?.idMarque ?? item?.id ?? '');
    const marqueName = item?.nom_marque || item?.nomMarque || item?.nom || 'Marque';
    const key = marqueName.trim().toLowerCase() || marqueId;
    const existing = grouped.get(key) || {
      id: marqueId,
      name: marqueName,
      modeles: [],
    };

    const mergedModeles = new Map(
      (Array.isArray(existing.modeles) ? existing.modeles : []).map((modele) => [String(modele.id || modele.name || ''), modele])
    );

    extractBrandModeles(item).forEach((modele) => {
      const modelKey = String(modele.id || modele.name || '');
      if (modelKey && !mergedModeles.has(modelKey)) {
        mergedModeles.set(modelKey, modele);
      }
    });

    grouped.set(key, {
      id: existing.id || marqueId,
      name: marqueName,
      modeles: Array.from(mergedModeles.values()),
    });
  });

  return Array.from(grouped.values()).filter((item) => item.id || item.name);
};

const ClientRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = location.state?.prefill || {};
  const redirectTo = location.state?.redirectTo || '/client/dashboard';
  const restoreBooking = location.state?.restoreBooking || null;
  const [formData, setFormData] = useState(() => ({
    ...initialForm,
    firstName: prefill.firstName || '',
    lastName: prefill.lastName || '',
    email: prefill.email || '',
    phone: prefill.phone || '',
    city: prefill.city || '',
    postalCode: prefill.postalCode || '',
    address: prefill.address || '',
    codeInsee: prefill.codeInsee || '',
    plate: prefill.plate || '',
    year: prefill.year || prefill.annee || '',
    brand: prefill.brand || '',
    brandId: prefill.brandId || prefill.id_marque || '',
    model: prefill.model || '',
    modelId: prefill.modelId || prefill.id_modele || '',
  }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [vehicleMarques, setVehicleMarques] = useState([]);
  const [vehicleModeles, setVehicleModeles] = useState([]);
  const [vehicleOptionsLoading, setVehicleOptionsLoading] = useState(false);
  const [vehicleOptionsError, setVehicleOptionsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadVehicleMarques = async () => {
      setVehicleOptionsLoading(true);
      setVehicleOptionsError('');
      try {
        const marquesData = await getMarques();

        if (cancelled) {
          return;
        }

        const uniqueMarques = groupVehicleBrands(marquesData);
        setVehicleMarques(uniqueMarques);
      } catch (error) {
        if (!cancelled) {
          setVehicleMarques([]);
          setVehicleOptionsError(error.message || 'Impossible de charger les marques depuis la base.');
        }
      } finally {
        if (!cancelled) {
          setVehicleOptionsLoading(false);
        }
      }
    };

    loadVehicleMarques();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadModelesForMarque = async () => {
      if (!formData.brandId) {
        setVehicleModeles([]);
        setFormData((current) => ({ ...current, modelId: '', model: '' }));
        return;
      }

      const selectedBrand = vehicleMarques.find((item) => item.id === String(formData.brandId));
      if (selectedBrand?.modeles?.length) {
        const uniqueModeles = Array.from(new Map(selectedBrand.modeles.map((item) => [String(item.id || item.name || ''), item])).values());
        setVehicleModeles(uniqueModeles);
        setFormData((current) => {
          const stillSelected = uniqueModeles.some((item) => item.id === current.modelId);
          return stillSelected ? current : { ...current, modelId: '', model: '' };
        });
        return;
      }

      setVehicleOptionsLoading(true);
      setVehicleOptionsError('');

      try {
        const modelesData = await getModelesByMarque(formData.brandId);

        if (cancelled) {
          return;
        }

        const normalizedModeles = (Array.isArray(modelesData) ? modelesData : []).map((item) => ({
          id: String(item?.id_modele ?? item?.idModele ?? item?.id ?? ''),
          name: item?.nom_modele || item?.nomModele || item?.nom || item?.name || 'Modele',
          marqueId: String(item?.marqueId ?? formData.brandId ?? ''),
        })).filter((item) => item.id);

        const uniqueModeles = Array.from(new Map(normalizedModeles.map((item) => [item.id, item])).values());
        setVehicleModeles(uniqueModeles);
      } catch (error) {
        if (!cancelled) {
          setVehicleModeles([]);
          setVehicleOptionsError(error.message || 'Impossible de charger les modeles depuis la base.');
        }
      } finally {
        if (!cancelled) {
          setVehicleOptionsLoading(false);
        }
      }
    };

    loadModelesForMarque();

    return () => {
      cancelled = true;
    };
  }, [formData.brandId, vehicleMarques]);

  const availableVehicleBrands = useMemo(() => vehicleMarques, [vehicleMarques]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'brandId') {
      const selectedBrand = vehicleMarques.find((item) => item.id === String(value));
      setFormData((current) => ({
        ...current,
        brandId: value,
        brand: selectedBrand?.name || '',
        modelId: '',
        model: '',
      }));
      setErrors((current) => ({ ...current, brandId: '', modelId: '' }));
      setSubmitError('');
      return;
    }

    if (name === 'modelId') {
      const selectedModele = vehicleModeles.find((item) => item.id === String(value));
      setFormData((current) => ({
        ...current,
        modelId: value,
        model: selectedModele?.name || '',
      }));
      setErrors((current) => ({ ...current, modelId: '' }));
      setSubmitError('');
      return;
    }

    const normalizedValue = name === 'plate'
      ? value.toUpperCase()
      : name === 'phone'
        ? value.replace(/[^\d+().\s-]/g, '')
        : value;

    setFormData((current) => ({
      ...current,
      [name]: normalizedValue,
      ...(name === 'city' ? { postalCode: '', codeInsee: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const searchFrenchCities = async (value) => {
    setFormData((current) => ({ ...current, city: value, postalCode: '', codeInsee: '' }));

    if (value.trim().length < 1) {
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

  const searchFrenchAddresses = async (value) => {
    setFormData((current) => ({ ...current, address: value }));

    if (value.trim().length < 1) {
      setAddressSuggestions([]);
      return;
    }

    setAddressLoading(true);
    try {
      const suggestions = await getFrenchAddressSuggestions(value, {
        city: formData.city,
        postcode: formData.postalCode,
      });
      setAddressSuggestions(suggestions);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const selectCitySuggestion = (suggestion) => {
    setFormData((current) => ({
      ...current,
      city: suggestion.city,
      postalCode: suggestion.postcode,
      codeInsee: suggestion.codeInsee,
    }));
    setCitySuggestions([]);
    setErrors((current) => ({ ...current, city: '', postalCode: '' }));
  };

  const selectAddressSuggestion = (suggestion) => {
    setFormData((current) => ({
      ...current,
      address: suggestion.address,
      city: suggestion.city || current.city,
      postalCode: suggestion.postcode || current.postalCode,
      codeInsee: suggestion.codeInsee || current.codeInsee,
    }));
    setAddressSuggestions([]);
    setErrors((current) => ({ ...current, address: '', city: '', postalCode: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'Le prenom est requis.';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Le nom est requis.';
    if (!formData.email.trim()) nextErrors.email = 'L email est requis.';
    else if (!isValidEmailFormat(formData.email)) nextErrors.email = 'Veuillez saisir une adresse email valide.';
    if (!formData.phone.trim()) nextErrors.phone = 'Le telephone est requis.';
    else if (!isValidPhoneFormat(formData.phone)) nextErrors.phone = 'Veuillez saisir un numero de telephone valide (ex: 06 12 34 56 78).';
    if (!formData.city.trim()) nextErrors.city = 'Choisissez une ville via les suggestions.';
    if (!formData.postalCode.trim()) nextErrors.postalCode = 'Le code postal est requis.';
    if (!formData.address.trim()) nextErrors.address = 'Choisissez une adresse via les suggestions.';
    if (!formData.password) nextErrors.password = 'Le mot de passe est requis.';
    if (formData.password.length < 6) nextErrors.password = 'Minimum 6 caracteres.';
    if (formData.confirmPassword !== formData.password) nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const selectedModele = vehicleModeles.find((item) => item.id === String(formData.modelId));
      const resolvedBrandId = String(selectedModele?.marqueId || formData.brandId || '').trim();

      await registerClientApi({
        nom: formData.lastName.trim(),
        prenom: formData.firstName.trim(),
        email: formData.email.trim(),
        mdp: formData.password,
        tel: formData.phone.trim(),
        ville: formData.city.trim(),
        cp: formData.postalCode.trim(),
        adresse: formData.address.trim(),
        code_insee: formData.codeInsee.trim(),
        immatriculation: formData.plate.trim(),
        annee: formData.year.trim(),
        id_marque: resolvedBrandId,
        id_modele: formData.modelId,
        marque: formData.brand.trim(),
        modele: formData.model.trim(),
        consentement: true,
      });

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error.message || 'Erreur lors de l inscription du client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="client-register-page">
        <motion.div
          className="client-register-success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="client-register-success-icon">
            <CheckCircle2 size={34} />
          </div>
          <h1>Inscription terminee</h1>
          <p>
            Un email de bienvenue a ete prepare pour <strong>{formData.email}</strong>. Votre compte client est maintenant actif.
          </p>
          {redirectTo === '/booking' && (
            <p>
              Connectez-vous maintenant pour reprendre votre reservation exactement a l etape Coordonnees.
            </p>
          )}
          <div className="client-register-success-actions">
            <Link
              to="/client"
              state={{ redirectTo, restoreBooking }}
              className="client-register-secondary-link"
            >
              Retour connexion
            </Link>
            <Button onClick={() => navigate('/client', { state: { redirectTo, restoreBooking } })}>
              Se connecter maintenant
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="client-register-page">
      <div className="client-register-layout">
        <motion.div
          className="client-register-branding"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="client-register-kicker">Inscription client</span>
          <h1>Creer votre espace client MecanoLib</h1>
          <p>
            Recevez un email de bienvenue, gardez vos informations sous la main et accedez ensuite a votre espace personnel.
          </p>
          <div className="client-register-points">
            <div><ShieldCheck size={18} /><span>Compte personnel immediatement accessible</span></div>
            <div><Mail size={18} /><span>Email de bienvenue apres inscription</span></div>
            <div><Car size={18} /><span>Vehicule memorise pour vos futurs rendez-vous</span></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <Card className="client-register-card">
            <CardContent className="client-register-card-content">
              <div className="client-register-header">
                <h2>Creer mon compte</h2>
                <p>Quelques informations suffisent pour activer votre espace client.</p>
                {prefill.email && (
                  <p>
                    Vos informations de reservation ont ete pre-remplies pour aller plus vite.
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="client-register-form">
                <div className="client-register-grid client-register-grid-2">
                  <Input label="Prenom" name="firstName" value={formData.firstName} onChange={handleChange} icon={User} error={errors.firstName} required />
                  <Input label="Nom" name="lastName" value={formData.lastName} onChange={handleChange} icon={User} error={errors.lastName} required />
                  <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={Mail} error={errors.email} required />
                  <Input
                    label="Telephone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={Phone}
                    error={errors.phone}
                    placeholder="06 12 34 56 78"
                    helperText="Format attendu : 06 12 34 56 78"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                  />
                </div>

                <div className="client-register-section-title">Adresse</div>
                <div className="client-register-grid client-register-grid-2">
                  <div className="client-register-autocomplete">
                    <Input
                      label="Ville"
                      name="city"
                      value={formData.city}
                      onChange={(event) => {
                        handleChange(event);
                        searchFrenchCities(event.target.value);
                      }}
                      onFocus={() => {
                        if (formData.city.trim()) {
                          searchFrenchCities(formData.city);
                        }
                      }}
                      icon={MapPin}
                      placeholder="Tapez la premiere lettre : Lyon"
                      error={errors.city}
                      helperText="Suggestions officielles France"
                      autoComplete="off"
                      required
                    />
                    {cityLoading && <div className="client-register-suggestion-hint">Recherche des villes...</div>}
                    {!cityLoading && citySuggestions.length > 0 && (
                      <div className="client-register-suggestions">
                        {citySuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.city}-${suggestion.postcode}-${index}`}
                            type="button"
                            className="client-register-suggestion"
                            onMouseDown={() => selectCitySuggestion(suggestion)}
                          >
                            <strong>{suggestion.city}</strong>
                            <span>{suggestion.postcode} · INSEE {suggestion.codeInsee}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Input
                    label="Code postal"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="69007"
                    error={errors.postalCode}
                    helperText="Renseigne automatiquement apres le choix de la ville"
                    disabled
                  />
                </div>

                <div className="client-register-autocomplete">
                  <Input
                    label="Adresse complete"
                    name="address"
                    value={formData.address}
                    onChange={(event) => {
                      handleChange(event);
                      searchFrenchAddresses(event.target.value);
                    }}
                    onFocus={() => {
                      if (formData.address.trim()) {
                        searchFrenchAddresses(formData.address);
                      }
                    }}
                    icon={MapPin}
                    placeholder="Tapez les premieres lettres : rue Victor Hugo"
                    error={errors.address}
                    helperText="Suggestions d adresse officielles France"
                    autoComplete="off"
                    required
                  />
                  {addressLoading && <div className="client-register-suggestion-hint">Recherche des adresses...</div>}
                  {!addressLoading && addressSuggestions.length > 0 && (
                    <div className="client-register-suggestions">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.address}-${suggestion.postcode}-${index}`}
                          type="button"
                          className="client-register-suggestion"
                          onMouseDown={() => selectAddressSuggestion(suggestion)}
                        >
                          <strong>{suggestion.address}</strong>
                          <span>{suggestion.postcode} · {suggestion.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="client-register-grid client-register-grid-2">
                  <Input label="Mot de passe" name="password" type="password" value={formData.password} onChange={handleChange} icon={Lock} error={errors.password} required />
                  <Input label="Confirmer le mot de passe" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} icon={Lock} error={errors.confirmPassword} required />
                </div>

                <div className="client-register-section-title">Vehicule principal</div>
                <div className="client-register-grid client-register-grid-2">
                  <Input label="Immatriculation" name="plate" value={formData.plate} onChange={handleChange} icon={Car} placeholder="AB-123-CD" />
                  <Input label="Annee" name="year" type="number" value={formData.year} onChange={handleChange} icon={Car} placeholder="2020" />

                  <div className="input-wrapper">
                    <label className="input-label">Marque</label>
                    <select
                      name="brandId"
                      value={formData.brandId}
                      onChange={handleChange}
                      className="input-field"
                      disabled={vehicleOptionsLoading || availableVehicleBrands.length === 0}
                    >
                      <option value="">Choisir une marque depuis la base</option>
                      {availableVehicleBrands.map((brand) => (
                        <option key={brand.id || brand.name} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-wrapper">
                    <label className="input-label">Modele</label>
                    <select
                      name="modelId"
                      value={formData.modelId}
                      onChange={handleChange}
                      className="input-field"
                      disabled={vehicleOptionsLoading || !formData.brandId || vehicleModeles.length === 0}
                    >
                      <option value="">Choisir un modele depuis la base</option>
                      {vehicleModeles.map((modele) => (
                        <option key={modele.id} value={modele.id}>{modele.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {vehicleOptionsLoading && <p className="input-helper">Chargement des donnees vehicule depuis la base...</p>}
                {!vehicleOptionsLoading && !formData.brandId && <p className="input-helper">Choisissez d abord une marque pour charger les modeles depuis la base.</p>}
                {!vehicleOptionsLoading && formData.brandId && vehicleModeles.length === 0 && !vehicleOptionsError && (
                  <p className="input-helper">Aucun modele n a ete renvoye par la base pour cette marque.</p>
                )}
                {vehicleOptionsError && <div className="client-register-error">{vehicleOptionsError}</div>}

                {submitError && <div className="client-register-error">{submitError}</div>}

                <div className="client-register-actions">
                  <Link to="/client" className="client-register-secondary-link">J ai deja un compte</Link>
                  <Button type="submit" className="client-register-submit" loading={isSubmitting}>
                    {isSubmitting ? 'Creation du compte...' : 'Creer mon compte'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientRegister;
