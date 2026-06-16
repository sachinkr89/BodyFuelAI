import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Flame, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuthStore();

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (password.length < 8) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (/(?=.*[A-Z])(?=.*[0-9])/.test(password) && password.length >= 8)
      return { level: 4, label: 'Strong', color: '#10b981' };
    return { level: 3, label: 'Good', color: '#06b6d4' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err.message || 'Sign up failed');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-bg-circle circle-1" />
        <div className="login-bg-circle circle-2" />
        <div className="login-card animate-scale-in" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 12, color: 'var(--text-primary)' }}>
            Check Your Email
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
            We've sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Click the link to activate your account.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'inline-block', padding: '12px 32px', textDecoration: 'none' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg-circle circle-1" />
      <div className="login-bg-circle circle-2" />
      <div className="login-bg-circle circle-3" />

      <div className="login-card animate-fade-in-up">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Flame size={36} />
          </div>
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">Start your nutrition journey with AI</p>
        </div>

        {error && (
          <div className="login-error animate-fade-in">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              id="signup-name"
              type="text"
              className="input-field"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              id="signup-email"
              type="email"
              className="input-field"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.level / 4) * 100}%`,
                    background: passwordStrength.color,
                  }}
                />
              </div>
              <span style={{ color: passwordStrength.color, fontSize: '0.75rem' }}>
                {passwordStrength.label}
              </span>
            </div>
          )}

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              id="signup-confirm"
              type="password"
              className="input-field"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="login-footer">
          Already have an account?{' '}
          <Link to="/login" className="login-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
