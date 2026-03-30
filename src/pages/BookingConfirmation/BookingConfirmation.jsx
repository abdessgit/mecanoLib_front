import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Wrench, 
  User, 
  UserPlus,
  Car, 
  Mail,
  MessageCircle,
  Home,
  CalendarDays,
  Printer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent } from '../../components';
import { services } from '../../data/mockData';
import './BookingConfirmation.css';

const BookingConfirmation = () => {
  const location = useLocation();
  const appointment = location.state?.appointment;

  if (!appointment) {
    return (
      <div className="booking-confirmation booking-confirmation-error">
        <div className="booking-confirmation-container">
          <Card>
            <CardContent className="booking-confirmation-content">
              <div className="booking-confirmation-error-icon">
                <CalendarDays size={48} />
              </div>
              <h1 className="booking-confirmation-error-title">
                Aucun rendez-vous trouvé
              </h1>
              <p className="booking-confirmation-error-text">
                Il semble que vous n'ayez pas encore pris de rendez-vous.
              </p>
              <Link to="/booking">
                <Button>
                  <Calendar size={18} />
                  Prendre rendez-vous
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const service = services.find(s => s.id === appointment.service) || 
    { name: 'Prestation personnalisée', duration: 30 };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const message = `Bonjour, j'ai pris rendez-vous chez vous le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${appointment.time} pour ${service.name}.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="booking-confirmation">
      <div className="booking-confirmation-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Header */}
          <div className="booking-confirmation-header">
            <motion.div 
              className="booking-confirmation-success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle size={48} />
            </motion.div>
            <h1 className="booking-confirmation-title">
              Demande de rendez-vous envoyée !
            </h1>
            <p className="booking-confirmation-subtitle">
              Votre demande a été transmise au garage. Vous recevrez une confirmation 
              par email et WhatsApp dès qu'elle sera validée.
            </p>
          </div>

          {/* Appointment Card */}
          <Card className="booking-confirmation-card">
            <CardContent className="booking-confirmation-card-content">
              <div className="booking-confirmation-card-header">
                <div className="booking-confirmation-card-id">
                  RDV #{appointment.id}
                </div>
                <div className="booking-confirmation-card-status">
                  <span className="booking-confirmation-status-badge booking-confirmation-status-pending">
                    En attente de validation
                  </span>
                </div>
              </div>

              <div className="booking-confirmation-details">
                <div className="booking-confirmation-detail">
                  <div className="booking-confirmation-detail-icon">
                    <Wrench size={20} />
                  </div>
                  <div className="booking-confirmation-detail-content">
                    <span className="booking-confirmation-detail-label">Prestation</span>
                    <span className="booking-confirmation-detail-value">{service.name}</span>
                  </div>
                </div>

                <div className="booking-confirmation-detail">
                  <div className="booking-confirmation-detail-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="booking-confirmation-detail-content">
                    <span className="booking-confirmation-detail-label">Date</span>
                    <span className="booking-confirmation-detail-value">
                      {new Date(appointment.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="booking-confirmation-detail">
                  <div className="booking-confirmation-detail-icon">
                    <Clock size={20} />
                  </div>
                  <div className="booking-confirmation-detail-content">
                    <span className="booking-confirmation-detail-label">Heure</span>
                    <span className="booking-confirmation-detail-value">{appointment.time}</span>
                  </div>
                </div>

                <div className="booking-confirmation-detail">
                  <div className="booking-confirmation-detail-icon">
                    <User size={20} />
                  </div>
                  <div className="booking-confirmation-detail-content">
                    <span className="booking-confirmation-detail-label">Client</span>
                    <span className="booking-confirmation-detail-value">
                      {appointment.client.firstName} {appointment.client.lastName}
                    </span>
                  </div>
                </div>

                <div className="booking-confirmation-detail">
                  <div className="booking-confirmation-detail-icon">
                    <Car size={20} />
                  </div>
                  <div className="booking-confirmation-detail-content">
                    <span className="booking-confirmation-detail-label">Véhicule</span>
                    <span className="booking-confirmation-detail-value">
                      {appointment.vehicle.plate}
                      {appointment.vehicle.brand && ` - ${appointment.vehicle.brand}`}
                      {appointment.vehicle.model && ` ${appointment.vehicle.model}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-confirmation-notice">
                <Mail size={18} />
                <p>
                  Un email de confirmation a été envoyé à{' '}
                  <strong>{appointment.client.email}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="booking-confirmation-actions">
            <h3 className="booking-confirmation-actions-title">Que souhaitez-vous faire ?</h3>
            
            <div className="booking-confirmation-actions-grid">
              <button 
                className="booking-confirmation-action"
                onClick={handleWhatsAppShare}
              >
                <div className="booking-confirmation-action-icon booking-confirmation-action-whatsapp">
                  <MessageCircle size={24} />
                </div>
                <span className="booking-confirmation-action-label">Partager sur WhatsApp</span>
              </button>

              <button 
                className="booking-confirmation-action"
                onClick={handlePrint}
              >
                <div className="booking-confirmation-action-icon booking-confirmation-action-print">
                  <Printer size={24} />
                </div>
                <span className="booking-confirmation-action-label">Imprimer le RDV</span>
              </button>

              <Link to="/" className="booking-confirmation-action">
                <div className="booking-confirmation-action-icon booking-confirmation-action-home">
                  <Home size={24} />
                </div>
                <span className="booking-confirmation-action-label">Retour à l'accueil</span>
              </Link>

              <Link to="/booking" className="booking-confirmation-action">
                <div className="booking-confirmation-action-icon booking-confirmation-action-new">
                  <CalendarDays size={24} />
                </div>
                <span className="booking-confirmation-action-label">Nouveau rendez-vous</span>
              </Link>

              <Link
                to="/client/register"
                state={{
                  prefill: {
                    firstName: appointment.client.firstName,
                    lastName: appointment.client.lastName,
                    email: appointment.client.email,
                    phone: appointment.client.phone,
                    plate: appointment.vehicle.plate,
                    brand: appointment.vehicle.brand,
                    model: appointment.vehicle.model,
                  },
                }}
                className="booking-confirmation-action"
              >
                <div className="booking-confirmation-action-icon booking-confirmation-action-client">
                  <UserPlus size={24} />
                </div>
                <span className="booking-confirmation-action-label">Creer mon espace client</span>
              </Link>
            </div>
          </div>

          {/* Info */}
          <div className="booking-confirmation-info">
            <h4 className="booking-confirmation-info-title">Informations importantes</h4>
            <ul className="booking-confirmation-info-list">
              <li>Présentez-vous 5 minutes avant l'heure du rendez-vous</li>
              <li>Apportez votre carte grise et vos clés de véhicule</li>
              <li>En cas d'empêchement, annulez votre rendez-vous au moins 24h à l'avance</li>
              <li>Le garage vous contactera si des modifications sont nécessaires</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
