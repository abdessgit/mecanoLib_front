import React from "react";
import Login from "../connexion/login";
import { Link } from "react-router-dom";
import "./AuthPage.css";

const AuthPage = () => {
    return (
        <div className="auth-page-container">
            <div className="">
                <Login />
                <p className="register-link">
                    Vous n’avez pas de compte ?{" "}
                    <Link to="/inscription-garage">Créer un compte</Link>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;