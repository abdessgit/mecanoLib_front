import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  CheckCircle, 
  Shield, 
  Bell, 
  Smartphone,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, HeroCarousel } from '../../components';
import './Home.css';

const Home = () => {
  // Images pour le carrousel
  const heroSlides = [
    {
      src: '/images/hero-1.jpg',
      badge: 'Garage Partenaire',
      title: 'L\'entretien auto simplifié',
      subtitle: 'Réservez votre créneau en ligne 24/7. Fini les appels et les attentes.',
      cta: { text: 'Prendre rendez-vous', link: '/booking' }
    },
    {
      src: '/images/hero-2.jpg',
      badge: 'Expertise Professionnelle',
      title: 'Des mécaniciens de confiance',
      subtitle: 'Nos garages partenaires sont sélectionnés pour leur expertise et leur sérieux.',
      cta: { text: 'Découvrir nos services', link: '/booking' }
    },
    {
      src: '/images/hero-3.jpg',
      badge: 'Service Premium',
      title: 'Une expérience client unique',
      subtitle: 'Accueil personnalisé, rappels automatiques et suivi de vos interventions.',
      cta: { text: 'En savoir plus', link: '/booking' }
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Réservation 24/7',
      description: 'Prenez rendez-vous à tout moment, même en dehors des heures d\'ouverture.',
    },
    {
      icon: Clock,
      title: 'Gain de temps',
      description: 'Finis les appels téléphoniques et les allers-retours. Réservez en 3 clics.',
    },
    {
      icon: Bell,
      title: 'Rappels automatiques',
      description: 'Recevez des notifications par email et WhatsApp pour ne jamais oublier un RDV.',
    },
    {
      icon: Shield,
      title: 'Validation sécurisée',
      description: 'Le garage valide chaque rendez-vous pour garantir la disponibilité.',
    },
    {
      icon: Smartphone,
      title: '100% mobile',
      description: 'Interface optimisée pour smartphone, tablette et ordinateur.',
    },
    {
      icon: Wrench,
      title: 'Prestations claires',
      description: 'Catalogue de prestations avec durée et prix indicatifs transparents.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Choisissez votre prestation',
      description: 'Sélectionnez une prestation dans le catalogue ou décrivez votre besoin.',
    },
    {
      number: '02',
      title: 'Sélectionnez un créneau',
      description: 'Consultez les disponibilités en temps réel et choisissez l\'horaire qui vous convient.',
    },
    {
      number: '03',
      title: 'Renseignez vos informations',
      description: 'Indiquez vos coordonnées et les informations de votre véhicule.',
    },
    {
      number: '04',
      title: 'Recevez la confirmation',
      description: 'Le garage valide votre demande et vous recevez une confirmation.',
    },
  ];

  const testimonials = [
    {
      name: 'Jean Dupont',
      role: 'Client',
      content: 'Super pratique ! J\'ai pu prendre rendez-vous pour ma vidange en 2 minutes, sans avoir à appeler.',
      rating: 5,
    },
    {
      name: 'Marie Martin',
      role: 'Cliente',
      content: 'Les rappels automatiques m\'ont sauvée plusieurs fois. Je recommande vivement !',
      rating: 5,
    },
    {
      name: 'Pierre Bernard',
      role: 'Propriétaire de garage',
      content: 'Depuis que nous utilisons MecanoLib, notre taux de no-show a diminué de 60%.',
      rating: 5,
    },
  ];

  const stats = [
    { value: '10K+', label: 'Rendez-vous pris', icon: Calendar },
    { value: '150+', label: 'Garages partenaires', icon: Wrench },
    { value: '98%', label: 'Clients satisfaits', icon: Users },
    { value: '-40%', label: 'Taux de no-show', icon: TrendingUp },
  ];

  return (
    <div className="home">
      {/* Hero Section with Carousel */}
      <section className="home-hero">
        {/* Carrousel plein écran */}
        <HeroCarousel 
          images={heroSlides}
          autoPlay={true}
          interval={6000}
          showIndicators={true}
          showArrows={true}
          overlay={true}
        />

        {/* Scroll indicator */}
        <motion.div 
          className="home-hero-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <span>Découvrir</span>
          <div className="home-hero-scroll-arrow">
            <ChevronRight size={20} className="home-hero-scroll-icon" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="home-stats">
        <div className="home-stats-container">
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="home-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <stat.icon size={24} className="home-stat-icon" />
              <div className="home-stat-value">{stat.value}</div>
              <div className="home-stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="home-features-container">
          <div className="home-features-header">
            <motion.span 
              className="home-features-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Fonctionnalités
            </motion.span>
            <motion.h2 
              className="home-features-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Tout ce qu'il faut pour une prise de RDV{' '}
              <span className="gradient-text">sans friction</span>
            </motion.h2>
            <motion.p 
              className="home-features-description"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              MecanoLib offre une expérience complète, du choix de la prestation 
              à la confirmation du rendez-vous.
            </motion.p>
          </div>
          
          <div className="home-features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="home-feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="home-feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-steps">
        <div className="home-steps-container">
          <div className="home-steps-header">
            <motion.span 
              className="home-steps-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Comment ça marche
            </motion.span>
            <motion.h2 
              className="home-steps-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Réservez en <span className="gradient-text">4 étapes simples</span>
            </motion.h2>
          </div>
          
          <div className="home-steps-grid">
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                className="home-step"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="home-step-number">{step.number}</div>
                <h3 className="home-step-title">{step.title}</h3>
                <p className="home-step-description">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="home-step-arrow">
                    <ChevronRight size={24} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home-testimonials">
        <div className="home-testimonials-container">
          <div className="home-testimonials-header">
            <motion.span 
              className="home-testimonials-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Témoignages
            </motion.span>
            <motion.h2 
              className="home-testimonials-title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Ce que disent nos <span className="gradient-text">utilisateurs</span>
            </motion.h2>
          </div>
          
          <div className="home-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.name}
                className="home-testimonial"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="home-testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p className="home-testimonial-content">{testimonial.content}</p>
                <div className="home-testimonial-author">
                  <div className="home-testimonial-avatar">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="home-testimonial-name">{testimonial.name}</p>
                    <p className="home-testimonial-role">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="home-cta-container">
          <motion.div 
            className="home-cta-content"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="home-cta-title">
              Prêt à simplifier la prise de rendez-vous ?
            </h2>
            <p className="home-cta-description">
              Rejoignez les milliers d'utilisateurs qui font confiance à MecanoLib 
              pour gérer leurs rendez-vous automobile.
            </p>
            <div className="home-cta-buttons">
              <Link to="/booking">
                <Button size="lg" className="home-cta-button-primary">
                  <Calendar size={20} />
                  Prendre mon premier RDV
                </Button>
              </Link>
              <Link to="/garage">
                <Button variant="outline" size="lg" className="home-cta-button-secondary">
                  <Wrench size={20} />
                  Devenir garage partenaire
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
