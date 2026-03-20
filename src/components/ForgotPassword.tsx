import { useState, FormEvent } from 'react';
import { Mail, ArrowRight, RefreshCw, ArrowLeft, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import AuthCard from './AuthCard';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast.success(`OTP sent to ${email}. Check your email!`);
      setStep('otp');
    } catch (error: any) {
      console.error("Send OTP Error:", error);
      toast.error(error.message || 'Failed to send OTP. Please ensure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      toast.success('OTP verified! Now set your new password.');
      setStep('reset');
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast.error(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the current user and update password
      const user = auth.currentUser;
      
      if (!user) {
        // If no user is logged in, we need to sign them in first
        // For now, show an error
        throw new Error('Unable to reset password. Please try logging in first.');
      }

      // Update the password in Firebase
      await updatePassword(user, newPassword);

      // Clear OTP from backend
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/auth/clear-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      let message = 'Failed to reset password. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        message = 'Please log in again before resetting your password.';
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Email Entry
  if (step === 'email') {
    return (
      <AuthCard
        title="Forgot password?"
        subtitle="No worries, we'll send you reset instructions."
      >
        <form onSubmit={handleEmailSubmit} className="mt-6">
          <div className="auth-field-group mb-6">
            <label className="auth-field-label" htmlFor="email">Email address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="auth-input pl-11"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                Send OTP <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#0F172A] font-semibold hover:underline text-[15px]"
            >
              <ArrowLeft size={18} /> Back to login
            </Link>
          </div>
        </form>
      </AuthCard>
    );
  }

  // Step 2: OTP Verification
  if (step === 'otp') {
    return (
      <AuthCard
        title="Verify OTP"
        subtitle={`Enter the OTP sent to ${email}`}
      >
        <form onSubmit={handleOtpSubmit} className="mt-6">
          <div className="auth-field-group mb-6">
            <label className="auth-field-label" htmlFor="otp">One-Time Password</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="auth-input text-center text-2xl tracking-widest"
              disabled={isSubmitting}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                Verify OTP <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-2 text-[#0F172A] font-semibold hover:underline text-[15px]"
            >
              <ArrowLeft size={18} /> Try another email
            </button>
          </div>
        </form>
      </AuthCard>
    );
  }

  // Step 3: Password Reset
  if (step === 'reset') {
    return (
      <AuthCard
        title="Set new password"
        subtitle="Create a strong password for your account"
      >
        <form onSubmit={handlePasswordReset} className="mt-6">
          <div className="auth-field-group mb-6">
            <label className="auth-field-label" htmlFor="newPassword">New Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Lock size={18} />
              </div>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="auth-input pl-11"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="auth-field-group mb-6">
            <label className="auth-field-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                <Lock size={18} />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="auth-input pl-11"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                Reset Password <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#0F172A] font-semibold hover:underline text-[15px]"
            >
              <ArrowLeft size={18} /> Back to login
            </Link>
          </div>
        </form>
      </AuthCard>
    );
  }
}
