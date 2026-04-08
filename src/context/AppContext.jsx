/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { services, appointments as mockAppointments, garageInfo, garageStats } from '../data/mockData';
import { isValidEmailFormat } from '../services/api';

const AppContext = createContext();

const CLIENTS_STORAGE_KEY = 'mecanolib_clients';
const CLIENT_AUTH_STORAGE_KEY = 'mecanolib_client_auth';
const APPOINTMENTS_STORAGE_KEY = 'mecanolib_appointments';

const loadStoredValue = (key, fallbackValue) => {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const saveStoredValue = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // État des rendez-vous
  const [appointments, setAppointments] = useState(() =>
    loadStoredValue(APPOINTMENTS_STORAGE_KEY, mockAppointments)
  );
  
  // État du processus de réservation
  const [bookingState, setBookingState] = useState({
    step: 1,
    service: null,
    date: null,
    time: null,
    clientInfo: null,
  });

  // État de l'authentification garage
  const [garageAuth, setGarageAuth] = useState({
    isAuthenticated: false,
    user: null,
  });

  const [registeredClients, setRegisteredClients] = useState(() =>
    loadStoredValue(CLIENTS_STORAGE_KEY, [])
  );

  const [clientAuth, setClientAuth] = useState(() =>
    loadStoredValue(CLIENT_AUTH_STORAGE_KEY, {
      isAuthenticated: false,
      user: null,
    })
  );

  // Réinitialiser le processus de réservation
  const resetBooking = useCallback(() => {
    setBookingState({
      step: 1,
      service: null,
      date: null,
      time: null,
      clientInfo: null,
    });
  }, []);

  // Mettre à jour une étape de la réservation
  const updateBookingStep = useCallback((step, data) => {
    setBookingState((prev) => ({
      ...prev,
      step,
      ...data,
    }));
  }, []);

  // Créer un nouveau rendez-vous
  const createAppointment = useCallback((appointmentData) => {
    const requestedGarageId = String(appointmentData?.garageId ?? appointmentData?.garage?.id ?? '');

    const alreadyReserved = appointments.some((appointment) => {
      const isBlockedStatus = !['cancelled_client', 'cancelled_garage', 'refused'].includes(String(appointment?.status || ''));
      const currentGarageId = String(appointment?.garageId ?? appointment?.garage?.id ?? '');

      return isBlockedStatus
        && currentGarageId === requestedGarageId
        && appointment?.date === appointmentData?.date
        && appointment?.time === appointmentData?.time;
    });

    if (alreadyReserved) {
      throw new Error('Ce créneau est déjà réservé.');
    }

    const newAppointment = {
      id: appointmentData?.id || `RDV-${String(appointments.length + 1).padStart(3, '0')}`,
      ...appointmentData,
      status: appointmentData?.status || 'reserved',
      createdAt: new Date().toISOString(),
    };

    const nextAppointments = [newAppointment, ...appointments];
    setAppointments(nextAppointments);
    saveStoredValue(APPOINTMENTS_STORAGE_KEY, nextAppointments);
    return newAppointment;
  }, [appointments]);

  // Mettre à jour le statut d'un rendez-vous
  const updateAppointmentStatus = useCallback((appointmentId, newStatus) => {
    setAppointments((prev) => {
      const nextAppointments = prev.map((apt) => (
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      saveStoredValue(APPOINTMENTS_STORAGE_KEY, nextAppointments);
      return nextAppointments;
    });
  }, []);

  // Connexion garage
  const loginGarage = useCallback((credentials) => {
    // Simulation d'authentification
    if (credentials.email === 'garage@mecanolib.fr' && credentials.password === 'password') {
      setGarageAuth({
        isAuthenticated: true,
        user: {
          id: '1',
          name: 'Garage Auto Pro',
          email: credentials.email,
          role: 'garage',
        },
      });
      return true;
    }
    return false;
  }, []);

  // Déconnexion garage
  const logoutGarage = useCallback(() => {
    setGarageAuth({
      isAuthenticated: false,
      user: null,
    });
  }, []);

  const registerClient = useCallback((clientData) => {
    const normalizedEmail = clientData.email.trim().toLowerCase();

    if (!isValidEmailFormat(normalizedEmail)) {
      return {
        success: false,
        message: 'Merci de saisir une adresse email valide.',
      };
    }
    const existingClient = registeredClients.find(
      (client) => client.email.toLowerCase() === normalizedEmail
    );

    if (existingClient) {
      return {
        success: false,
        message: 'Un compte existe deja avec cette adresse email.',
      };
    }

    const newClient = {
      id: `CLIENT-${Date.now()}`,
      firstName: clientData.firstName.trim(),
      lastName: clientData.lastName.trim(),
      email: normalizedEmail,
      phone: clientData.phone.trim(),
      password: clientData.password,
      location: {
        city: clientData.city?.trim() || '',
        postalCode: clientData.postalCode?.trim() || '',
        address: clientData.address?.trim() || '',
        codeInsee: clientData.codeInsee?.trim() || '',
      },
      vehicle: {
        plate: clientData.plate?.trim() || '',
        brand: clientData.brand?.trim() || '',
        model: clientData.model?.trim() || '',
      },
      createdAt: new Date().toISOString(),
      onboardingEmailSentAt: new Date().toISOString(),
    };

    const nextClients = [...registeredClients, newClient];
    setRegisteredClients(nextClients);
    saveStoredValue(CLIENTS_STORAGE_KEY, nextClients);

    const nextAuth = {
      isAuthenticated: true,
      user: {
        id: newClient.id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
        phone: newClient.phone,
        location: newClient.location,
        vehicle: newClient.vehicle,
        onboardingEmailSentAt: newClient.onboardingEmailSentAt,
      },
    };

    setClientAuth(nextAuth);
    saveStoredValue(CLIENT_AUTH_STORAGE_KEY, nextAuth);

    return {
      success: true,
      client: nextAuth.user,
      message: 'Inscription validee. Un email de bienvenue a ete prepare.',
    };
  }, [registeredClients]);

  const loginClient = useCallback((credentials) => {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const matchedClient = registeredClients.find(
      (client) => client.email.toLowerCase() === normalizedEmail && client.password === credentials.password
    );

    if (!matchedClient) {
      return {
        success: false,
        message: 'Email ou mot de passe incorrect.',
      };
    }

    const nextAuth = {
      isAuthenticated: true,
      user: {
        id: matchedClient.id,
        firstName: matchedClient.firstName,
        lastName: matchedClient.lastName,
        email: matchedClient.email,
        phone: matchedClient.phone,
        location: matchedClient.location,
        vehicle: matchedClient.vehicle,
        onboardingEmailSentAt: matchedClient.onboardingEmailSentAt,
      },
    };

    setClientAuth(nextAuth);
    saveStoredValue(CLIENT_AUTH_STORAGE_KEY, nextAuth);

    return {
      success: true,
      client: nextAuth.user,
    };
  }, [registeredClients]);

  const logoutClient = useCallback(() => {
    const nextAuth = {
      isAuthenticated: false,
      user: null,
    };

    setClientAuth(nextAuth);
    saveStoredValue(CLIENT_AUTH_STORAGE_KEY, nextAuth);
  }, []);

  // Valeur du contexte
  const value = {
    // Données
    services,
    appointments,
    garageInfo,
    garageStats,
    registeredClients,
    
    // État de réservation
    bookingState,
    resetBooking,
    updateBookingStep,
    
    // Actions rendez-vous
    createAppointment,
    updateAppointmentStatus,
    
    // Authentification
    garageAuth,
    loginGarage,
    logoutGarage,
    clientAuth,
    registerClient,
    loginClient,
    logoutClient,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
