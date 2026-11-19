import React, { useState } from 'react';
import { Plane, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase Console.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase Console.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first, then click Forgot Password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      <div style={styles.wrapper}>
        {/* Left branding panel */}
        <div style={styles.brand}>
          <div style={styles.brandInner}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}><Plane size={28} color="#fff" /></div>
              <span style={styles.logoText}>Aero Space</span>
            </div>
            <h1 style={styles.brandTitle}>Your Journey<br />Starts Here</h1>
            <p style={styles.brandSub}>
              Search, compare and book flights across 500+ destinations.
              Fast, easy and secure.
            </p>
            <div style={styles.featureList}>
              {['Best price guarantee', 'Instant booking confirmation', 'Secure payments', '24/7 customer support'].map(f => (
                <div key={f} style={styles.feature}>
                  <span style={styles.featureDot} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={styles.formPanel}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              {isLogin ? 'Welcome back 👋' : 'Create account ✈️'}
            </h2>
            <p style={styles.formSub}>
              {isLogin
                ? 'Sign in to access your flight bookings'
                : 'Join us and start booking flights today'}
            </p>

            {error && <div style={styles.errorBox}>{error}</div>}
            {resetSent && (
              <div style={styles.successBox}>
                ✅ Password reset email sent! Check your inbox.
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={styles.googleBtn}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37.1 38.9 44 33 44 24c0-1.3-.1-2.7-.4-3.9z"/>
              </svg>
              Continue with Google
            </button>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <div style={styles.dividerLine} />
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Email */}
              <div style={styles.field}>
                <label style={styles.label}>Email address</label>
                <div style={styles.inputWrap}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={styles.input}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrap}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ ...styles.input, paddingRight: '3rem' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    style={styles.forgotBtn}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={styles.submitBtn}
                onMouseEnter={e => !loading && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <p style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setResetSent(false); }}
                style={styles.switchBtn}
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem',
  },
  orb1: {
    position: 'absolute', top: '-10%', left: '-5%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', bottom: '-15%', right: '-5%',
    width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb3: {
    position: 'absolute', top: '40%', left: '40%',
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  wrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    minHeight: '600px',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 1,
  },
  brand: {
    flex: 1,
    background: 'linear-gradient(160deg, rgba(99,102,241,0.9) 0%, rgba(56,189,248,0.8) 100%)',
    padding: '3rem',
    display: 'flex',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  brandInner: { width: '100%' },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem',
  },
  logoIcon: {
    width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)',
    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '1.75rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' },
  brandTitle: {
    fontSize: '2.5rem', fontWeight: '800', color: '#fff',
    lineHeight: 1.2, marginBottom: '1rem',
  },
  brandSub: { color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  feature: { display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', fontSize: '0.95rem' },
  featureDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)', flexShrink: 0,
  },
  formPanel: {
    flex: 1,
    background: 'rgba(15, 23, 42, 0.97)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem',
  },
  formCard: { width: '100%', maxWidth: '380px' },
  formTitle: { fontSize: '1.75rem', fontWeight: '800', color: '#f1f5f9', marginBottom: '0.5rem' },
  formSub: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.75rem' },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', padding: '0.75rem 1rem', borderRadius: '10px',
    fontSize: '0.85rem', marginBottom: '1rem',
  },
  successBox: {
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80', padding: '0.75rem 1rem', borderRadius: '10px',
    fontSize: '0.85rem', marginBottom: '1rem',
  },
  googleBtn: {
    width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.75rem',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem', fontWeight: '600',
    cursor: 'pointer', transition: 'background 0.2s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0',
  },
  dividerLine: { flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' },
  dividerText: { color: '#64748b', fontSize: '0.8rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '1rem', color: '#64748b', pointerEvents: 'none' },
  input: {
    width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: '1rem', background: 'none', border: 'none',
    color: '#64748b', cursor: 'pointer', display: 'flex', padding: 0,
  },
  forgotBtn: {
    alignSelf: 'flex-end', background: 'none', border: 'none',
    color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem',
  },
  submitBtn: {
    width: '100%', padding: '0.9rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
    border: 'none', borderRadius: '12px', color: '#fff',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
    transition: 'opacity 0.2s', marginTop: '0.5rem',
  },
  switchText: { textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.25rem' },
  switchBtn: {
    background: 'none', border: 'none', color: '#6366f1',
    cursor: 'pointer', fontWeight: '700', fontSize: '0.875rem',
  },
};

export default LoginPage;
