import React from 'react';
import { Clock, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './TimeSlot.css';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TimeSlot = ({
  time,
  available = true,
  selected = false,
  onClick,
  className,
}) => {
  if (!available) {
    return (
      <div className={cn('time-slot', 'time-slot-unavailable', className)}>
        <Clock size={14} />
        <span>{time}</span>
      </div>
    );
  }

  return (
    <button
      className={cn(
        'time-slot',
        'time-slot-available',
        selected && 'time-slot-selected',
        className
      )}
      onClick={onClick}
      type="button"
    >
      {selected ? <Check size={14} /> : <Clock size={14} />}
      <span>{time}</span>
    </button>
  );
};

export default TimeSlot;
