import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom"

import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import Inscription from './components/inscription/Inscription.jsx'
import ConnexionGarage from './components/connexion/ConnexionGarage.jsx'
import DashboardClient from './components/Dashboard/DashboardClient.jsx'
import DashboardGarage from './components/Dashboard/DashboardGarage.jsx'
import DashboardSuperAdmin from './components/Dashboard/DashboardSuperAdmin.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import PlaceholderPage from './components/common/PlaceholderPage.jsx'
import RendezVousNew from './components/client/RendezVousNew.jsx'
import RechercheGarages from './components/client/RechercheGarages.jsx'
import TousRendezVous from './components/client/TousRendezVous.jsx'
import MesDevis from './components/client/MesDevis.jsx'
import MesFactures from './components/client/MesFactures.jsx'
import MonProfil from './components/client/MonProfil.jsx'
import MotDePasseOublie from './components/common/MotDePasseOublie.jsx'
import MentionsLegales from './components/common/MentionsLegales.jsx'
import CGU from './components/common/CGU.jsx'
import Confidentialite from './components/common/Confidentialite.jsx'
import { GuestRoute, ProtectedRoute } from './components/auth/RouteGuards.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <div className="d-flex flex-column min-vh-100">
                <Header />
                <div className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<App />} />
                        <Route path="/inscription" element={<GuestRoute><Inscription /></GuestRoute>} />
                        <Route path="/inscriptionClient" element={<Navigate to="/inscription" replace />} />
                        <Route path="/inscriptionGarage" element={<Navigate to="/inscription" replace />} />
                        <Route path="/connexion" element={<GuestRoute><ConnexionGarage /></GuestRoute>} />
                        <Route path="/connexionGarage" element={<GuestRoute><ConnexionGarage /></GuestRoute>} />
                        <Route path="/dashboardClient" element={<ProtectedRoute allowedRoles={["client"]}><DashboardClient /></ProtectedRoute>} />
                        <Route path="/dashboardGarage" element={<ProtectedRoute allowedRoles={["garage"]}><DashboardGarage /></ProtectedRoute>} />
                        <Route path="/dashboardSuperAdmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><DashboardSuperAdmin /></ProtectedRoute>} />
                        <Route path="/rendez-vous/new" element={<ProtectedRoute allowedRoles={["client"]}><RendezVousNew /></ProtectedRoute>} />
                        <Route path="/garages" element={<ProtectedRoute><RechercheGarages /></ProtectedRoute>} />
                        <Route path="/client/rendez-vous" element={<ProtectedRoute allowedRoles={["client"]}><TousRendezVous /></ProtectedRoute>} />
                        <Route path="/client/devis" element={<ProtectedRoute allowedRoles={["client"]}><MesDevis /></ProtectedRoute>} />
                        <Route path="/client/factures" element={<ProtectedRoute allowedRoles={["client"]}><MesFactures /></ProtectedRoute>} />
                        <Route path="/client/profil" element={<ProtectedRoute allowedRoles={["client"]}><MonProfil /></ProtectedRoute>} />
                        <Route path="/mot-de-passe-oublie" element={<GuestRoute><MotDePasseOublie /></GuestRoute>} />
                        <Route path="/mentions-legales" element={<MentionsLegales />} />
                        <Route path="/cgu" element={<CGU />} />
                        <Route path="/confidentialite" element={<Confidentialite />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </BrowserRouter>
    </StrictMode>
)