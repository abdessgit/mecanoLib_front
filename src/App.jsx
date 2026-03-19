import './App.css'
import { useNavigate } from "react-router-dom"

function App() {
    const navigate = useNavigate()

    return (
        <main>
            {/* ── Hero ── */}
            <section className="hero-section text-white text-center">
                <div className="container py-5">
                    <span className="badge bg-warning text-dark mb-3 px-3 py-2 rounded-pill fw-semibold">
                        🚗 Nouveau — Inscrivez votre garage gratuitement
                    </span>
                    <h1 className="display-2 fw-bold mt-2 mb-4">
                        Bienvenue sur <span className="text-warning">MecanoLib</span>
                    </h1>
                    <p className="lead mb-5 mx-auto" style={{ maxWidth: "600px" }}>
                        La plateforme qui connecte les garages professionnels et leurs clients.
                        Trouvez un garage de confiance ou inscrivez votre établissement dès aujourd'hui.
                    </p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <button
                            className="btn btn-warning btn-lg fw-bold px-5 shadow"
                            onClick={() => navigate("/inscription")}
                        >
                            S'inscrire
                        </button>
                        <button
                            className="btn btn-outline-light btn-lg px-5"
                            onClick={() => navigate("/connexion")}
                        >
                            Connexion
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-5 bg-light">
                <div className="container py-3">
                    <h2 className="text-center fw-bold mb-2">Pourquoi choisir MecanoLib ?</h2>
                    <p className="text-center text-muted mb-5">Simple, rapide et fiable pour les professionnels comme pour les clients.</p>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="feature-card h-100 p-4 rounded-4 shadow-sm bg-white text-center">
                                <div className="feature-icon mb-3">🏆</div>
                                <h5 className="fw-bold">Garages certifiés</h5>
                                <p className="text-muted mb-0">Des professionnels vérifiés et évalués par notre communauté.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="feature-card h-100 p-4 rounded-4 shadow-sm bg-white text-center">
                                <div className="feature-icon mb-3">⚡</div>
                                <h5 className="fw-bold">Réservation rapide</h5>
                                <p className="text-muted mb-0">Prenez rendez-vous en quelques clics, 24h/24 et 7j/7.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="feature-card h-100 p-4 rounded-4 shadow-sm bg-white text-center">
                                <div className="feature-icon mb-3">💬</div>
                                <h5 className="fw-bold">Avis clients</h5>
                                <p className="text-muted mb-0">Consultez les avis authentiques pour faire le meilleur choix.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="py-5 bg-white text-center">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-md-3 col-6">
                            <h3 className="display-5 fw-bold text-warning">500+</h3>
                            <p className="text-muted">Garages partenaires</p>
                        </div>
                        <div className="col-md-3 col-6">
                            <h3 className="display-5 fw-bold text-warning">10k+</h3>
                            <p className="text-muted">Clients satisfaits</p>
                        </div>
                        <div className="col-md-3 col-6">
                            <h3 className="display-5 fw-bold text-warning">50k+</h3>
                            <p className="text-muted">RDV pris</p>
                        </div>
                        <div className="col-md-3 col-6">
                            <h3 className="display-5 fw-bold text-warning">4.8 ★</h3>
                            <p className="text-muted">Note moyenne</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-5 cta-section text-center text-white">
                <div className="container py-3">
                    <h2 className="fw-bold display-6 mb-3">Vous êtes un professionnel ?</h2>
                    <p className="lead mb-4">Rejoignez des centaines de garages déjà inscrits sur MecanoLib.</p>
                    <button
                        className="btn btn-warning btn-lg fw-bold px-5 shadow"
                        onClick={() => navigate("/inscription")}
                    >
                        Creer mon espace →
                    </button>
                </div>
            </section>
        </main>
    )
}

export default App