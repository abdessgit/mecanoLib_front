import React, { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [garageAuth, setGarageAuth] = useState({ user: null });

  const logoutGarage = useCallback(() => {
    setGarageAuth({ user: null });
    setAppointments([]);
  }, []);

  const updateAppointmentStatus = useCallback((appointmentId, newStatus) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        appointments,
        setAppointments,
        garageAuth,
        setGarageAuth,
        logoutGarage,
        updateAppointmentStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
};
