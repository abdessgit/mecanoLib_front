import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './ServiceCard.css';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ServiceCard = ({
  icon: Icon,
  title,
  description,
  duration,
  price,
  selected = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'service-card',
        selected && 'service-card-selected',
        className
      )}
      onClick={onClick}
    >
      <div className="service-card-content">
        <div className={cn('service-card-icon', selected && 'service-card-icon-selected')}>
          <Icon size={24} />
        </div>
        
        <div className="service-card-info">
          <h3 className="service-card-title">{title}</h3>
          <p className="service-card-description">{description}</p>
          
          <div className="service-card-meta">
            <div className="service-card-duration">
              <Clock size={14} />
              <span>{duration} min</span>
            </div>
            {price && (
              <div className="service-card-price">
                <span>à partir de </span>
                <strong>{price}€</strong>
              </div>
            )}
          </div>
        </div>
        
        <div className={cn('service-card-check', selected && 'service-card-check-selected')}>
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
