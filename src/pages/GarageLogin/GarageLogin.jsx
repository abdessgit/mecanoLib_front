import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card, CardContent } from '../../components';
import { useApp } from '../../context/AppContext';
import './GarageLogin.css';

const GarageLogin = () => {
  const navigate = useNavigate();
  const { loginGarage, garageAuth } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Si déjà connecté, rediriger vers le dashboard
  if (garageAuth.isAuthenticated) {
    navigate('/garage/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = loginGarage({ email, password });
    
    if (success) {
      navigate('/garage/dashboard');
    } else {
      setError('Email ou mot de passe incorrect');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="garage-login">
      <div className="garage-login-container">
        {/* Left Side - Branding */}
        <motion.div 
          className="garage-login-branding"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="garage-login-logo">
            <div className="garage-login-logo-icon">
              <Wrench size={32} />
            </div>
            <span className="garage-login-logo-text">MecanoLib</span>
          </div>
          
          <h1 className="garage-login-title">
            Espace professionnel
          </h1>
          
          <p className="garage-login-description">
            Gérez vos rendez-vous, optimisez votre planning et améliorez 
            la satisfaction de vos clients.
          </p>
          
          <div className="garage-login-features">
            <div className="garage-login-feature">
              <div className="garage-login-feature-icon">📅</div>
              <span>Gestion d'agenda simplifiée</span>
            </div>
            <div className="garage-login-feature">
              <div className="garage-login-feature-icon">🔔</div>
              <span>Notifications automatiques</span>
            </div>
            <div className="garage-login-feature">
              <div className="garage-login-feature-icon">📊</div>
              <span>Statistiques en temps réel</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="garage-login-card">
            <CardContent className="garage-login-card-content">
              <div className="garage-login-card-header">
                <h2 className="garage-login-card-title">Connexion</h2>
                <p className="garage-login-card-subtitle">
                  Accédez à votre espace garage
                </p>
              </div>

              <form onSubmit={handleSubmit} className="garage-login-form">
                {error && (
                  <div className="garage-login-error">
                    {error}
                  </div>
                )}

                <div className="garage-login-form-group">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="garage@example.com"
                    icon={Mail}
                    required
                  />
                </div>

                <div className="garage-login-form-group">
                  <div className="garage-login-password-wrapper">
                    <Input
                      label="Mot de passe"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      icon={Lock}
                      required
                    />
                    <button
                      type="button"
                      className="garage-login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="garage-login-options">
                  <label className="garage-login-remember">
                    <input type="checkbox" />
                    <span>Se souvenir de moi</span>
                  </label>
                  <a href="#" className="garage-login-forgot">
                    Mot de passe oublié ?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="garage-login-submit"
                  loading={isLoading}
                  disabled={!email || !password}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                  {!isLoading && <ArrowRight size={18} />}
                </Button>

                <div className="garage-login-demo">
                  <p>Demo: garage@mecanolib.fr / password</p>
                </div>

                <div className="garage-login-register-box">
                  <p className="garage-login-register-title">
                    Votre garage n'est pas encore partenaire ?
                  </p>
                  <p className="garage-login-register-text">
                    Demandez votre inscription pour rejoindre MecanoLib et recevoir vos premiers rendez-vous en ligne.
                  </p>
                  <Link
                    to="/garage/register"
                    className="garage-login-register-button"
                  >
                    <Building2 size={18} />
                    Demander mon inscription
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GarageLogin;
