import { useState } from 'react';
import { Plane, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

const LoginPage = ({ onCancel, pendingMessage }) => {
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

    if (!isLogin) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
        setError('Password must contain at least one letter and one number.');
        return;
      }
    }

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
    <div className="login-page-container" style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '900px',
        minHeight: '560px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--surface-border)',
        backgroundColor: 'var(--surface-color)',
        flexDirection: 'row'
      }}>
        {/* Left Branding Panel */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--surface-subtle)',
          borderRight: '1px solid var(--surface-border)',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                backgroundColor: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plane size={22} style={{ color: 'var(--accent-color)' }} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Aero Space
              </span>
            </div>

            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em'
            }}>
              Your journey starts here.
            </h1>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              marginBottom: '2rem'
            }}>
              Search, compare, and reserve domestic flights with real-time seat inventory and transparent pricing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                'Real-time seat selection & radar tracking',
                'Transparent pricing with zero hidden fees',
                'Instant e-ticket & digital boarding pass',
                '24/7 dedicated customer service'
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} Aero Space Technologies. All rights reserved.
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{
          flex: 1.15,
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'var(--surface-color)'
        }}>
          <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '1.25rem',
                  padding: 0,
                  fontWeight: 600
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to Search Flights</span>
              </button>
            )}

            {pendingMessage && (
              <div style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-color)',
                color: 'var(--text-primary)',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4
              }}>
                <Plane size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                <span>{pendingMessage}</span>
              </div>
            )}

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.35rem',
              letterSpacing: '-0.015em'
            }}>
              {isLogin ? 'Sign in to Aero Space' : 'Create an account'}
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              {isLogin
                ? 'Access your saved trips and current flight bookings'
                : 'Enter your credentials below to begin booking'}
            </p>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-color)',
                color: 'var(--danger-color)',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {resetSent && (
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-color)',
                color: 'var(--success-color)',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckCircle2 size={16} />
                <span>Password reset link sent! Check your inbox.</span>
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37.1 38.9 44 33 44 24c0-1.3-.1-2.7-.4-3.9z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or with email</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--surface-border)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Email address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.875rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="input-field"
                    style={{ padding: '0.625rem 0.875rem 0.625rem 2.5rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.875rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input-field"
                    style={{ padding: '0.625rem 2.5rem 0.625rem 2.5rem', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: '2px'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    style={{
                      alignSelf: 'flex-end',
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-color)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      padding: '2px 0',
                      marginTop: '0.15rem',
                      fontWeight: 500
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.6875rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '1.25rem' }}>
              {isLogin ? "Don't have an account? " : 'Already registered? '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); setResetSent(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8125rem'
                }}
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

export default LoginPage;
