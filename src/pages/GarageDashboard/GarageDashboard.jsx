import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Wrench, 
  TrendingUp, 
  LogOut, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  BarChart3,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  StatusBadge, 
  Modal 
} from '../../components';
import { useApp } from '../../context/AppContext';
import { services } from '../../data/mockData';
import './GarageDashboard.css';

const GarageDashboard = () => {
  const navigate = useNavigate();
  const { appointments, garageAuth, logoutGarage, updateAppointmentStatus } = useApp();
  
  const [activeTab, setActiveTab] = useState('appointments');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!garageAuth.isAuthenticated) {
      navigate('/garage');
    }
  }, [garageAuth.isAuthenticated, navigate]);

  // Filtrer les rendez-vous
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      const matchesSearch = 
        apt.client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Statistiques
  const stats = [
    { 
      label: 'RDV du jour', 
      value: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length,
      icon: Calendar,
      color: 'blue'
    },
    { 
      label: 'En attente', 
      value: appointments.filter(a => a.status === 'pending').length,
      icon: Clock,
      color: 'yellow'
    },
    { 
      label: 'Confirmés', 
      value: appointments.filter(a => a.status === 'confirmed').length,
      icon: CheckCircle,
      color: 'green'
    },
    { 
      label: 'Total clients', 
      value: new Set(appointments.map(a => a.client.email)).size,
      icon: Users,
      color: 'purple'
    },
  ];

  const handleLogout = () => {
    logoutGarage();
    navigate('/garage');
  };

  const handleViewDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    updateAppointmentStatus(appointmentId, newStatus);
    if (selectedAppointment?.id === appointmentId) {
      setSelectedAppointment({ ...selectedAppointment, status: newStatus });
    }
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || serviceId;
  };

  const navigateDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  if (!garageAuth.isAuthenticated) {
    return null;
  }

  return (
    <div className="garage-dashboard">
      {/* Sidebar */}
      <aside className="garage-dashboard-sidebar">
        <div className="garage-dashboard-sidebar-header">
          <div className="garage-dashboard-logo">
            <div className="garage-dashboard-logo-icon">
              <Wrench size={24} />
            </div>
            <span className="garage-dashboard-logo-text">MecanoLib</span>
          </div>
        </div>

        <nav className="garage-dashboard-nav">
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={20} />
            <span>Rendez-vous</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <BarChart3 size={20} />
            <span>Agenda</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <Users size={20} />
            <span>Clients</span>
          </button>
          <button
            className={`garage-dashboard-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </button>
        </nav>

        <div className="garage-dashboard-sidebar-footer">
          <button className="garage-dashboard-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="garage-dashboard-main">
        {/* Header */}
        <header className="garage-dashboard-header">
          <div className="garage-dashboard-header-left">
            <h1 className="garage-dashboard-header-title">
              {activeTab === 'appointments' && 'Gestion des rendez-vous'}
              {activeTab === 'calendar' && 'Agenda'}
              {activeTab === 'clients' && 'Clients'}
              {activeTab === 'settings' && 'Paramètres'}
            </h1>
          </div>
          <div className="garage-dashboard-header-right">
            <button className="garage-dashboard-header-button">
              <Bell size={20} />
              <span className="garage-dashboard-header-badge">3</span>
            </button>
            <div className="garage-dashboard-user">
              <div className="garage-dashboard-user-avatar">
                {garageAuth.user?.name?.charAt(0) || 'G'}
              </div>
              <span className="garage-dashboard-user-name">
                {garageAuth.user?.name || 'Garage'}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="garage-dashboard-content">
          {activeTab === 'appointments' && (
            <>
              {/* Stats */}
              <div className="garage-dashboard-stats">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className={`garage-dashboard-stat garage-dashboard-stat-${stat.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="garage-dashboard-stat-icon">
                      <stat.icon size={24} />
                    </div>
                    <div className="garage-dashboard-stat-content">
                      <span className="garage-dashboard-stat-value">{stat.value}</span>
                      <span className="garage-dashboard-stat-label">{stat.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Filters */}
              <Card className="garage-dashboard-filters">
                <CardContent className="garage-dashboard-filters-content">
                  <div className="garage-dashboard-search">
                    <Search size={18} className="garage-dashboard-search-icon" />
                    <input
                      type="text"
                      placeholder="Rechercher un RDV, client, immatriculation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="garage-dashboard-search-input"
                    />
                  </div>
                  
                  <div className="garage-dashboard-filter-group">
                    <Filter size={18} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="garage-dashboard-filter-select"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmés</option>
                      <option value="completed">Terminés</option>
                      <option value="cancelled_client">Annulés client</option>
                      <option value="cancelled_garage">Annulés garage</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments Table */}
              <Card>
                <CardContent className="garage-dashboard-table-container">
                  <table className="garage-dashboard-table">
                    <thead>
                      <tr>
                        <th>RDV</th>
                        <th>Client</th>
                        <th>Véhicule</th>
                        <th>Prestation</th>
                        <th>Date & Heure</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="garage-dashboard-table-id">{appointment.id}</td>
                          <td>
                            <div className="garage-dashboard-table-client">
                              <span className="garage-dashboard-table-name">
                                {appointment.client.firstName} {appointment.client.lastName}
                              </span>
                              <span className="garage-dashboard-table-email">
                                {appointment.client.email}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="garage-dashboard-table-vehicle">
                              <span className="garage-dashboard-table-plate">
                                {appointment.vehicle.plate}
                              </span>
                              <span className="garage-dashboard-table-car">
                                {appointment.vehicle.brand} {appointment.vehicle.model}
                              </span>
                            </div>
                          </td>
                          <td>{getServiceName(appointment.service)}</td>
                          <td>
                            <div className="garage-dashboard-table-datetime">
                              <span>
                                {new Date(appointment.date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="garage-dashboard-table-time">
                                {appointment.time}
                              </span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={appointment.status} />
                          </td>
                          <td>
                            <div className="garage-dashboard-table-actions">
                              {appointment.status === 'pending' && (
                                <>
                                  <button
                                    className="garage-dashboard-table-action garage-dashboard-table-action-confirm"
                                    onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                                    title="Confirmer"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                  <button
                                    className="garage-dashboard-table-action garage-dashboard-table-action-refuse"
                                    onClick={() => handleStatusChange(appointment.id, 'refused')}
                                    title="Refuser"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              <button
                                className="garage-dashboard-table-action"
                                onClick={() => handleViewDetail(appointment)}
                                title="Voir détails"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredAppointments.length === 0 && (
                    <div className="garage-dashboard-empty">
                      <Calendar size={48} />
                      <p>Aucun rendez-vous trouvé</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'calendar' && (
            <Card>
              <CardContent className="garage-dashboard-calendar">
                <div className="garage-dashboard-calendar-header">
                  <button 
                    className="garage-dashboard-calendar-nav"
                    onClick={() => navigateDate(-1)}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="garage-dashboard-calendar-title">
                    {currentDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <button 
                    className="garage-dashboard-calendar-nav"
                    onClick={() => navigateDate(1)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="garage-dashboard-calendar-grid">
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
                    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', 
                    '16:00', '16:30', '17:00', '17:30'].map((time) => {
                    const apt = appointments.find(
                      a => a.date === currentDate.toISOString().split('T')[0] && a.time === time
                    );
                    return (
                      <div 
                        key={time} 
                        className={`garage-dashboard-calendar-slot ${apt ? 'has-appointment' : ''}`}
                      >
                        <span className="garage-dashboard-calendar-time">{time}</span>
                        {apt && (
                          <div className="garage-dashboard-calendar-appointment">
                            <span className="garage-calendar-apt-service">
                              {getServiceName(apt.service)}
                            </span>
                            <span className="garage-calendar-apt-client">
                              {apt.client.firstName} {apt.client.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card>
              <CardContent className="garage-dashboard-clients">
                <div className="garage-dashboard-clients-header">
                  <h3>Liste des clients</h3>
                  <Button variant="outline" size="sm">
                    <Plus size={16} />
                    Ajouter un client
                  </Button>
                </div>
                
                <div className="garage-dashboard-clients-list">
                  {Array.from(new Map(appointments.map(a => [a.client.email, a])).values())
                    .map((apt) => (
                      <div key={apt.client.email} className="garage-dashboard-client">
                        <div className="garage-dashboard-client-avatar">
                          {apt.client.firstName.charAt(0)}{apt.client.lastName.charAt(0)}
                        </div>
                        <div className="garage-dashboard-client-info">
                          <span className="garage-dashboard-client-name">
                            {apt.client.firstName} {apt.client.lastName}
                          </span>
                          <span className="garage-dashboard-client-email">
                            {apt.client.email}
                          </span>
                        </div>
                        <div className="garage-dashboard-client-stats">
                          <span>
                            {appointments.filter(a => a.client.email === apt.client.email).length} RDV
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <div className="garage-dashboard-settings">
              <Card>
                <CardContent className="garage-dashboard-setting">
                  <div className="garage-dashboard-setting-header">
                    <h3>Informations du garage</h3>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>
                  <div className="garage-dashboard-setting-content">
                    <div className="garage-dashboard-setting-item">
                      <span className="garage-dashboard-setting-label">Nom</span>
                      <span className="garage-dashboard-setting-value">Garage Auto Pro</span>
                    </div>
                    <div className="garage-dashboard-setting-item">
                      <span className="garage-dashboard-setting-label">Adresse</span>
                      <span className="garage-dashboard-setting-value">123 Rue de la République, 75001 Paris</span>
                    </div>
                    <div className="garage-dashboard-setting-item">
                      <span className="garage-dashboard-setting-label">Téléphone</span>
                      <span className="garage-dashboard-setting-value">01 23 45 67 89</span>
                    </div>
                    <div className="garage-dashboard-setting-item">
                      <span className="garage-dashboard-setting-label">Email</span>
                      <span className="garage-dashboard-setting-value">contact@garageautopro.fr</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="garage-dashboard-setting">
                  <div className="garage-dashboard-setting-header">
                    <h3>Horaires d'ouverture</h3>
                    <Button variant="outline" size="sm">Modifier</Button>
                  </div>
                  <div className="garage-dashboard-setting-content">
                    {[
                      { day: 'Lundi', hours: '08:00 - 18:00' },
                      { day: 'Mardi', hours: '08:00 - 18:00' },
                      { day: 'Mercredi', hours: '08:00 - 18:00' },
                      { day: 'Jeudi', hours: '08:00 - 18:00' },
                      { day: 'Vendredi', hours: '08:00 - 18:00' },
                      { day: 'Samedi', hours: '08:00 - 12:00' },
                      { day: 'Dimanche', hours: 'Fermé' },
                    ].map((item) => (
                      <div key={item.day} className="garage-dashboard-setting-item">
                        <span className="garage-dashboard-setting-label">{item.day}</span>
                        <span className="garage-dashboard-setting-value">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Détails du rendez-vous ${selectedAppointment?.id}`}
        size="lg"
        footer={
          selectedAppointment?.status === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'refused');
                  setIsDetailModalOpen(false);
                }}
              >
                <XCircle size={18} />
                Refuser
              </Button>
              <Button
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'confirmed');
                  setIsDetailModalOpen(false);
                }}
              >
                <CheckCircle size={18} />
                Confirmer
              </Button>
            </>
          )
        }
      >
        {selectedAppointment && (
          <div className="garage-dashboard-modal-content">
            <div className="garage-dashboard-modal-section">
              <h4>Client</h4>
              <p><strong>{selectedAppointment.client.firstName} {selectedAppointment.client.lastName}</strong></p>
              <p>{selectedAppointment.client.email}</p>
              <p>{selectedAppointment.client.phone}</p>
            </div>
            
            <div className="garage-dashboard-modal-section">
              <h4>Véhicule</h4>
              <p><strong>Immatriculation:</strong> {selectedAppointment.vehicle.plate}</p>
              {selectedAppointment.vehicle.brand && (
                <p><strong>Marque:</strong> {selectedAppointment.vehicle.brand}</p>
              )}
              {selectedAppointment.vehicle.model && (
                <p><strong>Modèle:</strong> {selectedAppointment.vehicle.model}</p>
              )}
            </div>
            
            <div className="garage-dashboard-modal-section">
              <h4>Rendez-vous</h4>
              <p><strong>Prestation:</strong> {getServiceName(selectedAppointment.service)}</p>
              <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure:</strong> {selectedAppointment.time}</p>
              <p><strong>Statut:</strong> <StatusBadge status={selectedAppointment.status} /></p>
            </div>
            
            {selectedAppointment.notes && (
              <div className="garage-dashboard-modal-section">
                <h4>Notes</h4>
                <p>{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GarageDashboard;
