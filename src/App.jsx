import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import PlaceholderPage from "./components/common/PlaceholderPage";
import { GuestRoute, ProtectedRoute } from "./components/auth/RouteGuards";
import TopHeader from "./components/layout/TopHeader";
import MainNavbar from "./components/layout/MainNavbar";
import Footer from "./components/layout/Footer";
import "./App.css";

const HomePage = lazy(() => import("./components/Pages/HomePage"));
const AuthPage = lazy(() => import("./components/AuthPage/AuthPage"));
const DashboardGarage = lazy(() => import("./components/Dashboard/garage/DashboardGarage"));
const ForgetPassword = lazy(() => import("./components/AuthPage/ForgetPassword"));
const ResetPassword = lazy(() => import("./components/AuthPage/ResetPassword"));
const DashboardSuperAdmin = lazy(() => import("./components/Dashboard/SuperAdmin/DashboardSuperAdmin"));
const DashboardClient = lazy(() => import("./components/Dashboard/DashboardClient"));
const BookingPage = lazy(() => import("./components/Pages/BookingPage"));
const RechercheGarages = lazy(() => import("./components/client/RechercheGarages"));
const TousRendezVous = lazy(() => import("./components/client/TousRendezVous"));
const MesDevis = lazy(() => import("./components/client/MesDevis"));
const MesFactures = lazy(() => import("./components/client/MesFactures"));
const MonProfil = lazy(() => import("./components/client/MonProfil"));
const LegalPage = lazy(() => import("./components/common/LegalPage"));

function PageLoader() {
    return (
        <div className="container py-5 text-center text-muted" role="status" aria-live="polite">
            Chargement en cours...
        </div>
    )
}

function AppLayout() {
    return (
        <div className="app-shell">
            <TopHeader />
            <MainNavbar />
            <main className="app-content">
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />

                <Route path="/auth" element={<GuestRoute><AuthPage /></GuestRoute>} />
                <Route path="/connexion" element={<Navigate to="/auth" replace />} />
                <Route path="/inscription" element={<Navigate to="/auth" replace />} />
                <Route path="/client" element={<Navigate to="/auth" replace />} />
                <Route path="/garage" element={<Navigate to="/auth" replace />} />
                <Route path="/admin" element={<Navigate to="/auth" replace />} />
                <Route path="/client/register" element={<Navigate to="/auth" replace />} />
                <Route path="/garage/register" element={<Navigate to="/auth" replace />} />

                <Route path="/forget-password" element={<GuestRoute><ForgetPassword /></GuestRoute>} />
                <Route path="/mot-de-passe-oublie" element={<Navigate to="/forget-password" replace />} />
                <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

                <Route path="/booking" element={<BookingPage />} />
                <Route path="/rendez-vous/new" element={<Navigate to="/booking" replace />} />

                <Route path="/dashboardGarage" element={<ProtectedRoute allowedRoles={["garage"]}><DashboardGarage /></ProtectedRoute>} />
                <Route path="/dashboardClient" element={<ProtectedRoute allowedRoles={["client"]}><DashboardClient /></ProtectedRoute>} />
                <Route path="/dashboardSuperAdmin" element={<ProtectedRoute allowedRoles={["super_admin"]}><DashboardSuperAdmin /></ProtectedRoute>} />
                <Route path="/DashboardSuperAdmin" element={<Navigate to="/dashboardSuperAdmin" replace />} />

                <Route path="/garages" element={<RechercheGarages />} />
                <Route path="/client/rendez-vous" element={<ProtectedRoute allowedRoles={["client"]}><TousRendezVous /></ProtectedRoute>} />
                <Route path="/client/devis" element={<ProtectedRoute allowedRoles={["client"]}><MesDevis /></ProtectedRoute>} />
                <Route path="/client/factures" element={<ProtectedRoute allowedRoles={["client"]}><MesFactures /></ProtectedRoute>} />
                <Route path="/client/profil" element={<ProtectedRoute allowedRoles={["client"]}><MonProfil /></ProtectedRoute>} />

                <Route
                    path="/mentions-legales"
                    element={<LegalPage type="mentions" />}
                />
                <Route
                    path="/cgu"
                    element={<LegalPage type="cgu" />}
                />
                <Route
                    path="/confidentialite"
                    element={<LegalPage type="privacy" />}
                />

                <Route
                    path="*"
                    element={<PlaceholderPage title="Page introuvable" description="Le lien demandé n'existe pas encore ou a été déplacé." />}
                />
            </Route>
        </Routes>
    );
}

export default App;