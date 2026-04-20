import React, { useState } from 'react';
import api from '../../services/api';

const defaultHoraires = [
  { day: 'Lundi', hours: '08:00 - 18:00' },
  { day: 'Mardi', hours: '08:00 - 18:00' },
  { day: 'Mercredi', hours: '08:00 - 18:00' },
  { day: 'Jeudi', hours: '08:00 - 18:00' },
  { day: 'Vendredi', hours: '08:00 - 18:00' },
  { day: 'Samedi', hours: '08:00 - 12:00' },
  { day: 'Dimanche', hours: 'Fermé' },
];

const GarageDashboard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [horaires, setHoraires] = useState(defaultHoraires);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = api.getStoredAuth();

  const handleEditClick = () => {
    setIsEditing(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleChange = (idx, value) => {
    setHoraires((prev) => prev.map((h, i) => i === idx ? { ...h, hours: value } : h));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateGarageHoraires(token, { horaires });
      setSuccess('Horaires mis à jour !');
      setIsEditing(false);
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Horaires d'ouverture</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      {!isEditing ? (
        <>
          <div style={{ marginBottom: 16 }}>
            {horaires.map((item, idx) => (
              <div key={item.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{item.day}</span>
                <span>{item.hours}</span>
              </div>
            ))}
          </div>
          <button onClick={handleEditClick}>Modifier</button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            {horaires.map((item, idx) => (
              <div key={item.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{item.day}</span>
                <input
                  type="text"
                  value={item.hours}
                  onChange={e => handleChange(idx, e.target.value)}
                  style={{ width: 160 }}
                  disabled={loading}
                />
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</button>
          <button onClick={handleCancel} disabled={loading} style={{ marginLeft: 8 }}>Annuler</button>
        </>
      )}
    </div>
  );
};

export default GarageDashboard;
import React, { useState } from 'react';
import api from '../../services/api';

const defaultHoraires = [
  { day: 'Lundi', hours: '08:00 - 18:00' },
  { day: 'Mardi', hours: '08:00 - 18:00' },
  { day: 'Mercredi', hours: '08:00 - 18:00' },
  { day: 'Jeudi', hours: '08:00 - 18:00' },
  { day: 'Vendredi', hours: '08:00 - 18:00' },
  { day: 'Samedi', hours: '08:00 - 12:00' },
  { day: 'Dimanche', hours: 'Fermé' },
];

const GarageDashboard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [horaires, setHoraires] = useState(defaultHoraires);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = api.getStoredAuth();

  const handleEditClick = () => {
    setIsEditing(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleChange = (idx, value) => {
    setHoraires((prev) => prev.map((h, i) => i === idx ? { ...h, hours: value } : h));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.updateGarageHoraires(token, { horaires });
      setSuccess('Horaires mis à jour !');
      setIsEditing(false);
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Horaires d'ouverture</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      {!isEditing ? (
        <>
          <div style={{ marginBottom: 16 }}>
            {horaires.map((item, idx) => (
              <div key={item.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{item.day}</span>
                <span>{item.hours}</span>
              </div>
            ))}
          </div>
          <button onClick={handleEditClick}>Modifier</button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            {horaires.map((item, idx) => (
              <div key={item.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{item.day}</span>
                <input
                  type="text"
                  value={item.hours}
                  onChange={e => handleChange(idx, e.target.value)}
                  style={{ width: 160 }}
                  disabled={loading}
                />
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</button>
          <button onClick={handleCancel} disabled={loading} style={{ marginLeft: 8 }}>Annuler</button>
        </>
      )}
    </div>
  );
};

export default GarageDashboard;
import React from 'react';

const GarageDashboard = () => {
  return (
    <div>GarageDashboard minimal</div>
  );
};

export default GarageDashboard;
                  <div className="garage-dashboard-calendar-grid">
  import React, { useState, useEffect } from 'react';
  import api from '../../services/api';

  const defaultHoraires = [
    { day: 'Lundi', hours: '08:00 - 18:00' },
    { day: 'Mardi', hours: '08:00 - 18:00' },
    { day: 'Mercredi', hours: '08:00 - 18:00' },
    { day: 'Jeudi', hours: '08:00 - 18:00' },
    { day: 'Vendredi', hours: '08:00 - 18:00' },
    { day: 'Samedi', hours: '08:00 - 12:00' },
    { day: 'Dimanche', hours: 'Fermé' },
  ];

  const GarageDashboard = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [horaires, setHoraires] = useState(defaultHoraires);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Récupérer le token stocké
    const { token } = api.getStoredAuth();

    // TODO: Remplacer par un vrai fetch des horaires depuis l'API si disponible
    useEffect(() => {
      // Ici, on pourrait charger les horaires depuis l'API si besoin
      // Exemple : api.getGarageHoraires(token).then(...)
    }, [token]);

    const handleEditClick = () => {
      setIsEditing(true);
      setSuccess('');
      setError('');
    };

    const handleCancel = () => {
      setIsEditing(false);
      setError('');
      setSuccess('');
      // Optionnel : recharger les horaires depuis l'API si besoin
    };

    const handleChange = (idx, value) => {
      setHoraires((prev) => prev.map((h, i) => i === idx ? { ...h, hours: value } : h));
    };

    const handleSave = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        // Adapter le format selon l'API attendue
        await api.updateGarageHoraires(token, { horaires });
        setSuccess('Horaires mis à jour !');
        setIsEditing(false);
      } catch (e) {
        setError(e.message || 'Erreur lors de la sauvegarde');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ padding: 24 }}>
        <h2>Horaires d'ouverture</h2>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {success && <div style={{ color: 'green' }}>{success}</div>}
        {!isEditing ? (
          <>
            <div style={{ marginBottom: 16 }}>
              {horaires.map((item, idx) => (
                <div key={item.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{item.day}</span>
                  <span>{item.hours}</span>
                </div>
              ))}
            </div>
            <button onClick={handleEditClick}>Modifier</button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              {horaires.map((item, idx) => (
                <div key={item.day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{item.day}</span>
                  <input
                    type="text"
                    value={item.hours}
                    onChange={e => handleChange(idx, e.target.value)}
                    style={{ width: 160 }}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={loading}>{loading ? 'Sauvegarde...' : 'Enregistrer'}</button>
            <button onClick={handleCancel} disabled={loading} style={{ marginLeft: 8 }}>Annuler</button>
          </>
        )}
      </div>
    );
  };

  export default GarageDashboard;
            <>
              <Button
                variant="outline"
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'refused');
                }}
              >
                Refuser
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleStatusChange(selectedAppointment.id, 'confirmed');
                }}
              >
                Confirmer
              </Button>
            </>
          )
        }
      >
        {selectedAppointment && (
          <div>
            <h4>Détails du rendez-vous</h4>
            <p><b>Client :</b> {selectedAppointment.client.firstName} {selectedAppointment.client.lastName}</p>
            <p><b>Véhicule :</b> {selectedAppointment.vehicle.brand} {selectedAppointment.vehicle.model} ({selectedAppointment.vehicle.plate})</p>
            <p><b>Date :</b> {new Date(selectedAppointment.date).toLocaleDateString('fr-FR')} à {selectedAppointment.time}</p>
            <p><b>Prestation :</b> {getServiceName(selectedAppointment.service)}</p>
            <p><b>Statut :</b> <StatusBadge status={selectedAppointment.status} /></p>
          </div>
        )}
      </Modal>
    </div>
  );
};


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
