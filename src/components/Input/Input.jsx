import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './Input.css';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  icon: Icon,
  ...props
}, ref) => {
  const emailProps = type === 'email'
    ? {
        inputMode: 'email',
        autoComplete: props.autoComplete || 'email',
        pattern: props.pattern || '[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}',
        title: props.title || 'Veuillez saisir une adresse email valide.',
      }
    : {};

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-container">
        {Icon && (
          <div className="input-icon">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'input-field',
            Icon && 'input-with-icon',
            error && 'input-error',
            className
          )}
          {...emailProps}
          {...props}
        />
      </div>
      {helperText && !error && (
        <p className="input-helper">{helperText}</p>
      )}
      {error && (
        <p className="input-error-text">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
