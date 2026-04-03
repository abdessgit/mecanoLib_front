import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./HomePage.css";

export default function HomePage() {

    const slides = [
        { src: "/images/hero-1.jpg", alt: "Mécanicien réparant une voiture" },
        { src: "/images/hero-2.jpg", alt: "Garage moderne avec outils" },
        { src: "/images/hero-3.jpg", alt: "Client satisfait récupérant sa voiture" },
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="home">

            {/* HERO */}
            <header className="hero">
                <img
                    key={index}
                    src={slides[index].src}
                    alt={slides[index].alt}
                    className="hero-img slide-animation"
                    loading="lazy"

                />

                <button
                    className="arrow left"
                    aria-label="Précédent"
                    onClick={() => setIndex(index === 0 ? slides.length - 1 : index - 1)}
                >
                    ❮
                </button>
                <button
                    className="arrow right"
                    aria-label="Suivant"
                    onClick={() => setIndex((index + 1) % slides.length)}
                >
                    ❯
                </button>

                <div className="hero-overlay">
                    <h1>Des mécaniciens de confiance</h1>
                    <p>Réservez votre garage en ligne en quelques clics</p>
                    <div className="hero-buttons">
                        <Link to="/Reserver" className="btn-primary">Prendre RDV</Link>
                        <Link to="/garage" className="btn-outline">Garage partenaire</Link>
                    </div>
                </div>
            </header>

            {/* STATS */}
            <section className="stats" aria-label="Statistiques">
                <article className="stat">
                    <h3>10K+</h3>
                    <p>Rendez-vous pris</p>
                </article>
                <article className="stat">
                    <h3>150+</h3>
                    <p>Garages partenaires</p>
                </article>
                <article className="stat">
                    <h3>98%</h3>
                    <p>Clients satisfaits</p>
                </article>
                <article className="stat">
                    <h3>-40%</h3>
                    <p>No-show</p>
                </article>
            </section>

            {/* FEATURES */}
            <section className="features" aria-label="Fonctionnalités">
                <h2>Pourquoi MecanoLib ?</h2>
                <div className="features-grid">
                    <article className="feature">Réservation 24/7</article>
                    <article className="feature">Gain de temps</article>
                    <article className="feature">Rappels WhatsApp</article>
                    <article className="feature">Garages vérifiés</article>
                    <article className="feature">100% mobile</article>
                    <article className="feature">Prix transparents</article>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="testimonials" aria-label="Témoignages">
                <h2>Ils nous font confiance</h2>
                <div className="testimonials-grid">
                    <article className="testimonial">
                        ⭐⭐⭐⭐⭐
                        <p>"RDV pris en 2 minutes !"</p>
                        <strong>Karim</strong>
                    </article>
                    <article className="testimonial">
                        ⭐⭐⭐⭐⭐
                        <p>"Les rappels WhatsApp sont top"</p>
                        <strong>Nadia</strong>
                    </article>
                    <article className="testimonial">
                        ⭐⭐⭐⭐⭐
                        <p>"Moins d’absences clients"</p>
                        <strong>Garage AutoPro</strong>
                    </article>
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <h2>Prêt à réserver ?</h2>
                <Link to="/Reserver" className="btn-primary big">
                    Prendre mon premier RDV
                </Link>
            </section>

        </div>
    );
}