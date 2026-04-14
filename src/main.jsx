import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";

import './index.css';
import App from './App.jsx';
import { AuthProvider } from './components/connexion/AuthConnexion.jsx';
import { AppProvider } from './context/AppContext.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <AppProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </AppProvider>
        </AuthProvider>
    </StrictMode>
);