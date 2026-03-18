import { UseFormRegisterReturn, FieldError } from 'react-hook-form';
import FormError from './FormError';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FormInputProps {
  id: string;
  type?: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  touched?: boolean;
  isSubmitted?: boolean;
  value?: string;
  required?: boolean;
}

export default function FormInput({
  id,
  type = 'text',
  label,
  placeholder,
  autoComplete,
  registration,
  error,
  touched,
  isSubmitted,
  value,
  required,
}: FormInputProps) {
  const hasError = Boolean(error);
  const isSuccess = (touched || isSubmitted) && !hasError && value && value.length > 0;

  return (
    <div className="auth-field-group">
      <label className="auth-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`auth-input ${hasError ? 'auth-input-error' : ''} ${
            isSuccess ? 'auth-input-success' : ''
          }`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          {...registration}
        />
        {hasError && (
          <div className="auth-input-icon auth-input-icon-error">
            <AlertCircle size={18} />
          </div>
        )}
        {isSuccess && (
          <div className="auth-input-icon auth-input-icon-success">
            <CheckCircle2 size={18} />
          </div>
        )}
      </div>
      <FormError id={`${id}-error`} message={error?.message} className="field-error" />
    </div>
  );
}
