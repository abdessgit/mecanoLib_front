import React from "react";
import Login from "../connexion/login"; // chemin vers ton composant Login
import RegisterForm from "../inscription/InscriptionGarage"; // chemin vers ton composant Inscription
import './AuthPage.css'; // pour le style flex

const AuthPage = () => {
    return (
        <div className="auth-page-container">
            <div className="auth-left">
                <Login />
            </div>
            <div className="auth-right">
                <RegisterForm />
            </div>
        </div>
    );
};

export default AuthPage;