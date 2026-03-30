import React, { useState } from 'react';
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
import './GarageRegister.css';

const serviceOptions = [
  'Entretien & revision',
  'Freinage',
  'Pneumatiques',
  'Diagnostic electronique',
  'Climatisation',
  'Carrosserie',
  'Vehicules hybrides',
  'Vehicules electriques',
];

const featureOptions = [
  'Vehicule de courtoisie',
  'Prise en charge express',
  'Paiement en plusieurs fois',
  'Depannage',
  'Salle d attente',
  'Equipe multimarque',
];

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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const toggleArrayValue = (field, value) => {
    setFormData((current) => {
      const currentValues = current[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [field]: nextValues,
      };
    });

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.garageName.trim()) nextErrors.garageName = 'Le nom du garage est requis.';
    if (!formData.managerName.trim()) nextErrors.managerName = 'Le nom du responsable est requis.';
    if (!formData.email.trim()) nextErrors.email = 'L email est requis.';
    if (!formData.phone.trim()) nextErrors.phone = 'Le telephone est requis.';
    if (!formData.city.trim()) nextErrors.city = 'La ville est requise.';
    if (!formData.address.trim()) nextErrors.address = 'L adresse est requise.';
    if (!formData.postalCode.trim()) nextErrors.postalCode = 'Le code postal est requis.';
    if (!formData.employees) nextErrors.employees = 'Selectionnez la taille de votre equipe.';
    if (!formData.bays) nextErrors.bays = 'Indiquez le nombre de postes atelier.';
    if (formData.services.length === 0) nextErrors.services = 'Choisissez au moins une specialite.';
    if (!formData.acceptTerms) nextErrors.acceptTerms = 'Vous devez accepter les conditions.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setIsSubmitting(false);
    setIsSubmitted(true);
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
              Notre equipe partenaires va etudier votre dossier et vous recontacter sous 24 a 48 heures.
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
                <h2>Parlez-nous de votre garage</h2>
                <p>
                  Remplissez ce formulaire pour que notre equipe puisse evaluer votre inscription et configurer votre futur espace garage.
                </p>
              </div>

              <form className="garage-register-form" onSubmit={handleSubmit}>
                <section className="garage-register-section">
                  <h3>Informations principales</h3>
                  <div className="garage-register-grid garage-register-grid-2">
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
                      label="Responsable"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleChange}
                      placeholder="Ali Ben Salem"
                      icon={User}
                      error={errors.managerName}
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
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      icon={Phone}
                      error={errors.phone}
                      required
                    />
                    <Input
                      label="Site web"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.mon-garage.fr"
                      icon={Globe}
                    />
                    <Input
                      label="SIREN / SIRET"
                      name="siren"
                      value={formData.siren}
                      onChange={handleChange}
                      placeholder="123 456 789 00012"
                      icon={FileText}
                    />
                  </div>
                </section>

                <section className="garage-register-section">
                  <h3>Localisation et capacite</h3>
                  <div className="garage-register-grid garage-register-grid-2">
                    <Input
                      label="Ville"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Lyon"
                      icon={MapPin}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="Code postal"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="69007"
                      error={errors.postalCode}
                      required
                    />
                  </div>
                  <Input
                    label="Adresse complete"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="15 rue des Freres Lumiere"
                    icon={MapPin}
                    error={errors.address}
                    required
                  />

                  <div className="garage-register-grid garage-register-grid-2">
                    <label className="garage-register-field">
                      <span className="garage-register-field-label">Taille de l equipe *</span>
                      <select
                        name="employees"
                        value={formData.employees}
                        onChange={handleChange}
                        className={`garage-register-select ${errors.employees ? 'garage-register-select-error' : ''}`}
                      >
                        <option value="">Selectionnez</option>
                        <option value="1-3">1 a 3 techniciens</option>
                        <option value="4-8">4 a 8 techniciens</option>
                        <option value="9-15">9 a 15 techniciens</option>
                        <option value="15+">Plus de 15 techniciens</option>
                      </select>
                      {errors.employees && <p className="garage-register-error-text">{errors.employees}</p>}
                    </label>

                    <label className="garage-register-field">
                      <span className="garage-register-field-label">Postes atelier *</span>
                      <select
                        name="bays"
                        value={formData.bays}
                        onChange={handleChange}
                        className={`garage-register-select ${errors.bays ? 'garage-register-select-error' : ''}`}
                      >
                        <option value="">Selectionnez</option>
                        <option value="1-2">1 a 2 postes</option>
                        <option value="3-5">3 a 5 postes</option>
                        <option value="6-10">6 a 10 postes</option>
                        <option value="10+">Plus de 10 postes</option>
                      </select>
                      {errors.bays && <p className="garage-register-error-text">{errors.bays}</p>}
                    </label>
                  </div>
                </section>

                <section className="garage-register-section">
                  <h3>Expertise atelier</h3>
                  <p className="garage-register-section-description">Selectionnez vos specialites principales.</p>
                  <div className="garage-register-chip-grid">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        className={`garage-register-chip ${formData.services.includes(service) ? 'garage-register-chip-active' : ''}`}
                        onClick={() => toggleArrayValue('services', service)}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                  {errors.services && <p className="garage-register-error-text">{errors.services}</p>}

                  <Input
                    label="Marques et vehicules pris en charge"
                    name="brands"
                    value={formData.brands}
                    onChange={handleChange}
                    placeholder="Renault, Peugeot, Citroen, utilitaires, vehicules premium..."
                    icon={Car}
                  />
                </section>

                <section className="garage-register-section">
                  <h3>Services complementaires</h3>
                  <p className="garage-register-section-description">Mettez en avant ce qui vous distingue des autres garages.</p>
                  <div className="garage-register-chip-grid garage-register-chip-grid-features">
                    {featureOptions.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        className={`garage-register-chip garage-register-chip-soft ${formData.features.includes(feature) ? 'garage-register-chip-active-soft' : ''}`}
                        onClick={() => toggleArrayValue('features', feature)}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="garage-register-section">
                  <h3>Presentation libre</h3>
                  <label className="garage-register-field">
                    <span className="garage-register-field-label">Parlez-nous de votre garage</span>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="garage-register-textarea"
                      placeholder="Expliquez votre positionnement, vos certifications, vos horaires ou toute information utile pour votre dossier."
                    />
                  </label>
                </section>

                <section className="garage-register-section garage-register-submit-section">
                  <label className="garage-register-consent">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                    />
                    <span>
                      J accepte d etre recontacte par MecanoLib pour l etude de mon inscription partenaire.
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="garage-register-error-text">{errors.acceptTerms}</p>}

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
