import { useEffect, useCallback, useState } from 'react';
import toast from 'react-hot-toast';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess, isLoading }: GoogleSignInButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handleCredentialResponse = useCallback((response: any) => {
    if (response.credential) {
      onSuccess(response.credential);
    } else {
      toast.error('Google sign-in failed. Please try again.');
    }
  }, [onSuccess]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set in environment variables.');
      return;
    }

    const loadScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    };

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
    } else {
      loadScript();
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const buttonDiv = document.getElementById('google-signin-btn');
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width: buttonDiv.offsetWidth || 320,
        });
      }
    }
  }, [scriptLoaded, handleCredentialResponse]);

  return (
    <div className="w-full">
      <div 
        id="google-signin-btn" 
        className={`w-full flex justify-center min-h-[52px] ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      />
      {!GOOGLE_CLIENT_ID && (
        <p className="text-xs text-red-500 mt-2 text-center">
          Google Client ID missing. Please check your configuration.
        </p>
      )}
    </div>
  );
}
