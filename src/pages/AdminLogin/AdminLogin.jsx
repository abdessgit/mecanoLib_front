import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Identifiants super admin (à remplacer par une vraie auth)
    if (email === 'admin@mecanolib.fr' && password === 'Admin@2026') {
      navigate('/admin/dashboard');
    } else {
      setError('Identifiants incorrects.');
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
                  />
                  <button
                    type="button"
                    className="admin-login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="admin-login-error">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="admin-login-submit"
              >
                {isLoading ? 'Vérification...' : 'Se connecter'}
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
