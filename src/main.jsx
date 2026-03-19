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
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'
import PlaceholderPage from './components/common/PlaceholderPage.jsx'
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
                        <Route path="/rendez-vous/new" element={<ProtectedRoute allowedRoles={["client"]}><PlaceholderPage title="Prise de rendez-vous" description="Ce module sera bientot disponible. Vous pouvez deja consulter votre dashboard et vos rendez-vous existants." /></ProtectedRoute>} />
                        <Route path="/garages" element={<ProtectedRoute><PlaceholderPage title="Recherche de garages" description="La recherche de garages est en preparation. Revenez bientot pour filtrer les garages par ville, services et avis." /></ProtectedRoute>} />
                        <Route path="/client/rendez-vous" element={<ProtectedRoute allowedRoles={["client"]}><PlaceholderPage title="Tous mes rendez-vous" description="La vue complete des rendez-vous arrive prochainement." /></ProtectedRoute>} />
                        <Route path="/client/devis" element={<ProtectedRoute allowedRoles={["client"]}><PlaceholderPage title="Mes devis" description="Le suivi des devis est en preparation." /></ProtectedRoute>} />
                        <Route path="/client/factures" element={<ProtectedRoute allowedRoles={["client"]}><PlaceholderPage title="Mes factures" description="La consultation des factures sera disponible bientot." /></ProtectedRoute>} />
                        <Route path="/client/profil" element={<ProtectedRoute allowedRoles={["client"]}><PlaceholderPage title="Mon profil" description="La mise a jour du profil est en cours de developpement." /></ProtectedRoute>} />
                        <Route path="/mot-de-passe-oublie" element={<GuestRoute><PlaceholderPage title="Mot de passe oublie" description="Le parcours de reinitialisation sera disponible bientot." /></GuestRoute>} />
                        <Route path="/mentions-legales" element={<PlaceholderPage title="Mentions legales" description="Les mentions legales seront publiees ici." />} />
                        <Route path="/cgu" element={<PlaceholderPage title="Conditions generales d'utilisation" description="Les CGU seront disponibles sur cette page." />} />
                        <Route path="/confidentialite" element={<PlaceholderPage title="Politique de confidentialite" description="La politique de confidentialite sera publiee ici." />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </BrowserRouter>
    </StrictMode>
)