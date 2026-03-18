import { useState, useMemo } from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import FormError from './FormError';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  touched?: boolean;
  isSubmitted?: boolean;
  value?: string;
  showStrength?: boolean;
  required?: boolean;
}

export default function PasswordInput({
  id,
  label,
  placeholder,
  autoComplete,
  registration,
  error,
  touched,
  isSubmitted,
  value = '',
  showStrength = false,
  required,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(error);

  const strength = useMemo(() => {
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }, [value]);

  const strengthLabel = useMemo(() => {
    switch (strength) {
      case 0: return 'Very weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  }, [strength]);

  return (
    <div className="auth-field-group">
      <div className="auth-label-row">
        <label className="auth-field-label" htmlFor={id}>
          {label}
        </label>
      </div>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`auth-input auth-input-password ${
            hasError ? 'auth-input-password-error' : ''
          }`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="auth-password-toggle"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
        {hasError && (
          <div className="auth-input-icon auth-input-icon-error auth-input-icon-password">
            <AlertCircle size={18} />
          </div>
        )}
      </div>
      <FormError id={`${id}-error`} message={error?.message} className="field-error" />
      
      {showStrength && value.length > 0 && (
        <div className="password-strength">
          <div className="password-strength__bars">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`password-strength__bar ${strength >= bar ? 'is-active' : ''}`}
              />
            ))}
          </div>
          <p className="password-strength__text">
            Strength: <strong>{strengthLabel}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
