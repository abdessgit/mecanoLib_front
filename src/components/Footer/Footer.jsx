import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";
import "./Footer.css";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">

                <div className="footer-main">


                    <div className="footer-brand">
                        <Link to="/HomePage" className="footer-logo">
                            <div className="footer-logo-icon">
                                <Wrench size={22} />
                            </div>
                            <span className="footer-logo-text">MecanoLib</span>
                        </Link>

                        <p className="footer-description">
                            La plateforme de prise de rendez-vous simple et rapide pour les garages automobiles.
                            Gagnez du temps, optimisez votre planning.
                        </p>

                        <div className="footer-social">

                            <a href="#" className="footer-social-link">
                                <svg viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.6-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.95 10.125 11.85v-8.38H7.078v-3.47h3.047V9.43c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.96H15.83c-1.49 0-1.96.92-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.073" />
                                </svg>
                            </a>


                            <a href="#" className="footer-social-link">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.26.07 1.64.07 4.85s-.01 3.58-.07 4.85c-.15 3.22-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.59.07-4.85C2.38 3.84 3.9 2.31 7.15 2.16 8.42 2.1 8.8 2.16 12 2.16z" />
                                </svg>
                            </a>


                            <a href="#" className="footer-social-link">
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 2H22L14 11L23 22H16L10 15L3 22H0L8 12L0 2H7L12 8L18 2Z" />
                                </svg>
                            </a>


                            <a href="#" className="footer-social-link">
                                <svg viewBox="0 0 24 24">
                                    <path d="M20.45 20.45H17v-5.6c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.7H9.35V9H12.7v1.56c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.46v6.29z" />
                                </svg>
                            </a>
                        </div>
                    </div>


                    <div className="footer-links">


                        <div>
                            <h3>Entreprise</h3>
                            <Link to="#">À propos</Link>
                            <Link to="#">Carrières</Link>
                            <Link to="#">Presse</Link>
                            <Link to="#">Contact</Link>
                        </div>

                        <div>
                            <h3>Légal</h3>
                            <Link to="#">CGU</Link>
                            <Link to="#">CGV</Link>
                            <Link to="#">Confidentialité</Link>
                            <Link to="#">Mentions légales</Link>
                        </div>
                    </div>


                    <div className="footer-contact">
                        <h3>Contact</h3>
                        <p>mecanolibcontact@gmail.com</p>
                        <p>01 23 45 67 89</p>
                        <p>Lille, France</p>
                    </div>

                </div>

                <div className="footer-bottom">
                    <p>© {year} MecanoLib - Tous droits réservés</p>
                    <p>Fait Par</p>
                </div>

            </div>
        </footer>
    );
}