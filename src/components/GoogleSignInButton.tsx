import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  showLabel?: boolean;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  className = '',
  showLabel = true,
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userData;

      if (!userDocSnap.exists()) {
        // New user - create profile with default role
        const isAdmin = user.email?.toLowerCase() === 'ahanish@karunya.edu.in';
        userData = {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: isAdmin ? 'Admin' : 'User',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          provider: 'google',
        };

        // Store user data in Firestore
        await setDoc(userDocRef, userData);
        console.log('[AUTH] New user created:', user.email);
      } else {
        // Existing user - update last login
        userData = userDocSnap.data();
        await setDoc(
          userDocRef,
          { lastLogin: serverTimestamp() },
          { merge: true }
        );
        console.log('[AUTH] User logged in:', user.email);
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Welcome! Signing you in...');

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect based on role
        setTimeout(() => {
          const role = userData.role;
          if (role === 'Admin' || role === 'admin') {
            navigate('/admin-dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('[AUTH] Google Sign-In Error:', error);

      let errorMessage = 'Google authentication failed';

      if (error.code === 'popup_blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'popup_closed_by_user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'network_request_failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`w-full h-[52px] bg-white border border-[#E2E8F0] rounded-[12px] flex items-center justify-center gap-3 text-[15px] font-medium text-[#1A1A1A] hover:bg-[#F8FAFC] active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Sign in with Google"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
          {showLabel && <span>Signing in...</span>}
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {showLabel && <span>Continue with Google</span>}
        </>
      )}
    </button>
  );
}
