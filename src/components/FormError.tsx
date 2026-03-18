interface FormErrorProps {
  id?: string;
  message?: string;
  className?: string;
}

export default function FormError({ id, message, className }: FormErrorProps) {
  if (!message) return null;
  return (
    <span id={id} className={`form-error field-error ${className || ''}`}>
      {message}
    </span>
  );
}
