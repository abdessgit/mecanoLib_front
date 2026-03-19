import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import './index.css';
import App from './App.jsx';
import Login from './components/connexion/login.jsx';
import InscriptionGarage from './components/inscription/InscriptionGarage.jsx';
import DashboardGarage from './components/dashboard/garage/DashboardGarage.jsx';

import { AuthProvider } from './components/connexion/AuthConnexion.jsx';


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/inscriptionGarage" element={<InscriptionGarage />} />
                    <Route path="/dashboardGarage" element={<DashboardGarage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
);