import { Routes, Route } from "react-router-dom";
import HomePage from "./components/Pages/HomePage";
import AuthPage from "./components/AuthPage/AuthPage";
import DashboardGarage from "./components/dashboard/garage/DashboardGarage";
import Header from "./components/Header/Header";
import ForgetPassword from "./components/AuthPage/ForgetPassword";
import DashboardSuperAdmin from "./components/dashboard/superAdmin/DashboardSuperAdmin";
import DashboardClient from "./components/dashboard/client/DachboardClient";
function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forget-password" element={<ForgetPassword />} />
                <Route path="/dashboardGarage" element={<DashboardGarage />} />
                <Route path="/dashboardClient" element={<DashboardClient />} />
                <Route path="/DashboardSuperAdmin" element={<DashboardSuperAdmin />} />
            </Routes>
        </>
    );
}

export default App;