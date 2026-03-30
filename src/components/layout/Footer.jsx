import { Link } from "react-router-dom"

function Footer() {
    return (
        <footer className="bg-dark text-light py-5 mt-auto">
            <div className="container">
                <div className="row g-4">
                    <div className="col-md-4">
                        <h5 className="text-warning fw-bold fs-5 mb-3">
                            🔧 MecanoLib
                        </h5>
                        <p className="text-secondary">
                            La plateforme qui connecte les garages professionnels
                            et leurs clients en toute confiance.
                        </p>
                    </div>

                    <div className="col-md-4">
                        <h6 className="fw-bold mb-3 text-uppercase text-secondary" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>
                            Liens utiles
                        </h6>
                        <ul className="list-unstyled">
                            <li className="mb-1">
                                <Link to="/" className="text-secondary text-decoration-none footer-link">
                                    Accueil
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/inscription" className="text-secondary text-decoration-none footer-link">
                                    Inscription
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/connexion" className="text-secondary text-decoration-none footer-link">
                                    Connexion
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="col-md-4">
                        <h6 className="fw-bold mb-3 text-uppercase text-secondary" style={{ letterSpacing: "1px", fontSize: "0.8rem" }}>
                            Contact
                        </h6>
                        <ul className="list-unstyled text-secondary">
                            <li className="mb-1">📧 contact@mecanolib.fr</li>
                            <li className="mb-1">📞 +33 1 23 45 67 89</li>
                            <li className="mb-1">📍 Paris, France</li>
                        </ul>
                    </div>
                </div>

                <hr className="border-secondary mt-4 mb-3" />

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <p className="text-secondary small mb-0">
                        © 2026 MecanoLib — Tous droits réservés
                    </p>
                    <div className="d-flex gap-3">
                        <Link to="/mentions-legales" className="text-secondary text-decoration-none small footer-link">Mentions légales</Link>
                        <Link to="/cgu" className="text-secondary text-decoration-none small footer-link">CGU</Link>
                        <Link to="/confidentialite" className="text-secondary text-decoration-none small footer-link">Confidentialité</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
