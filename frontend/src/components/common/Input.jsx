import { forwardRef } from 'react';
import './Input.scss';

const Input = forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  id,
  className = '',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={inputId}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'input-helper-error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
