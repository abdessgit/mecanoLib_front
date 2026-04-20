import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components';
import './AdminLogin.css';
import { validate2faCode } from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [need2fa, setNeed2fa] = useState(false);
  const [code2fa, setCode2fa] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (need2fa) {
      try {
        await validate2faCode({ email: pendingEmail, code: code2fa });
        navigate('/admin/dashboard');
      } catch (err) {
        setError(err.message || 'Code 2FA invalide');
      }
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remplacer par appel API réel
    if (window.loginUser) {
      try {
        const { requires2fa } = await window.loginUser({ email, password });
        if (requires2fa) {
          setNeed2fa(true);
          setPendingEmail(email);
          setIsLoading(false);
          return;
        }
        navigate('/admin/dashboard');
      } catch (err) {
        setError(err.message || 'Identifiants incorrects.');
      }
    } else {
      // fallback démo
      if (email === 'admin@mecanolib.fr' && password === 'Admin@2026') {
        navigate('/admin/dashboard');
      } else {
        setError('Identifiants incorrects.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="admin-login">
      <motion.div
        className="admin-login-box"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <ShieldCheck size={34} />
          </div>
          <h1 className="admin-login-title">Super Admin</h1>
          <p className="admin-login-subtitle">Accès réservé aux administrateurs MecanoLib</p>
        </div>

        <Card className="admin-login-card">
          <CardContent className="admin-login-card-content">
            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="admin-login-field">
                <label className="admin-login-label">Email administrateur</label>
                <div className="admin-login-input-wrapper">
                  <Mail size={17} className="admin-login-input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mecanolib.fr"
                    className="admin-login-input"
                    required
                    disabled={need2fa}
                  />
                </div>
              </div>

              <div className="admin-login-field">
                <label className="admin-login-label">Mot de passe</label>
                <div className="admin-login-input-wrapper">
                  <Lock size={17} className="admin-login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="admin-login-input"
                    required
                    disabled={need2fa}
                  />
                  <button
                    type="button"
                    className="admin-login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    disabled={need2fa}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {need2fa && (
                <div className="admin-login-field">
                  <label className="admin-login-label">Code 2FA</label>
                  <div className="admin-login-input-wrapper">
                    <Lock size={17} className="admin-login-input-icon" />
                    <input
                      type="text"
                      value={code2fa}
                      onChange={(e) => setCode2fa(e.target.value)}
                      placeholder="Code 2FA reçu par email"
                      className="admin-login-input"
                      required
                    />
                  </div>
                </div>
              )}
              {error && (
                <div className="admin-login-error">{error}</div>
              )}
              <button
                type="submit"
                disabled={isLoading || (!email || !password) && !need2fa}
                className="admin-login-submit"
              >
                {isLoading ? (need2fa ? 'Vérification...' : 'Connexion...') : (need2fa ? 'Valider le code 2FA' : 'Se connecter')}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="admin-login-back">
          <a href="/">← Retour au site</a>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
