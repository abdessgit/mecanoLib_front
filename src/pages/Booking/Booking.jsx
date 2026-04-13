import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calendar, 
  Clock, 
  User, 
  Car, 
  FileText,
  Droplets,
  Circle,
  Cpu,
  Battery,
  Shield,
  Wrench,
  ArrowRight,
  MapPin,
  Phone,
  Globe,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, TimeSlot, Card, CardContent } from '../../components';
import { useApp } from '../../context/AppContext';
import './Booking.css';

const bookingCategories = [
  {
    id: 'pneumatique-tenue-route',
    name: 'Pneumatique & tenue de route',
    icon: Circle,
    prestations: [
      'Pneus',
      'Équilibrage',
      'Parallélisme',
      'Géométrie',
      'Trains roulants',
      'Amortisseurs',
      'Triangles de suspension',
      'Rotules',
      'Pneumatique et tenue de route des véhicules de collection',
    ],
  },
  {
    id: 'freinage-securite',
    name: 'Freinage & sécurité',
    icon: Shield,
    prestations: [
      'Plaquettes de frein',
      'Disques de frein',
      'Frein à main',
      'Freinage et sécurité des véhicules de collection',
    ],
  },
  {
    id: 'mecanique-diagnostics',
    name: 'Mécanique & diagnostics',
    icon: Cpu,
    prestations: [
      'Diagnostic mécanique',
      'Distribution',
      'Démarrage / Allumage',
      'Embrayage',
      'Boîte de vitesse',
      'Échappement',
      'Mécanique et Diagnostic des voitures de collection',
    ],
  },
  {
    id: 'entretien-revision',
    name: 'Entretien & révision',
    icon: Droplets,
    prestations: [
      'Vidange',
      'Révision',
      'Révision constructeur',
      'Batterie',
      'Top Glass : réparation et remplacement pare-brise',
      'Éclairage',
      'Climatisation',
      'Diagnostic entretien',
      'Balais d’essuie-glaces',
      'Vidange de la boîte de vitesse',
      'Entretien des véhicules utilitaires',
      'Entretenez votre ancienne',
    ],
  },
  {
    id: 'electrique-hybride',
    name: 'Électrique & Hybride',
    icon: Battery,
    prestations: [
      'Réparation et entretien des véhicules électriques et hybrides',
      'Nos prestations pour les véhicules électriques et hybrides',
      'Nos solutions de recharge',
    ],
  },
];

const prestationsListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const prestationItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const Booking = () => {
  const navigate = useNavigate();
  const { createAppointment, updateBookingStep } = useApp();
  
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(bookingCategories[0].id);
  const [hoveredCategory, setHoveredCategory] = useState(bookingCategories[0].id);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    plate: '',
    brand: '',
    model: '',
    year: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Garage step state ---
  const [city, setCity] = useState('');
  const [garages, setGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [garageLoading, setGarageLoading] = useState(false);
  const [garageError, setGarageError] = useState('');

  const activeCategory = bookingCategories.find(
    (cat) => cat.id === (hoveredCategory || selectedCategory)
  ) || bookingCategories[0];

  // Générer les dates des 14 prochains jours
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        fullLabel: date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        }),
      });
    }
    return dates;
  };

  const availableDates = generateDates();

  // Obtenir les créneaux pour la date sélectionnée
  const getTimeSlotsForDate = () => {
    // Simulation: retourner des créneaux aléatoires
    const slots = [];
    const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                   '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    times.forEach(time => {
      slots.push({
        time,
        available: Math.random() > 0.3,
      });
    });
    return slots;
  };

  const currentTimeSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setHoveredCategory(categoryId);
    if (selectedService && selectedService.category !== categoryId) {
      setSelectedService(null);
    }
  };

  const handleServiceSelect = (serviceName, categoryId, index) => {
    setSelectedService({
      id: `${categoryId}-${index}`,
      name: serviceName,
      duration: 60,
      category: categoryId,
    });
  };

  // --- Overpass API : recherche garages par ville ---
  const searchGarages = async () => {
    if (!city.trim()) return;
    setGarageLoading(true);
    setGarageError('');
    setGarages([]);
    setSelectedGarage(null);
    try {
      // 1. Géocoder la ville via Nominatim (OSM - gratuit)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const geoData = await geoRes.json();
      if (!geoData.length) {
        setGarageError('Ville introuvable. Vérifiez le nom et réessayez.');
        setGarageLoading(false);
        return;
      }
      const { lat, lon } = geoData[0];
      const radius = 10000; // 10 km
      // 2. Chercher les garages via Overpass API (OSM - gratuit)
      const query = `[out:json][timeout:15];
(
  node["shop"="car_repair"](around:${radius},${lat},${lon});
  way["shop"="car_repair"](around:${radius},${lat},${lon});
);
out center 20;`;
      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const overpassData = await overpassRes.json();
      const results = overpassData.elements.map((el) => ({
        id: el.id,
        name: el.tags?.name || 'Garage sans nom',
        address: [
          el.tags?.['addr:housenumber'],
          el.tags?.['addr:street'],
          el.tags?.['addr:city'] || city,
        ]
          .filter(Boolean)
          .join(' ') || city,
        phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
        website: el.tags?.website || el.tags?.['contact:website'] || '',
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
      }));
      if (!results.length) {
        setGarageError('Aucun garage trouvé dans cette ville. Essayez une ville voisine.');
      }
      setGarages(results);
    } catch {
      setGarageError('Erreur lors de la recherche. Vérifiez votre connexion.');
    } finally {
      setGarageLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1 && selectedService) {
      setStep(2);
      updateBookingStep(2, { service: selectedService });
    } else if (step === 2 && selectedGarage) {
      setStep(3);
      updateBookingStep(3, { garage: selectedGarage });
    } else if (step === 3 && selectedDate && selectedTime) {
      setStep(4);
      updateBookingStep(4, { date: selectedDate, time: selectedTime });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const appointment = createAppointment({
      service: selectedService.id,
      date: selectedDate,
      time: selectedTime,
      client: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      vehicle: {
        plate: formData.plate,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
      },
      notes: formData.notes,
    });
    
    setIsSubmitting(false);
    navigate('/booking/confirmation', { state: { appointment } });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedGarage !== null;
      case 3:
        return selectedDate !== '' && selectedTime !== '';
      case 4:
        return (
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.plate
        );
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, label: 'Prestation', icon: Wrench },
    { number: 2, label: 'Garage', icon: MapPin },
    { number: 3, label: 'Date & Heure', icon: Calendar },
    { number: 4, label: 'Vos infos', icon: User },
  ];

  return (
    <div className="booking">
      <div className="booking-container">
        {/* Header */}
        <div className="booking-header">
          <h1 className="booking-title">Prendre rendez-vous</h1>
          <p className="booking-subtitle">
            Réservez votre créneau en quelques étapes simples
          </p>
        </div>

        {/* Progress Steps */}
        <div className="booking-progress">
          {steps.map((s, index) => (
            <div 
              key={s.number}
              className={`booking-progress-step ${
                step === s.number ? 'active' : ''
              } ${step > s.number ? 'completed' : ''}`}
            >
              <div className="booking-progress-icon">
                {step > s.number ? <Check size={18} /> : <s.icon size={18} />}
              </div>
              <span className="booking-progress-label">{s.label}</span>
              {index < steps.length - 1 && (
                <div className={`booking-progress-line ${step > s.number ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="booking-content">
          <AnimatePresence mode="wait">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">
                      Choisissez d'abord la catégorie, puis la prestation
                    </h2>
                    <p className="booking-step-intro">
                      1. Passez la souris sur une catégorie pour voir ses prestations. 2. Cliquez sur la prestation souhaitée.
                    </p>

                    <div className="booking-category-layout">
                      <div className="booking-categories-grid">
                        {bookingCategories.map((cat) => {
                          const Icon = cat.icon;
                          const isActive = (hoveredCategory || selectedCategory) === cat.id;
                          return (
                            <button
                              key={cat.id}
                              className={`booking-category-card ${isActive ? 'active' : ''}`}
                              onMouseEnter={() => setHoveredCategory(cat.id)}
                              onFocus={() => setHoveredCategory(cat.id)}
                              onClick={() => handleCategorySelect(cat.id)}
                              type="button"
                            >
                              <span className="booking-category-card-icon">
                                <Icon size={18} />
                              </span>
                              <span className="booking-category-card-label">{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="booking-prestations-panel">
                        <h3 className="booking-step-group-title">Prestations</h3>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeCategory.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          >
                            <p className="booking-prestations-subtitle">{activeCategory.name}</p>
                            <motion.div
                              className="booking-prestations-list"
                              variants={prestationsListVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {activeCategory.prestations.map((serviceName, index) => {
                                const serviceId = `${activeCategory.id}-${index}`;
                                const isSelected = selectedService?.id === serviceId;

                                return (
                                  <motion.button
                                    key={serviceId}
                                    className={`booking-prestation-item ${isSelected ? 'active' : ''}`}
                                    type="button"
                                    onClick={() => handleServiceSelect(serviceName, activeCategory.id, index)}
                                    variants={prestationItemVariants}
                                  >
                                    {serviceName}
                                  </motion.button>
                                );
                              })}
                            </motion.div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Choix du garage */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">Choisissez votre garage</h2>
                    <div className="booking-summary">
                      <div className="booking-summary-item">
                        <Wrench size={16} />
                        <span>{selectedService?.name}</span>
                      </div>
                    </div>

                    {/* Recherche par ville */}
                    <div className="booking-garage-search">
                      <label className="booking-section-title">
                        <MapPin size={18} /> Votre ville
                      </label>
                      <div className="booking-garage-search-row">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchGarages()}
                          placeholder="Ex: Paris, Lyon, Marseille..."
                          className="booking-garage-input"
                        />
                        <button
                          type="button"
                          className="booking-garage-search-btn"
                          onClick={searchGarages}
                          disabled={garageLoading || !city.trim()}
                        >
                          {garageLoading ? (
                            <span className="booking-garage-spinner" />
                          ) : (
                            <Search size={18} />
                          )}
                          Rechercher
                        </button>
                      </div>
                    </div>

                    {/* Erreur */}
                    {garageError && (
                      <p className="booking-garage-error">{garageError}</p>
                    )}

                    {/* Résultats */}
                    {garages.length > 0 && (
                      <div className="booking-garage-list">
                        <p className="booking-garage-count">{garages.length} garage{garages.length > 1 ? 's' : ''} trouvé{garages.length > 1 ? 's' : ''} près de <strong>{city}</strong></p>
                        <AnimatePresence>
                          {garages.map((garage, i) => (
                            <motion.button
                              key={garage.id}
                              type="button"
                              className={`booking-garage-card ${selectedGarage?.id === garage.id ? 'active' : ''}`}
                              onClick={() => setSelectedGarage(garage)}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                            >
                              <div className="booking-garage-card-icon">
                                <Wrench size={20} />
                              </div>
                              <div className="booking-garage-card-info">
                                <span className="booking-garage-card-name">{garage.name}</span>
                                {garage.address && (
                                  <span className="booking-garage-card-address">
                                    <MapPin size={12} /> {garage.address}
                                  </span>
                                )}
                                <div className="booking-garage-card-meta">
                                  {garage.phone && (
                                    <span><Phone size={12} /> {garage.phone}</span>
                                  )}
                                  {garage.website && (
                                    <span><Globe size={12} /> Site web</span>
                                  )}
                                </div>
                              </div>
                              {selectedGarage?.id === garage.id && (
                                <span className="booking-garage-card-check"><Check size={16} /></span>
                              )}
                            </motion.button>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">
                      Sélectionnez une date et un horaire
                    </h2>

                    {/* Selected Service Summary */}
                    <div className="booking-summary">
                      <div className="booking-summary-item">
                        <Wrench size={16} />
                        <span>{selectedService?.name}</span>
                      </div>
                      <div className="booking-summary-item">
                        <Clock size={16} />
                        <span>{selectedService?.duration} min</span>
                      </div>
                    </div>

                    {/* Date Selection */}
                    <div className="booking-date-section">
                      <h3 className="booking-section-title">
                        <Calendar size={18} />
                        Date
                      </h3>
                      <div className="booking-dates">
                        {availableDates.map((date) => (
                          <button
                            key={date.value}
                            className={`booking-date ${
                              selectedDate === date.value ? 'active' : ''
                            }`}
                            onClick={() => handleDateSelect(date.value)}
                          >
                            <span className="booking-date-day">
                              {date.label.split(' ')[0]}
                            </span>
                            <span className="booking-date-num">
                              {date.label.split(' ')[1]}
                            </span>
                            <span className="booking-date-month">
                              {date.label.split(' ')[2]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && (
                      <div className="booking-time-section">
                        <h3 className="booking-section-title">
                          <Clock size={18} />
                          Horaire
                        </h3>
                        <div className="booking-times">
                          {currentTimeSlots.map((slot) => (
                            <TimeSlot
                              key={slot.time}
                              time={slot.time}
                              available={slot.available}
                              selected={selectedTime === slot.time}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Client Info */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="booking-step"
              >
                <Card>
                  <CardContent className="booking-step-content">
                    <h2 className="booking-step-title">
                      Vos informations
                    </h2>

                    {/* Summary */}
                    <div className="booking-summary booking-summary-full">
                      <div className="booking-summary-item">
                        <Wrench size={16} />
                        <span>{selectedService?.name}</span>
                      </div>
                      {selectedGarage && (
                        <div className="booking-summary-item">
                          <MapPin size={16} />
                          <span>{selectedGarage.name}</span>
                        </div>
                      )}
                      <div className="booking-summary-item">
                        <Calendar size={16} />
                        <span>
                          {new Date(selectedDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="booking-summary-item">
                        <Clock size={16} />
                        <span>{selectedTime}</span>
                      </div>
                    </div>

                    {/* Form */}
                    <div className="booking-form">
                      <div className="booking-form-section">
                        <h3 className="booking-form-section-title">
                          <User size={18} />
                          Coordonnées
                        </h3>
                        <div className="booking-form-grid">
                          <Input
                            label="Prénom"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            placeholder="Jean"
                          />
                          <Input
                            label="Nom"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            placeholder="Dupont"
                          />
                        </div>
                        <div className="booking-form-grid">
                          <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="jean.dupont@email.com"
                          />
                          <Input
                            label="Téléphone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            placeholder="06 12 34 56 78"
                          />
                        </div>
                      </div>

                      <div className="booking-form-section">
                        <h3 className="booking-form-section-title">
                          <Car size={18} />
                          Véhicule
                        </h3>
                        <Input
                          label="Immatriculation"
                          name="plate"
                          value={formData.plate}
                          onChange={handleInputChange}
                          required
                          placeholder="AB-123-CD"
                          helperText="Format: AB-123-CD"
                        />
                        <div className="booking-form-grid">
                          <Input
                            label="Marque"
                            name="brand"
                            value={formData.brand}
                            onChange={handleInputChange}
                            placeholder="Renault"
                          />
                          <Input
                            label="Modèle"
                            name="model"
                            value={formData.model}
                            onChange={handleInputChange}
                            placeholder="Clio"
                          />
                          <Input
                            label="Année"
                            name="year"
                            type="number"
                            value={formData.year}
                            onChange={handleInputChange}
                            placeholder="2020"
                          />
                        </div>
                      </div>

                      <div className="booking-form-section">
                        <h3 className="booking-form-section-title">
                          <FileText size={18} />
                          Notes (optionnel)
                        </h3>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Décrivez votre problème ou ajoutez des précisions..."
                          className="booking-textarea"
                          rows={4}
                        />
                      </div>

                      <div className="booking-consent">
                        <label className="booking-consent-label">
                          <input type="checkbox" required />
                          <span>
                            J'accepte que mes données soient traitées conformément à la{' '}
                            <a href="#">politique de confidentialité</a>
                          </span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="booking-navigation">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="booking-nav-button"
            >
              <ChevronLeft size={18} />
              Retour
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="booking-nav-button booking-nav-button-next"
            >
              Continuer
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              loading={isSubmitting}
              className="booking-nav-button booking-nav-button-submit"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Confirmer ma demande'}
              {!isSubmitting && <ArrowRight size={18} />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
