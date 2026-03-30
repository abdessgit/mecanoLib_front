import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wrench, User, Calendar, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './Navbar.css';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Accueil', icon: null },
    { path: '/booking', label: 'Prendre RDV', icon: Calendar },
    { path: '/client', label: 'Espace Client', icon: User },
    { path: '/garage', label: 'Espace Garage', icon: Wrench },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={cn('navbar', isScrolled && 'navbar-scrolled')}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Wrench size={24} />
          </div>
          <span className="navbar-logo-text">MecanoLib</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'navbar-link',
                isActive(link.path) && 'navbar-link-active'
              )}
            >
              {link.icon && <link.icon size={18} />}
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="navbar-cta">
          <Link to="/admin" className="navbar-cta-button navbar-cta-admin">
            <ShieldCheck size={18} />
            Connexion
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="navbar-mobile-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn('navbar-mobile-menu', isMobileMenuOpen && 'navbar-mobile-menu-open')}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              'navbar-mobile-link',
              isActive(link.path) && 'navbar-mobile-link-active'
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.icon && <link.icon size={20} />}
            {link.label}
          </Link>
        ))}
        <Link
          to="/admin"
          className="navbar-mobile-cta"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <ShieldCheck size={20} />
          Connexion Admin
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
