import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './HeroCarousel.css';

const HeroCarousel = ({ 
  images = [],
  autoPlay = true,
  interval = 5000,
  showIndicators = true,
  showArrows = true,
  overlay = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.7, ease: 'easeOut' }
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.5 }
      }
    })
  };

  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: (delay) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: delay * 0.15 + 0.3,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }),
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const paginate = useCallback((newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  }, [images.length]);

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused || images.length <= 1) return;

    const timer = setInterval(() => {
      paginate(1);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, paginate, images.length]);

  const currentSlide = images[currentIndex];

  if (images.length === 0) return null;

  return (
    <div 
      className="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          className="hero-carousel-slide"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Image */}
          <div 
            className="hero-carousel-image"
            style={{ backgroundImage: `url(${currentSlide.src})` }}
          />
          
          {/* Overlay */}
          {overlay && <div className="hero-carousel-overlay" />}
          
          {/* Content */}
          {currentSlide.title && (
            <div className="hero-carousel-content">
              <div className="hero-carousel-content-inner">
                <motion.span
                  className="hero-carousel-badge"
                  custom={0}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {currentSlide.badge || 'MecanoLib'}
                </motion.span>
                
                <motion.h2
                  className="hero-carousel-title"
                  custom={1}
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {currentSlide.title}
                </motion.h2>
                
                {currentSlide.subtitle && (
                  <motion.p
                    className="hero-carousel-subtitle"
                    custom={2}
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {currentSlide.subtitle}
                  </motion.p>
                )}
                
                {currentSlide.cta && (
                  <motion.div
                    custom={3}
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <a 
                      href={currentSlide.cta.link} 
                      className="hero-carousel-cta"
                    >
                      {currentSlide.cta.text}
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {showArrows && images.length > 1 && (
        <>
          <button
            className="hero-carousel-arrow hero-carousel-arrow-prev"
            onClick={() => paginate(-1)}
            aria-label="Image précédente"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className="hero-carousel-arrow hero-carousel-arrow-next"
            onClick={() => paginate(1)}
            aria-label="Image suivante"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="hero-carousel-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`hero-carousel-indicator ${
                index === currentIndex ? 'active' : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Aller à l'image ${index + 1}`}
            >
              <span className="hero-carousel-indicator-bar" />
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoPlay && !isPaused && (
        <div className="hero-carousel-progress">
          <motion.div
            className="hero-carousel-progress-bar"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: interval / 1000, ease: 'linear' }}
            key={currentIndex}
          />
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
