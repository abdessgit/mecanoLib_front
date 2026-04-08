import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar, Footer } from './components';
import { AppProvider } from './context/AppContext';
import './App.css';

const Home = lazy(() => import('./pages/Home/Home'));
const Booking = lazy(() => import('./pages/Booking/Booking'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation/BookingConfirmation'));
const ClientLogin = lazy(() => import('./pages/ClientLogin/ClientLogin'));
const ClientRegister = lazy(() => import('./pages/ClientRegister/ClientRegister'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard/ClientDashboard'));
const MotDePasseOublie = lazy(() => import('./components/common/MotDePasseOublie'));
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const GarageLogin = lazy(() => import('./pages/GarageLogin/GarageLogin'));
const GarageRegister = lazy(() => import('./pages/GarageRegister/GarageRegister'));
const GarageDashboard = lazy(() => import('./pages/GarageDashboard/GarageDashboard'));

const ReturnToSiteLink = () => {
  const location = useLocation();

  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="app-return-site">
      <Link to="/" className="app-return-site-link">
        ← Retour au site
      </Link>
    </div>
  );
};

// Layout avec Navbar et Footer
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <ReturnToSiteLink />
    <Footer />
  </>
);

// Layout sans Navbar/Footer (pour le garage)
const CleanLayout = ({ children }) => (
  <>
    {children}
    <ReturnToSiteLink />
  </>
);

const PageLoader = () => (
  <div className="app-loading" role="status" aria-live="polite" aria-label="Chargement de la page">
    <div className="app-loading-spinner" />
  </div>
);

// AnimatedRoutes pour les transitions de page
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
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
            path="/admin/dashboard" 
            element={
              <CleanLayout>
                <AdminDashboard />
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
            path="/mot-de-passe-oublie" 
            element={
              <MainLayout>
                <MotDePasseOublie />
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
      </Suspense>
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
