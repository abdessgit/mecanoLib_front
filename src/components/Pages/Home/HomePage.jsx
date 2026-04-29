import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./HomePage.css";

const FEATURES = [
    { icon: "🕐", label: "Réservation 24/7" },
    { icon: "⚡", label: "Gain de temps" },
    { icon: "💬", label: "Rappels par mail" },
    { icon: "✅", label: "Garages vérifiés" },
    { icon: "📱", label: "100% mobile" },
    { icon: "💰", label: "Prix transparents" },
];

const SLIDES = [
    { src: "/images/hero-1.jpg", alt: "Mécanicien réparant une voiture" },
    { src: "/images/hero-2.jpg", alt: "Garage moderne avec outils" },
    { src: "/images/hero-3.jpg", alt: "Client satisfait récupérant sa voiture" },
];

const TESTIMONIALS = [
    { quote: "RDV pris en 2 minutes, service impeccable !", author: "Karim" },
    { quote: "Les rappels Email m'ont évité d'oublier mon rendez-vous.", author: "Lucie" },
    { quote: "Beaucoup moins d'absences clients depuis qu'on utilise MecanoLib.", author: "Garage AutoPro" },
];

export default function HomePage() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % SLIDES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const prev = () => setIndex(i => (i === 0 ? SLIDES.length - 1 : i - 1));
    const next = () => setIndex(i => (i + 1) % SLIDES.length);

    return (
        <div className="home">

            {/* ── HERO ── */}
            <header className="hero">
                <img
                    key={index}
                    src={SLIDES[index].src}
                    alt={SLIDES[index].alt}
                    className="hero-img slide-animation"
                    loading="lazy"
                />

                <button className="arrow left" aria-label="Précédent" onClick={prev}>❮</button>
                <button className="arrow right" aria-label="Suivant" onClick={next}>❯</button>

                <div className="hero-overlay">
                    <h1>Des mécaniciens<br /><span>de confiance</span></h1>
                    <p>Réservez votre garage en ligne en quelques clics. Simple, rapide, fiable.</p>
                    <div className="hero-buttons">
                        <Link to="/Reserver" className="btn-primary">Prendre RDV</Link>

                    </div>
                </div>

                {/* dots */}
                <div className="hero-dots" role="tablist" aria-label="Slides">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            className={`hero-dot${i === index ? " active" : ""}`}
                            aria-label={`Slide ${i + 1}`}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
            </header>

            {/* ── STATS ── */}
            <section className="stats" aria-label="Statistiques">
                <article className="stat"><h3>10K+</h3><p>Rendez-vous pris</p></article>
                <article className="stat"><h3>150+</h3><p>Garages partenaires</p></article>
                <article className="stat"><h3>98%</h3><p>Clients satisfaits</p></article>
                <article className="stat"><h3>-40%</h3><p>No-show</p></article>
            </section>

            {/* ── FEATURES ── */}
            <section className="features" aria-label="Fonctionnalités">
                <h2>Pourquoi MecanoLib ?</h2>
                <p className="features-subtitle">Tout ce dont vous avez besoin, au même endroit.</p>
                <div className="features-grid">
                    {FEATURES.map(({ icon, label }) => (
                        <article className="feature" key={label}>
                            <span className="feature-icon">{icon}</span>
                            {label}
                        </article>
                    ))}
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="testimonials" aria-label="Témoignages">
                <h2>Ils nous font confiance</h2>
                <div className="testimonials-grid">
                    {TESTIMONIALS.map(({ quote, author }) => (
                        <article className="testimonial" key={author}>
                            <span className="testimonial-quote">"</span>
                            <span className="testimonial-stars">★★★★★</span>
                            <p>"{quote}"</p>
                            <strong>{author}</strong>
                        </article>
                    ))}
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta">
                <h2>Prêt à <span>réserver</span> ?</h2>
                <Link to="/Reserver" className="btn-primary big">
                    Prendre mon premier RDV
                </Link>
            </section>

        </div>
    );
}
