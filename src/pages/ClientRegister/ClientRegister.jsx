import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Car, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card, CardContent } from '../../components';
import { useApp } from '../../context/AppContext';
import './ClientRegister.css';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  plate: '',
  brand: '',
  model: '',
};

const ClientRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerClient } = useApp();
  const prefill = location.state?.prefill || {};
  const [formData, setFormData] = useState(() => ({
    ...initialForm,
    firstName: prefill.firstName || '',
    lastName: prefill.lastName || '',
    email: prefill.email || '',
    phone: prefill.phone || '',
    plate: prefill.plate || '',
    brand: prefill.brand || '',
    model: prefill.model || '',
  }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'Le prenom est requis.';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Le nom est requis.';
    if (!formData.email.trim()) nextErrors.email = 'L email est requis.';
    if (!formData.phone.trim()) nextErrors.phone = 'Le telephone est requis.';
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

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = registerClient(formData);

    if (!result.success) {
      setSubmitError(result.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsSuccess(true);
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
          <div className="client-register-success-actions">
            <Link to="/client" className="client-register-secondary-link">Retour connexion</Link>
            <Button onClick={() => navigate('/client/dashboard')}>Acceder a mon espace client</Button>
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
                  <Input label="Telephone" name="phone" value={formData.phone} onChange={handleChange} icon={Phone} error={errors.phone} required />
                  <Input label="Mot de passe" name="password" type="password" value={formData.password} onChange={handleChange} icon={Lock} error={errors.password} required />
                  <Input label="Confirmer le mot de passe" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} icon={Lock} error={errors.confirmPassword} required />
                </div>

                <div className="client-register-section-title">Vehicule principal</div>
                <div className="client-register-grid client-register-grid-3">
                  <Input label="Immatriculation" name="plate" value={formData.plate} onChange={handleChange} icon={Car} placeholder="AB-123-CD" />
                  <Input label="Marque" name="brand" value={formData.brand} onChange={handleChange} placeholder="Renault" />
                  <Input label="Modele" name="model" value={formData.model} onChange={handleChange} placeholder="Clio" />
                </div>

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
