import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowRight, RefreshCw, ArrowLeft, CheckCircle2, KeyRound, Lock, Eye, EyeOff, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthCard from './AuthCard';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<{ message: string; link: string } | null>(null);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503 && data.link) {
          setApiError({ message: data.error, link: data.link });
          throw new Error(data.error);
        }
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep('otp');
      toast.success('OTP sent! Check your inbox.');
    } catch (error: any) {
      console.error("Send OTP Error:", error);
      if (!apiError) toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setStep('password');
      toast.success('OTP verified!');
    } catch (error: any) {
      console.error("Verify OTP Error:", error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <AuthCard
        title="Password Reset!"
        subtitle="Your password has been updated successfully."
      >
        <div className="mt-6 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-[#F0FDF4] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 size={32} />
          </motion.div>
          <p className="text-[#64748B] text-[15px] mb-8">
            You can now log in with your new password.
          </p>
          <Link
            to="/login"
            className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2"
          >
            Go to Login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={step === 'email' ? "Forgot password?" : step === 'otp' ? "Verify OTP" : "New Password"}
      subtitle={
        step === 'email' ? "No worries, we'll send you an OTP." : 
        step === 'otp' ? `We've sent a 6-digit code to ${email}` : 
        "Set your new secure password."
      }
    >
      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.form
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSendOtp}
            className="mt-6"
          >
            {apiError && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-3">
                <div className="flex gap-3 text-amber-800">
                  <AlertCircle className="shrink-0" size={20} />
                  <p className="text-sm font-medium leading-relaxed">{apiError.message}</p>
                </div>
                <a 
                  href={apiError.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
                >
                  Enable API Now <ExternalLink size={14} />
                </a>
              </div>
            )}

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
          </motion.form>
        )}

        {step === 'otp' && (
          <motion.form
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerifyOtp}
            className="mt-6"
          >
            <div className="auth-field-group mb-6">
              <label className="auth-field-label" htmlFor="otp">Verification Code</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <KeyRound size={18} />
                </div>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="auth-input pl-11 tracking-[0.5em] font-mono text-lg"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                Check your inbox for the code. It may take a minute to arrive.
              </p>
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

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full mt-4 text-[#64748B] text-[14px] hover:text-[#0F172A] transition-colors"
            >
              Back to email
            </button>
          </motion.form>
        )}

        {step === 'password' && (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword}
            className="mt-6"
          >
            <div className="auth-field-group mb-4">
              <label className="auth-field-label" htmlFor="newPassword">New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <Lock size={18} />
                </div>
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="auth-input pl-11 pr-11"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="auth-input pl-11 pr-11"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
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
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[#0F172A] font-semibold hover:underline text-[15px]"
        >
          <ArrowLeft size={18} /> Back to login
        </Link>
      </div>
    </AuthCard>
  );
}
