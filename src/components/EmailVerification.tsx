import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthCard from './AuthCard';

export default function EmailVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(59);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newCode = [...code];
    pastedData.forEach((char, i) => {
      if (/^\d$/.test(char)) newCode[i] = char;
    });
    setCode(newCode);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Email verified successfully!');
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(59);
    toast.success('New verification code sent to your email');
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We've sent a 6-digit code to your email address. Please enter it below to continue."
    >
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#0F172A]">
            <Mail size={32} />
          </div>
        </div>

        <div className="verification-grid" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="verification-input"
              disabled={isSubmitting}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || code.some(d => !d)}
          className="w-full h-[52px] bg-[#0A0A0A] text-white rounded-[12px] font-semibold text-[16px] hover:bg-[#262626] active:scale-[0.98] transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <RefreshCw className="animate-spin" size={20} />
          ) : (
            <>
              Verify Email <ArrowRight size={20} />
            </>
          )}
        </button>

        <div className="mt-8 text-center">
          <p className="text-[#64748B] text-[15px]">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0}
              className={`font-semibold transition-colors ${
                timer > 0 ? 'text-[#94A3B8] cursor-not-allowed' : 'text-[#0F172A] hover:underline'
              }`}
            >
              Resend {timer > 0 ? `in ${timer}s` : ''}
            </button>
          </p>
        </div>
      </form>
    </AuthCard>
  );
}
