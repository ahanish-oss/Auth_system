import { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-clean">
        <h1 className="auth-title-center">{title}</h1>
        <p className="auth-subtitle-center">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
