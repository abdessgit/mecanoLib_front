import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './Button.css';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  children,
  disabled,
  loading,
  ...props
}, ref) => {
  const variants = {
    default: 'btn-default',
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  };

  const sizes = {
    default: 'btn-size-default',
    sm: 'btn-size-sm',
    lg: 'btn-size-lg',
    icon: 'btn-size-icon',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="btn-spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
