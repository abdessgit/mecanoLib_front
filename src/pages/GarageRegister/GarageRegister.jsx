import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Car,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  ChevronLeft,
  Send,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card, CardContent } from '../../components';
import {
  calculateFrenchVatNumber,
  getFrenchAddressSuggestions,
  getFrenchCitySuggestions,
  getVilles,
  isValidEmailFormat,
  isValidPhoneFormat,
  lookupFrenchBusinessBySiretOrSiren,
  registerGarage,
} from '../../services/api';
import './GarageRegister.css';

const initialForm = {
  garageName: '',
  managerName: '',
  email: '',
  phone: '',
  website: '',
  city: '',
  address: '',
  postalCode: '',
  employees: '',
  bays: '',
  brands: '',
  siren: '',
  tva: '',
  mdp: '',
  id_ville: '',
  code_insee: '',
  services: [],
  features: [],
  message: '',
  acceptTerms: false,
};

const GarageRegister = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [villes, setVilles] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [companyLookupLoading, setCompanyLookupLoading] = useState(false);
  const [companyLookupMessage, setCompanyLookupMessage] = useState('');

  useEffect(() => {
    loadVilles();
  }, []);

  const normalizeText = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const findMatchingVilleId = ({ cityName, postcode, codeInsee }) => {
    const matchedVille = villes.find((ville) => {
      const sameName = normalizeText(ville?.nom_ville) === normalizeText(cityName);
      const samePostcode = String(ville?.code_postal || '') === String(postcode || '');
      const sameInsee = String(ville?.code_insee || ville?.code_inssee || '') === String(codeInsee || '');
      return sameInsee || (sameName && samePostcode) || sameName;
    });

    return matchedVille?.id_ville ? String(matchedVille.id_ville) : '';
  };

  const loadVilles = async () => {
    try {
      const villeData = await getVilles();
      if (Array.isArray(villeData)) {
        setVilles(villeData);
      }
    } catch (error) {
      console.error('Error loading villes:', error);
    }
  };

  const searchFrenchCities = async (value) => {
    if (!value.trim()) {
      setCitySuggestions([]);
      return;
    }

    setCityLoading(true);
    try {
      const suggestions = await getFrenchCitySuggestions(value);
      setCitySuggestions(suggestions);
    } catch (error) {
      console.error('Erreur recherche ville:', error);
      setCitySuggestions([]);
    } finally {
      setCityLoading(false);
    }
  };

  const searchFrenchAddresses = async (value, city = formData.city, postcode = formData.postalCode) => {
    if (!value.trim()) {
      setAddressSuggestions([]);
      return;
    }

    setAddressLoading(true);
    try {
      const suggestions = await getFrenchAddressSuggestions(value, { city, postcode });
      setAddressSuggestions(suggestions);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setAddressSuggestions([]);
    } finally {
      setAddressLoading(false);
    }
  };

  const selectCitySuggestion = (suggestion) => {
    const matchedVilleId = findMatchingVilleId({
      cityName: suggestion.city,
      postcode: suggestion.postcode,
      codeInsee: suggestion.codeInsee,
    });

    setFormData((current) => ({
      ...current,
      city: suggestion.city,
      postalCode: suggestion.postcode,
      code_insee: suggestion.codeInsee,
      id_ville: matchedVilleId,
    }));
    setCitySuggestions([]);
    setErrors((current) => ({
      ...current,
      city: '',
      id_ville: '',
      postalCode: '',
    }));
  };

  const selectAddressSuggestion = (suggestion) => {
    const matchedVilleId = findMatchingVilleId({
      cityName: suggestion.city,
      postcode: suggestion.postcode,
      codeInsee: suggestion.codeInsee,
    });

    setFormData((current) => ({
      ...current,
      address: suggestion.address,
      city: suggestion.city || current.city,
      postalCode: suggestion.postcode || current.postalCode,
      code_insee: suggestion.codeInsee || current.code_insee,
      id_ville: matchedVilleId || current.id_ville,
    }));
    setAddressSuggestions([]);
    setErrors((current) => ({
      ...current,
      address: '',
      city: '',
      id_ville: '',
    }));
  };

  const handleSirenLookup = async () => {
    const digits = String(formData.siren || '').replace(/\D+/g, '');

    if (!digits) {
      setCompanyLookupMessage('');
      setFormData((current) => ({ ...current, tva: '' }));
      return;
    }

    if (![9, 14].includes(digits.length)) {
      setCompanyLookupMessage('Saisissez un SIREN (9 chiffres) ou un SIRET (14 chiffres).');
      return;
    }

    setCompanyLookupLoading(true);
    setCompanyLookupMessage('Verification du SIREN / SIRET...');

    try {
      const company = await lookupFrenchBusinessBySiretOrSiren(digits);
      const matchedVilleId = findMatchingVilleId({
        cityName: company?.city,
        postcode: company?.postalCode,
        codeInsee: company?.codeInsee,
      });

      setFormData((current) => ({
        ...current,
        tva: company?.tva || calculateFrenchVatNumber(digits) || current.tva,
        garageName: current.garageName || company?.name || current.garageName,
        address: current.address || company?.address || current.address,
        city: current.city || company?.city || current.city,
        postalCode: current.postalCode || company?.postalCode || current.postalCode,
        code_insee: current.code_insee || company?.codeInsee || current.code_insee,
        id_ville: current.id_ville || matchedVilleId || current.id_ville,
      }));

      setCompanyLookupMessage(
        company?.found
          ? 'Informations du garage et TVA recuperees automatiquement.'
          : 'TVA calculee automatiquement. Completez les autres informations si besoin.'
      );
      setErrors((current) => ({ ...current, siren: '' }));
    } catch (error) {
      const fallbackTva = calculateFrenchVatNumber(digits);
      setFormData((current) => ({
        ...current,
        tva: fallbackTva || current.tva,
      }));
      setCompanyLookupMessage(
        fallbackTva
          ? 'TVA calculee automatiquement. La verification API est indisponible pour le moment.'
          : (error.message || 'Impossible de verifier ce SIREN / SIRET pour le moment.')
      );
    } finally {
      setCompanyLookupLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox'
      ? checked
      : name === 'phone'
        ? value.replace(/[^\d+().\s-]/g, '')
        : value;

    setFormData((current) => ({
      ...current,
      [name]: nextValue,
      ...(name === 'city' ? { id_ville: '', code_insee: '', postalCode: '' } : {}),
      ...(name === 'siren' ? { tva: calculateFrenchVatNumber(nextValue) || '' } : {}),
    }));

    if (name === 'siren') {
      setCompanyLookupMessage('');
    }

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.garageName.trim()) nextErrors.garageName = 'Le nom du garage est requis.';
    if (!formData.email.trim()) nextErrors.email = 'L email est requis.';
    else if (!isValidEmailFormat(formData.email)) nextErrors.email = 'Veuillez saisir une adresse email valide.';
    if (!formData.phone.trim()) nextErrors.phone = 'Le telephone est requis.';
    else if (!isValidPhoneFormat(formData.phone)) nextErrors.phone = 'Veuillez saisir un numero de telephone valide (ex: 06 12 34 56 78).';
    if (!formData.city.trim()) nextErrors.city = 'Choisissez une ville via les suggestions.';
    if (!formData.postalCode.trim()) nextErrors.postalCode = 'Le code postal est requis.';
    if (!formData.address.trim()) nextErrors.address = 'L adresse est requise.';
    if (formData.siren.trim() && !calculateFrenchVatNumber(formData.siren)) nextErrors.siren = 'Le SIREN / SIRET doit contenir 9 ou 14 chiffres valides.';
    if (!formData.mdp.trim() || formData.mdp.length < 6) nextErrors.mdp = 'Le mot de passe doit contenir au minimum 6 caracteres.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerGarage({
        nom_garage: formData.garageName,
        email: formData.email,
        telephone: formData.phone,
        adresse: formData.address,
        siret: formData.siren || '',
        tva: formData.tva || calculateFrenchVatNumber(formData.siren) || '',
        id_ville: formData.id_ville ? Number(formData.id_ville) : null,
        ville: formData.city,
        cp: formData.postalCode,
        code_insee: formData.code_insee,
        mdp: formData.mdp
      });

      setSuccessMessage(`Garage "${formData.garageName}" inscrit avec succes!`);
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData(initialForm);
        setErrors({});
        setIsSubmitted(false);
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ submit: err.message || 'Erreur lors de l inscription' });
    }
  };

  if (isSubmitted) {
    return (
      <div className="garage-register-page">
        <div className="garage-register-shell garage-register-shell-success">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="garage-register-success"
          >
            <div className="garage-register-success-icon">
              <CheckCircle2 size={36} />
            </div>
            <h1>Votre demande a bien ete envoyee</h1>
            <p>
              {successMessage || 'Notre equipe partenaires va etudier votre dossier et vous recontacter sous 24 a 48 heures.'}
            </p>
            <div className="garage-register-success-summary">
              <div>
                <span>Garage</span>
                <strong>{formData.garageName}</strong>
              </div>
              <div>
                <span>Ville</span>
                <strong>{formData.city}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{formData.email}</strong>
              </div>
            </div>
            <div className="garage-register-success-actions">
              <Link to="/garage" className="garage-register-secondary-link">
                <ChevronLeft size={18} />
                Retour a l espace garage
              </Link>
              <Button onClick={() => {
                setFormData(initialForm);
                setErrors({});
                setIsSubmitted(false);
              }}>
                Envoyer une autre demande
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="garage-register-page">
      <div className="garage-register-shell">
        <motion.aside
          className="garage-register-aside"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link to="/garage" className="garage-register-back-link">
            <ChevronLeft size={18} />
            Retour a l espace garage
          </Link>

          <div className="garage-register-brand">
            <div className="garage-register-brand-icon">
              <Building2 size={30} />
            </div>
            <div>
              <span className="garage-register-brand-name">MecanoLib</span>
              <p className="garage-register-brand-subtitle">Programme partenaires</p>
            </div>
          </div>

          <h1 className="garage-register-title">Inscrivez votre garage sur la plateforme</h1>
          <p className="garage-register-description">
            Presentez votre atelier, vos specialites et votre capacite d accueil pour recevoir des demandes qualifiees depuis MecanoLib.
          </p>

          <div className="garage-register-benefits">
            <div className="garage-register-benefit">
              <ShieldCheck size={18} />
              <span>Visibilite aupres d automobilistes qualifies</span>
            </div>
            <div className="garage-register-benefit">
              <Clock3 size={18} />
              <span>Moins d appels manuels, plus de rendez-vous organises</span>
            </div>
            <div className="garage-register-benefit">
              <Car size={18} />
              <span>Presentation claire de vos prestations et de vos points forts</span>
            </div>
          </div>

          <div className="garage-register-stats">
            <div className="garage-register-stat-card">
              <strong>48h</strong>
              <span>delai moyen de retour</span>
            </div>
            <div className="garage-register-stat-card">
              <strong>3 min</strong>
              <span>pour completer le dossier</span>
            </div>
          </div>
        </motion.aside>

        <motion.div
          className="garage-register-main"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <Card className="garage-register-card">
            <CardContent className="garage-register-card-content">
              <div className="garage-register-card-header">
                <span className="garage-register-kicker">Inscription partenaire</span>
                <h2>Inscription garage</h2>
                <p>
                  Remplissez uniquement les informations necessaires a l enregistrement en base.
                </p>
              </div>

              <form className="garage-register-form" onSubmit={handleSubmit}>
                {errors.submit && (
                  <div style={{
                    padding: '12px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    {errors.submit}
                  </div>
                )}
                <section className="garage-register-section">
                  <h3>Informations du garage</h3>
                  <div className="garage-register-grid garage-register-grid-compact">
                    <Input
                      label="Nom du garage"
                      name="garageName"
                      value={formData.garageName}
                      onChange={handleChange}
                      placeholder="Garage du Centre"
                      icon={Building2}
                      error={errors.garageName}
                      required
                    />
                    <Input
                      label="Email professionnel"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@garage.fr"
                      icon={Mail}
                      error={errors.email}
                      required
                    />
                    <Input
                      label="Telephone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      icon={Phone}
                      error={errors.phone}
                      helperText="Format attendu : 06 12 34 56 78"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                    />
                    <Input
                      label="SIREN / SIRET"
                      name="siren"
                      value={formData.siren}
                      onChange={handleChange}
                      onBlur={handleSirenLookup}
                      placeholder="123 456 789 00012"
                      icon={FileText}
                      error={errors.siren}
                      helperText="Renseignez un SIREN ou SIRET pour recuperer automatiquement le garage et calculer la TVA."
                    />
                    <Input
                      label="TVA intracommunautaire"
                      name="tva"
                      value={formData.tva}
                      onChange={handleChange}
                      placeholder="FRxx123456789"
                      icon={FileText}
                      helperText="Calculee automatiquement a partir du SIREN / SIRET"
                      readOnly
                    />
                    <Input
                      label="Mot de passe"
                      name="mdp"
                      type="password"
                      value={formData.mdp}
                      onChange={handleChange}
                      placeholder="Minimum 6 caracteres"
                      error={errors.mdp}
                      required
                    />
                  </div>
                  {companyLookupLoading && (
                    <div className="garage-register-suggestion-hint">Verification du SIREN / SIRET...</div>
                  )}
                  {!companyLookupLoading && companyLookupMessage && (
                    <div className="garage-register-suggestion-hint">{companyLookupMessage}</div>
                  )}
                </section>

                <section className="garage-register-section">
                  <h3>Adresse du garage</h3>
                  <div className="garage-register-grid garage-register-grid-compact">
                    <div className="garage-register-autocomplete">
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
                        placeholder="Tapez la premiere lettre : Lyon"
                        icon={MapPin}
                        error={errors.city || errors.id_ville}
                        helperText="Suggestions officielles via l API adresse.data.gouv.fr"
                        autoComplete="off"
                        required
                      />
                      {cityLoading && <div className="garage-register-suggestion-hint">Recherche des villes...</div>}
                      {!cityLoading && citySuggestions.length > 0 && (
                        <div className="garage-register-suggestions">
                          {citySuggestions.map((suggestion) => (
                            <button
                              key={`${suggestion.city}-${suggestion.postcode}-${suggestion.codeInsee}`}
                              type="button"
                              className="garage-register-suggestion"
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
                  <div className="garage-register-autocomplete">
                    <Input
                      label="Adresse complete"
                      name="address"
                      value={formData.address}
                      onChange={(event) => {
                        handleChange(event);
                        searchFrenchAddresses(event.target.value, formData.city, formData.postalCode);
                      }}
                      onFocus={() => {
                        if (formData.address.trim()) {
                          searchFrenchAddresses(formData.address, formData.city, formData.postalCode);
                        }
                      }}
                      placeholder="Tapez les premieres lettres : rue Victor Hugo"
                      icon={MapPin}
                      error={errors.address}
                      helperText="Suggestions d adresse officielles en France"
                      autoComplete="off"
                      required
                    />
                    {addressLoading && <div className="garage-register-suggestion-hint">Recherche des adresses...</div>}
                    {!addressLoading && addressSuggestions.length > 0 && (
                      <div className="garage-register-suggestions">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.address}-${suggestion.postcode}-${index}`}
                            type="button"
                            className="garage-register-suggestion"
                            onMouseDown={() => selectAddressSuggestion(suggestion)}
                          >
                            <strong>{suggestion.address}</strong>
                            <span>{suggestion.postcode} · {suggestion.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </section>


                <section className="garage-register-section garage-register-submit-section">

                  <div className="garage-register-actions">
                    <Link to="/garage" className="garage-register-secondary-link">
                      Retour
                    </Link>
                    <Button type="submit" className="garage-register-submit" loading={isSubmitting}>
                      {isSubmitting ? 'Envoi du dossier...' : 'Envoyer ma candidature'}
                      {!isSubmitting && <Send size={18} />}
                    </Button>
                  </div>
                </section>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GarageRegister;
