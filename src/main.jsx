import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import './index.css'
import App from './App.jsx'
import InscriptiondGarage from './components/inscription/InscriptionGarage.jsx';
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/inscriptionGarage" element={<InscriptiondGarage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
)