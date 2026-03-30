import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  CalendarX, 
  Wrench,
  AlertCircle 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './StatusBadge.css';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const statusConfig = {
  pending: {
    label: 'En attente',
    icon: Clock,
    variant: 'warning',
  },
  confirmed: {
    label: 'Confirmé',
    icon: CheckCircle,
    variant: 'success',
  },
  refused: {
    label: 'Refusé',
    icon: XCircle,
    variant: 'danger',
  },
  cancelled_client: {
    label: 'Annulé client',
    icon: CalendarX,
    variant: 'neutral',
  },
  cancelled_garage: {
    label: 'Annulé garage',
    icon: CalendarX,
    variant: 'neutral',
  },
  completed: {
    label: 'Terminé',
    icon: Wrench,
    variant: 'primary',
  },
  no_show: {
    label: 'No-show',
    icon: AlertCircle,
    variant: 'danger',
  },
};

const StatusBadge = ({ status, className, showIcon = true }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={cn('status-badge', `status-badge-${config.variant}`, className)}>
      {showIcon && <Icon size={14} />}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
