import React from 'react';
import { motion } from 'framer-motion';
import './Logo.css';

const Logo = ({ size = 'medium', animated = true, className = '' }) => {
  const sizes = {
    small: { container: 40, icon: 20 },
    medium: { container: 56, icon: 28 },
    large: { container: 80, icon: 40 },
    xl: { container: 120, icon: 60 },
  };

  const { container, icon } = sizes[size] || sizes.medium;

  const logoVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  const gearVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: 360,
      transition: { 
        duration: 8, 
        repeat: Infinity, 
        ease: 'linear' 
      }
    }
  };

  const innerGearVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: -360,
      transition: { 
        duration: 6, 
        repeat: Infinity, 
        ease: 'linear' 
      }
    }
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.8 },
    animate: { 
      scale: [1, 1.1, 1],
      opacity: [0.8, 0.4, 0.8],
      transition: { 
        duration: 2, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      }
    }
  };

  const letterVariants = {
    initial: { y: 0 },
    hover: (i) => ({
      y: -3,
      transition: { 
        delay: i * 0.05,
        duration: 0.2,
        ease: 'easeOut'
      }
    })
  };

  const brandName = 'MecanoLib';

  return (
    <motion.div 
      className={`logo ${className}`}
      style={{ height: container }}
      variants={animated ? logoVariants : {}}
      initial="initial"
      whileHover={animated ? 'hover' : undefined}
    >
      {/* Logo Icon */}
      <div 
        className="logo-icon-container"
        style={{ width: container, height: container }}
      >
        {/* Glow effect */}
        {animated && (
          <motion.div 
            className="logo-glow"
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />
        )}
        
        {/* Main SVG Logo */}
        <svg 
          viewBox="0 0 100 100" 
          className="logo-svg"
          style={{ width: icon, height: icon }}
        >
          {/* Outer gear */}
          <motion.g 
            className="logo-gear-outer"
            variants={animated ? gearVariants : {}}
            initial="initial"
            animate="animate"
          >
            <circle cx="50" cy="50" r="45" fill="url(#gradientOuter)" />
            {[...Array(12)].map((_, i) => (
              <rect
                key={i}
                x="45"
                y="2"
                width="10"
                height="15"
                rx="2"
                fill="url(#gradientOuter)"
                transform={`rotate(${i * 30} 50 50)`}
              />
            ))}
          </motion.g>
          
          {/* Inner gear */}
          <motion.g 
            className="logo-gear-inner"
            variants={animated ? innerGearVariants : {}}
            initial="initial"
            animate="animate"
          >
            <circle cx="50" cy="50" r="28" fill="url(#gradientInner)" />
            {[...Array(8)].map((_, i) => (
              <rect
                key={i}
                x="46"
                y="18"
                width="8"
                height="12"
                rx="2"
                fill="url(#gradientInner)"
                transform={`rotate(${i * 45} 50 50)`}
              />
            ))}
          </motion.g>
          
          {/* Center wrench icon */}
          <g className="logo-wrench">
            <circle cx="50" cy="50" r="12" fill="white" />
            <path
              d="M50 44 L53 47 L50 50 L47 47 Z M50 50 L50 56"
              stroke="url(#gradientOuter)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="gradientOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="gradientInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Name */}
      <div className="logo-text">
        {brandName.split('').map((letter, i) => (
          <motion.span
            key={i}
            className={`logo-letter ${letter === 'L' ? 'logo-letter-accent' : ''}`}
            custom={i}
            variants={animated ? letterVariants : {}}
            initial="initial"
            whileHover="hover"
            style={{ 
              display: 'inline-block',
              fontSize: size === 'xl' ? '2.5rem' : size === 'large' ? '1.75rem' : size === 'small' ? '1rem' : '1.375rem'
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};

export default Logo;
