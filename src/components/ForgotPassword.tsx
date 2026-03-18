import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import AuthCard from './AuthCard';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast.success('Reset link sent to your email');
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      let message = 'Failed to send reset link. Please try again.';
      if (error.code === 'auth/user-not-found') message = '❌ User not found.';
      else if (error.code === 'auth/invalid-email') message = '❌ Invalid email address.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We've sent a password reset link to ${email}`}
      >
        <div className="mt-6 text-center">
          <div className="w-16 h-16 bg-[#F0FDF4] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
          </div>
          <p className="text-[#64748B] text-[15px] mb-8">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <button
            onClick={() => setIsSent(false)}
            className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2"
          >
            Try another email
          </button>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-[#0F172A] font-semibold hover:underline text-[15px]"
          >
            <ArrowLeft size={18} /> Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions."
    >
      <form onSubmit={handleSubmit} className="mt-6">
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
              Send reset link <ArrowRight size={20} />
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
