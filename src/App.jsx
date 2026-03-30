import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar, Footer } from './components';
import { AppProvider } from './context/AppContext';
import { Home, Booking, BookingConfirmation, ClientLogin, ClientRegister, ClientDashboard, AdminLogin, GarageLogin, GarageRegister, GarageDashboard } from './pages';
import './App.css';

// Layout avec Navbar et Footer
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

// Layout sans Navbar/Footer (pour le garage)
const CleanLayout = ({ children }) => (
  <>{children}</>
);

// AnimatedRoutes pour les transitions de page
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          } 
        />
        <Route 
          path="/booking" 
          element={
            <MainLayout>
              <Booking />
            </MainLayout>
          } 
        />
        <Route 
          path="/booking/confirmation" 
          element={
            <MainLayout>
              <BookingConfirmation />
            </MainLayout>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <CleanLayout>
              <AdminLogin />
            </CleanLayout>
          } 
        />
        <Route 
          path="/client" 
          element={
            <MainLayout>
              <ClientLogin />
            </MainLayout>
          } 
        />
        <Route 
          path="/client/register" 
          element={
            <MainLayout>
              <ClientRegister />
            </MainLayout>
          } 
        />
        <Route 
          path="/client/dashboard" 
          element={
            <MainLayout>
              <ClientDashboard />
            </MainLayout>
          } 
        />
        <Route 
          path="/garage" 
          element={
            <CleanLayout>
              <GarageLogin />
            </CleanLayout>
          } 
        />
        <Route 
          path="/garage/register" 
          element={
            <CleanLayout>
              <GarageRegister />
            </CleanLayout>
          } 
        />
        <Route 
          path="/garage/dashboard" 
          element={
            <CleanLayout>
              <GarageDashboard />
            </CleanLayout>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app">
          <AnimatedRoutes />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
