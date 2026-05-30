import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, Cloud, Command, Database, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { sendOTPEmail, generateOTP, hashOTP, isEmailJSConfigured } from '../utils/emailjs';
import bcrypt from 'bcryptjs';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for stored direct auth session
    const storedUser = localStorage.getItem('worktrack_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        onLogin(user);
        return;
      } catch (e) {
        localStorage.removeItem('worktrack_user');
      }
    }
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      // Offline/Demo mode fallback
      setTimeout(() => {
        setLoading(false);
        const user = {
          id: 'demo-user-id',
          email: email,
          user_metadata: {
            full_name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase())
          }
        };
        onLogin(user);
        navigate('/dashboard');
      }, 600);
      return;
    }

    try {
      if (isSignUp) {
        // Direct DB signup - bypass Supabase Auth rate limits
        console.log('[SignUp] Direct DB signup for:', email);

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('app_users')
          .select('email')
          .eq('email', email)
          .single();

        if (existingUser) {
          setErrorMsg('An account with this email already exists. Please sign in.');
          setLoading(false);
          return;
        }

        // Hash password with bcrypt (10 rounds)
        const passwordHash = await bcrypt.hash(password, 10);
        const fullName = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());

        // Insert directly into app_users table
        const { data: newUser, error: insertError } = await supabase
          .from('app_users')
          .insert({
            email,
            password_hash: passwordHash,
            full_name: fullName,
            role: 'user',
            status: 'active'
          })
          .select('id, email, full_name, role, status, created_at')
          .single();

        if (insertError) {
          console.error('[SignUp] Insert error:', insertError);
          throw new Error(insertError.message || 'Failed to create account');
        }

        console.log('[SignUp] User created:', newUser);
        setSuccessMsg('Registration successful! Please sign in with your credentials.');
        setIsSignUp(false);
      } else {
        // Direct DB signin - query user and verify password
        console.log('[SignIn] Direct DB signin for:', email);

        const { data: user, error: fetchError } = await supabase
          .from('app_users')
          .select('id, email, password_hash, full_name, role, status, created_at')
          .eq('email', email)
          .single();

        if (fetchError || !user) {
          console.log('[SignIn] User not found or error:', fetchError);
          setErrorMsg('Invalid email or password');
          setLoading(false);
          return;
        }

        // Verify password with bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
          console.log('[SignIn] Invalid password');
          setErrorMsg('Invalid email or password');
          setLoading(false);
          return;
        }

        // Update last_login
        await supabase
          .from('app_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        // Format user object for session
        const sessionUser = {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.full_name,
            role: user.role
          },
          created_at: user.created_at
        };

        // Store in localStorage for session persistence
        localStorage.setItem('worktrack_user', JSON.stringify(sessionUser));

        console.log('[SignIn] Login successful:', sessionUser);
        onLogin(sessionUser);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('[Auth] Caught error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg('Demo mode: Password reset email would be sent to ' + email);
      }, 600);
      return;
    }

    try {
      console.log('[ForgotPassword] Direct DB password reset for:', email);

      // Check if user exists in app_users table
      const { data: user, error: fetchError } = await supabase
        .from('app_users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (fetchError || !user) {
        // Don't reveal if user exists or not for security
        console.log('[ForgotPassword] User not found, but showing generic message');
        setSuccessMsg('If this email exists, an OTP has been sent.');
        setLoading(false);
        return;
      }

      // Generate OTP and hash it
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      // Store OTP hash in app_users table
      const { data: updateData, error: updateError } = await supabase
        .from('app_users')
        .update({
          otp_hash: otpHash,
          otp_expires_at: expiresAt
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('[ForgotPassword] Failed to store OTP:', updateError);
        throw new Error('Failed to generate reset code: ' + updateError.message);
      }

      console.log('[ForgotPassword] OTP stored successfully:', { userId: user.id, expiresAt, updateData });

      // Send OTP via email
      if (isEmailJSConfigured) {
        await sendOTPEmail(email, otp);
      } else {
        console.log('[ForgotPassword] EmailJS not configured, OTP:', otp);
      }

      sessionStorage.setItem('otp_email', email);

      setSuccessMsg('A 6-digit OTP has been sent to your email. Redirecting...');
      setTimeout(() => navigate('/reset-password'), 1200);
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email rate limit')) {
        setErrorMsg('Email rate limit reached. Please wait an hour or check your inbox for a previously sent link.');
      } else {
        setErrorMsg(msg || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'azure') => {
    if (!isSupabaseConfigured) {
      onLogin({
        id: 'demo-oauth-id',
        email: `${provider}@company.com`,
        user_metadata: { full_name: `${provider.toUpperCase()} Operator` }
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'OAuth initialization failed.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-6 bg-surface overflow-hidden">
      {/* Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-tertiary/10 rounded-full blur-[100px]" />
      </div>

      {/* Supabase connection banner indicator */}
      <div className="mb-6 w-full max-w-[480px]">
        {isSupabaseConfigured ? (
          <div className="bg-emerald-50 text-emerald-800 text-xs py-2 px-4 rounded-xl flex items-center justify-between border border-emerald-200">
            <span className="flex items-center gap-2 font-medium">
              <Database size={14} className="text-emerald-600 animate-pulse" />
              Live Supabase Integration Active
            </span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">LIVE SYNC</span>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-800 text-xs py-3 px-4 rounded-xl flex flex-col gap-1.5 border border-amber-200 shadow-sm">
            <span className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert size={15} className="text-amber-600" />
              Supabase Demo Mode (Unconfigured)
            </span>
            <p className="text-amber-700/90 text-[11px] leading-relaxed">
              Define <code className="font-mono bg-amber-100 px-1 py-0.2 rounded text-amber-900">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.2 rounded text-amber-900">VITE_SUPABASE_PUBLISHABLE_KEY</code> in environment settings to enable live database sync. You can sign in using dummy data for now!
            </p>
          </div>
        )}
      </div>

      <main className="w-full max-w-[480px] space-y-12 relative z-10">
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-6 rounded-3xl signature-gradient text-white mb-2 shadow-xl shadow-secondary/20"
          >
            <Briefcase size={40} />
          </motion.div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface">WorkTrack Pro</h1>
          <p className="font-sans text-sm text-on-surface-variant font-medium tracking-widest uppercase">The Digital Curator</p>
        </header>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-on-surface/5 border border-surface-container-high/50 relative overflow-hidden"
        >
          <form className="relative space-y-6" onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
            <h2 className="text-xl font-headline font-bold text-on-surface">
              {isForgotPassword ? 'Reset Your Password' : isSignUp ? 'Create a secure account' : 'Sign In to Dashboard'}
            </h2>

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
              <label className="block text-sm font-bold text-on-surface ml-1 font-headline" htmlFor="email">Email address</label>
              <input
                className="w-full h-14 px-5 rounded-2xl border-none bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all duration-200 outline-none shadow-sm"
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-bold text-on-surface font-headline" htmlFor="password">Password</label>
                {!isSignUp && !isForgotPassword && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-secondary hover:opacity-80 transition-opacity"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                className="w-full h-14 px-5 rounded-2xl border-none bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-secondary/20 focus:bg-white transition-all duration-200 outline-none shadow-sm"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isForgotPassword}
              />
            </div>

            {isForgotPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs font-bold text-secondary hover:opacity-80 transition-opacity"
              >
                ← Back to Sign In
              </button>
            )}

            {!isSignUp && !isForgotPassword && (
              <div className="flex items-center space-x-3 px-1">
                <input
                  className="w-5 h-5 rounded border-surface-container-highest bg-surface-container-low text-secondary focus:ring-secondary/20 focus:ring-offset-0 transition-all cursor-pointer"
                  id="remember"
                  type="checkbox"
                />
                <label className="text-sm font-medium text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Stay signed in for 30 days</label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 signature-gradient text-white rounded-2xl font-headline font-bold text-base shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? (isForgotPassword ? 'Sending...' : 'Authenticating...') : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Workspace Account' : 'Sign In to Dashboard'}</span>
              {!loading && <ArrowRight size={20} />}
            </button>

            {!isForgotPassword && (
              <>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-surface-container-high" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                <span className="bg-white px-4 text-on-surface-variant/60">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center h-12 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-all duration-200 space-x-3 group"
              >
                <Cloud size={18} className="group-hover:scale-110 transition-transform text-secondary" />
                <span className="text-sm font-bold font-headline">Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuthLogin('azure')}
                className="flex items-center justify-center h-12 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-all duration-200 space-x-3 group"
              >
                <Command size={18} className="group-hover:scale-110 transition-transform text-secondary" />
                <span className="text-sm font-bold font-headline">Microsoft</span>
              </button>
            </div>
            </>
            )}
          </form>
        </motion.div>

        <footer className="text-center space-y-8">
          {!isForgotPassword && (
          <p className="text-sm text-on-surface-variant font-medium">
            {isSignUp ? 'Already have an account?' : 'New to the platform?'}
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-secondary font-bold hover:underline underline-offset-4 ml-1"
            >
              {isSignUp ? 'Sign In' : 'Create an account'}
            </button>
          </p>
          )}
          
          <div className="pt-8 opacity-40 grayscale transition-all duration-1000">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDueIa9_VeFlgw1Chf4KE8V7YM2y94IytGEqeT8PbMryGEbffVgiZ710vzQbeofx5HE4CSmRkMtDfGs7askjKIcK8fNA-7TuYX_6dNQdx7B0l8mLZ9GQwdrlNOWhngTCAp2zhD-I9T8_Ia4l_yKeqhWBnK8MMT7m2ngRpMp5d14oIKwmaJOBpn5UfYfHPQZhVY99oFXRBEjgeyihgYgoBc9wroWnUHiyRZupIiAFLCVBYRdT8soVH6mfsOGqyCDF-oxjz5veRh1vgl6" 
              alt="Workspace animate" 
              className="w-24 h-auto mx-auto rounded-2xl shadow-lg" 
            />
          </div>
        </footer>
      </main>
    </div>
  );
}
