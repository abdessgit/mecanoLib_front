import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Calendar, Clock, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card, CardContent } from '../../components';
import { clearStoredAuth, getStoredAuth, isJwtExpired, loginUser } from '../../services/api';
import './ClientLogin.css';

const ClientLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, role } = getStoredAuth();
  const redirectTo = location.state?.redirectTo || '/client/dashboard';
  const restoreBooking = location.state?.restoreBooking;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  if (token && !isJwtExpired(token) && role === 'client') {
    return <Navigate to={redirectTo} replace state={restoreBooking ? { restoreBooking } : undefined} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await loginUser({
        email,
        password,
        remember: rememberMe,
      });

      if (result.role !== 'client') {
        clearStoredAuth();
        throw new Error('Cet espace est reserve aux comptes client.');
      }

      navigate(redirectTo, {
        state: restoreBooking ? { restoreBooking } : undefined,
      });
    } catch (err) {
      setError(err.message || 'Identifiants incorrects.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="client-login">
      <div className="client-login-container">
        {/* Left Side - Branding */}
        <motion.div
          className="client-login-branding"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="client-login-logo">
            <div className="client-login-logo-icon">
              <User size={32} />
            </div>
            <span className="client-login-logo-text">MecanoLib</span>
          </div>

          <h1 className="client-login-title">
            Espace Client
          </h1>

          <p className="client-login-description">
            Suivez vos rendez-vous, consultez l'historique de vos interventions 
            et gérez votre véhicule en toute simplicité.
          </p>

          <div className="client-login-features">
            <div className="client-login-feature">
              <div className="client-login-feature-icon"><Calendar size={18} /></div>
              <span>Suivi de vos rendez-vous</span>
            </div>
            <div className="client-login-feature">
              <div className="client-login-feature-icon"><Clock size={18} /></div>
              <span>Historique des interventions</span>
            </div>
            <div className="client-login-feature">
              <div className="client-login-feature-icon"><Bell size={18} /></div>
              <span>Rappels et notifications</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="client-login-card">
            <CardContent className="client-login-card-content">
              <div className="client-login-form-header">
                <h2 className="client-login-form-title">Se connecter</h2>
                <p className="client-login-form-subtitle">
                  Accédez à votre espace personnel
                </p>
              </div>

              <form onSubmit={handleSubmit} className="client-login-form">
                <div className="client-login-field">
                  <div className="client-login-input-wrapper">
                    <Mail size={18} className="client-login-input-icon" />
                    <input
                      type="email"
                      placeholder="Votre email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="client-login-input"
                      required
                    />
                  </div>
                </div>

                <div className="client-login-field">
                  <div className="client-login-input-wrapper">
                    <Lock size={18} className="client-login-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="client-login-input"
                      required
                    />
                    <button
                      type="button"
                      className="client-login-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="client-login-forgot">
                  <a href="#">Mot de passe oublié ?</a>
                </div>

                <div className="client-login-options">
                  <label className="client-login-remember">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Se souvenir de moi</span>
                  </label>
                </div>

                {error && (
                  <div className="client-login-error">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  className="client-login-submit"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>

                <div className="client-login-divider">
                  <span>ou</span>
                </div>

                <Link to="/booking" className="client-login-rdv-btn">
                  <Calendar size={18} />
                  Prendre un rendez-vous
                </Link>

                <p className="client-login-register">
                  Pas encore de compte ?{' '}
                  <Link to="/client/register">Creer un compte</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientLogin;
