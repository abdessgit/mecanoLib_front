import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./HomePage.css";

export default function HomePage() {

    // images du carousel (public/images)
    const slides = [
        "/images/hero-1.jpg",
        "/images/hero-2.jpg",
        "/images/hero-3.jpg"

    ];
    const [index, setIndex] = useState(0);
    // slider 
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="home">
            <section className="hero">
                {/* IMAGE */}
                <img
                    key={index}
                    src={slides[index]}
                    className="hero-img slide-animation"
                />
                <button
                    className="arrow left"
                    onClick={() =>
                        setIndex(index === 0 ? slides.length - 1 : index - 1)
                    }
                >
                    ❮
                </button>
                <button
                    className="arrow right"
                    onClick={() =>
                        setIndex((index + 1) % slides.length)
                    }
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

            </section>
            <section className="stats">
                <div className="stat">
                    <h3>10K+</h3>
                    <p>Rendez-vous pris</p>
                </div>
                <div className="stat">
                    <h3>150+</h3>
                    <p>Garages partenaires</p>
                </div>
                <div className="stat">
                    <h3>98%</h3>
                    <p>Clients satisfaits</p>
                </div>
                <div className="stat">
                    <h3>-40%</h3>
                    <p>No-show</p>
                </div>
            </section>

            {/* FEATURES */}
            <section className="features">
                <h2>Pourquoi MecanoLib ?</h2>

                <div className="features-grid">
                    <div className="feature"> Réservation 24/7</div>
                    <div className="feature"> Gain de temps</div>
                    <div className="feature"> Rappels WhatsApp</div>
                    <div className="feature"> Garages vérifiés</div>
                    <div className="feature"> 100% mobile</div>
                    <div className="feature"> Prix transparents</div>
                </div>
            </section>


            <section className="testimonials">
                <h2>Ils nous font confiance</h2>

                <div className="testimonials-grid">
                    <div className="testimonial">
                        ⭐⭐⭐⭐⭐
                        <p>"RDV pris en 2 minutes !"</p>
                        <strong>Karim</strong>
                    </div>

                    <div className="testimonial">
                        ⭐⭐⭐⭐⭐
                        <p>"Les rappels WhatsApp sont top"</p>
                        <strong>Nadia</strong>
                    </div>

                    <div className="testimonial">
                        ⭐⭐⭐⭐⭐
                        <p>"Moins d’absences clients"</p>
                        <strong>Garage AutoPro</strong>
                    </div>
                </div>
            </section>


            <section className="cta">
                <h2>Prêt à réserver ?</h2>
                <Link to="/Reserver" className="btn-primary big">
                    Prendre mon premier RDV
                </Link>
            </section>

        </div>
    );
}