import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Flame, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message || 'Sign in failed');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background circles */}
      <div className="login-bg-circle circle-1" />
      <div className="login-bg-circle circle-2" />
      <div className="login-bg-circle circle-3" />

      <div className="login-card animate-fade-in-up">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Flame size={36} />
          </div>
          <h1 className="login-title">BodyFuel AI</h1>
          <p className="login-subtitle">Track Your Plate, Predict Your State</p>
        </div>

        {error && (
          <div className="login-error animate-fade-in">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              id="login-email"
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
              id="login-password"
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

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="login-divider">
          <span>or continue with</span>
        </div>

        <button className="btn-secondary google-btn" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <p className="login-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="login-link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
