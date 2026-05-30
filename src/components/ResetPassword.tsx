import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ArrowRight, CheckCircle, AlertCircle, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { generateOTP, hashOTP, sendOTPEmail } from '../utils/emailjs';
import bcrypt from 'bcryptjs';

type Step = 'otp' | 'password';

interface ResetPasswordProps {
  onSuccess?: () => void;
}

export default function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('otp');

  const storedEmail = sessionStorage.getItem('otp_email') || '';
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const entered = otpDigits.join('');
    if (entered.length < 6) { setErrorMsg('Please enter the complete 6-digit OTP.'); return; }

    const email = sessionStorage.getItem('otp_email') || '';
    if (!email) { setErrorMsg('Session expired. Please go back and request a new OTP.'); return; }

    setLoading(true);
    try {
      console.log('[ResetPassword] Verifying OTP for:', email);

      // Get user with OTP hash
      const { data: user, error: fetchError } = await supabase
        .from('app_users')
        .select('id, otp_hash, otp_expires_at')
        .eq('email', email)
        .single();

      console.log('[ResetPassword] User data:', { user, fetchError });

      if (fetchError || !user) {
        console.error('[ResetPassword] User not found:', fetchError);
        setErrorMsg('Invalid session. Please request a new OTP.');
        return;
      }

      // Check if OTP exists and hasn't expired
      if (!user.otp_hash || !user.otp_expires_at) {
        console.error('[ResetPassword] Missing OTP data:', { otp_hash: user.otp_hash, otp_expires_at: user.otp_expires_at });
        setErrorMsg('No active OTP found. Please request a new one.');
        return;
      }

      const expiresAt = new Date(user.otp_expires_at);
      if (expiresAt < new Date()) {
        setErrorMsg('OTP has expired. Please request a new one.');
        return;
      }

      // Verify OTP hash
      const enteredHash = await hashOTP(entered);
      if (enteredHash !== user.otp_hash) {
        setErrorMsg('Invalid OTP. Please check and try again.');
        return;
      }

      console.log('[ResetPassword] OTP verified successfully');
      sessionStorage.setItem('verified_otp_hash', enteredHash);
      sessionStorage.setItem('verified_otp_email', email);
      setStep('password');
    } catch (err: any) {
      console.error('[ResetPassword] Verification error:', err);
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!storedEmail || resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      console.log('[ResetPassword] Resending OTP for:', storedEmail);

      // Check if user exists
      const { data: user, error: fetchError } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', storedEmail)
        .single();

      if (fetchError || !user) {
        setErrorMsg('User not found. Please restart the reset flow.');
        return;
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      // Update OTP in database
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          otp_hash: otpHash,
          otp_expires_at: expiresAt
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[ResetPassword] Failed to update OTP:', updateError);
        throw new Error('Failed to generate new OTP');
      }

      // Send OTP via email
      await sendOTPEmail(storedEmail, otp);

      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendCooldown(60);
      setSuccessMsg('New OTP sent! Check your email.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setErrorMsg('Passwords do not match.'); return; }

    const email = sessionStorage.getItem('verified_otp_email') || '';
    const otpHash = sessionStorage.getItem('verified_otp_hash') || '';
    if (!email || !otpHash) { setErrorMsg('Session lost. Please restart the reset flow.'); return; }

    setLoading(true);
    try {
      console.log('[ResetPassword] Updating password for:', email);

      // Get user and verify OTP one more time
      const { data: user, error: fetchError } = await supabase
        .from('app_users')
        .select('id, otp_hash, otp_expires_at')
        .eq('email', email)
        .single();

      if (fetchError || !user) {
        console.error('[ResetPassword] User not found:', fetchError);
        setErrorMsg('No account found for this email.');
        return;
      }

      // Verify OTP hash matches
      if (user.otp_hash !== otpHash) {
        setErrorMsg('OTP mismatch. Please restart the reset flow.');
        return;
      }

      // Check if OTP expired
      const expiresAt = new Date(user.otp_expires_at);
      if (expiresAt < new Date()) {
        setErrorMsg('OTP has expired. Please request a new one.');
        setStep('otp');
        return;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update password and clear OTP
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          password_hash: passwordHash,
          otp_hash: null,
          otp_expires_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('[ResetPassword] Failed to update password:', updateError);
        throw new Error('Failed to update password');
      }

      console.log('[ResetPassword] Password updated successfully');

      // Clear session storage
      sessionStorage.removeItem('otp_email');
      sessionStorage.removeItem('verified_otp_hash');
      sessionStorage.removeItem('verified_otp_email');

      setSuccessMsg('Password updated successfully! Redirecting to login...');
      setTimeout(() => { if (onSuccess) onSuccess(); else navigate('/login'); }, 1500);
    } catch (err: any) {
      console.error('[ResetPassword] Update error:', err);
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.15 } },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-6 bg-surface overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-tertiary/10 rounded-full blur-[100px]" />
      </div>

      <main className="w-full max-w-[480px] space-y-10 relative z-10">
        <header className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-6 rounded-3xl signature-gradient text-white mb-2 shadow-xl shadow-secondary/20"
          >
            <Briefcase size={40} />
          </motion.div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface">WorkTrack Pro</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            {(['otp', 'password'] as Step[]).map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-secondary' : i < (['otp', 'password'] as Step[]).indexOf(step) ? 'w-4 bg-secondary/40' : 'w-4 bg-surface-container-high'}`} />
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 'otp' && (
            <motion.div key="otp" variants={cardVariants} initial="initial" animate="animate" exit="exit"
              className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-on-surface/5 border border-surface-container-high/50"
            >
              <form className="space-y-6" onSubmit={handleVerifyOTP}>
                <div>
                  <h2 className="text-xl font-headline font-bold text-on-surface">Enter your OTP</h2>
                  {storedEmail && (
                    <p className="text-sm text-on-surface-variant mt-1">
                      We sent a 6-digit code to <span className="font-semibold text-on-surface">{storedEmail}</span>
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-xl flex items-start gap-2.5 border border-rose-200">
                    <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl flex items-start gap-2.5 border border-emerald-200">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-between" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 bg-surface-container-low text-on-surface focus:border-secondary focus:bg-white focus:outline-none transition-all duration-200 shadow-sm"
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-14 signature-gradient text-white rounded-2xl font-headline font-bold text-base shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
                  {!loading && <ArrowRight size={20} />}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Didn't receive the code?</span>
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1.5 text-secondary font-semibold hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed transition-all"
                  >
                    <RotateCcw size={14} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'password' && (
            <motion.div key="password" variants={cardVariants} initial="initial" animate="animate" exit="exit"
              className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-on-surface/5 border border-surface-container-high/50"
            >
              <form className="space-y-6" onSubmit={handleUpdatePassword}>
                <h2 className="text-xl font-headline font-bold text-on-surface">Set new password</h2>

                {errorMsg && (
                  <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-xl flex items-start gap-2.5 border border-rose-200">
                    <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl flex items-start gap-2.5 border border-emerald-200">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface font-headline" htmlFor="new-password">New Password</label>
                  <div className="relative">
                    <input id="new-password" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full h-14 px-5 pr-12 rounded-2xl border-none bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all duration-200 outline-none shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface font-headline" htmlFor="confirm-password">Confirm Password</label>
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required
                    className="w-full h-14 px-5 rounded-2xl border-none bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all duration-200 outline-none shadow-sm"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-14 signature-gradient text-white rounded-2xl font-headline font-bold text-base shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Updating...' : 'Update Password'}</span>
                  {!loading && <ArrowRight size={20} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-on-surface-variant">
          <button onClick={() => navigate('/login')} className="text-secondary font-semibold hover:underline">
            Back to Sign In
          </button>
        </p>
      </main>
    </div>
  );
}
