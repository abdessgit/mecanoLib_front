import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Calendar, Car, LogOut, MailCheck, User2, Phone, Wrench } from 'lucide-react';
import { Button, Card, CardContent } from '../../components';
import { useApp } from '../../context/AppContext';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const { clientAuth, logoutClient, appointments, services } = useApp();

  const clientAppointments = clientAuth.user?.email
    ? appointments.filter((appointment) => appointment.client.email === clientAuth.user.email)
    : [];

  const nextAppointment = clientAppointments[0];
  const nextService = nextAppointment
    ? services.find((service) => service.id === nextAppointment.service)
    : null;

  if (!clientAuth.isAuthenticated) {
    return <Navigate to="/client" replace />;
  }

  return (
    <div className="client-dashboard">
      <div className="client-dashboard-shell">
        <div className="client-dashboard-header">
          <div>
            <span className="client-dashboard-kicker">Espace client</span>
            <h1>Bonjour {clientAuth.user.firstName}</h1>
            <p>Votre compte est actif. Vous pouvez suivre vos informations et vos rendez-vous depuis cet espace.</p>
          </div>
          <Button variant="outline" onClick={logoutClient} className="client-dashboard-logout">
            <LogOut size={18} />
            Deconnexion
          </Button>
        </div>

        <div className="client-dashboard-alert">
          <MailCheck size={20} />
          <div>
            <strong>Email d inscription envoye</strong>
            <span>Un email de bienvenue a ete prepare pour {clientAuth.user.email}.</span>
          </div>
        </div>

        <div className="client-dashboard-grid">
          <Card className="client-dashboard-card">
            <CardContent className="client-dashboard-card-content">
              <h2>Mon profil</h2>
              <div className="client-dashboard-list">
                <div><User2 size={16} /><span>{clientAuth.user.firstName} {clientAuth.user.lastName}</span></div>
                <div><Phone size={16} /><span>{clientAuth.user.phone}</span></div>
                <div><MailCheck size={16} /><span>{clientAuth.user.email}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="client-dashboard-card">
            <CardContent className="client-dashboard-card-content">
              <h2>Mon vehicule</h2>
              <div className="client-dashboard-list">
                <div><Car size={16} /><span>{clientAuth.user.vehicle?.plate || 'Non renseignee'}</span></div>
                <div><Wrench size={16} /><span>{clientAuth.user.vehicle?.brand || 'Marque non renseignee'}</span></div>
                <div><Car size={16} /><span>{clientAuth.user.vehicle?.model || 'Modele non renseigne'}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="client-dashboard-card client-dashboard-appointments-card">
          <CardContent className="client-dashboard-card-content">
            <div className="client-dashboard-section-header">
              <div>
                <h2>Mes rendez-vous</h2>
                <p>{clientAppointments.length} rendez-vous associe(s) a votre email.</p>
              </div>
              <Link to="/booking" className="client-dashboard-book-link">
                <Calendar size={18} />
                Prendre un rendez-vous
              </Link>
            </div>

            {nextAppointment ? (
              <div className="client-dashboard-next-appointment">
                <span className="client-dashboard-next-label">Prochain rendez-vous</span>
                <strong>{nextService?.name || 'Prestation'}</strong>
                <p>
                  {new Date(nextAppointment.date).toLocaleDateString('fr-FR')} a {nextAppointment.time}
                </p>
              </div>
            ) : (
              <div className="client-dashboard-empty">
                <p>Aucun rendez-vous associe a votre compte pour le moment.</p>
              </div>
            )}

            {clientAppointments.length > 0 && (
              <div className="client-dashboard-appointment-list">
                {clientAppointments.map((appointment) => {
                  const service = services.find((item) => item.id === appointment.service);
                  return (
                    <div key={appointment.id} className="client-dashboard-appointment-item">
                      <div>
                        <strong>{service?.name || appointment.service}</strong>
                        <span>{new Date(appointment.date).toLocaleDateString('fr-FR')} a {appointment.time}</span>
                      </div>
                      <span className={`client-dashboard-status client-dashboard-status-${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
