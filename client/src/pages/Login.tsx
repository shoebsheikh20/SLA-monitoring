import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Zap, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@slapulse.io');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-iris/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-iris/4 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-glass-border p-2.5 mb-4 shadow-2xl shadow-iris/20 backdrop-blur-md">
            <img src="/logo.png" alt="SLA Pulse Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">SLA Pulse</h1>
          <p className="text-text-muted text-sm">System Performance Monitor</p>
        </div>

        {/* Card */}
        <div className="glass-card-static rounded-2xl p-8 shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-text-muted text-sm mt-1">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-critical/10 border border-critical/25 text-critical text-sm mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@slapulse.io"
                  className="input-glass pl-9"
                  required
                  autoComplete="email"
                  id="email-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-glass pl-9 pr-10"
                  required
                  autoComplete="current-password"
                  id="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-iris/30 bg-dark-bg accent-iris cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-text-muted cursor-pointer">
                Remember me for 7 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm mt-2"
              id="login-btn"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-xl bg-iris/8 border border-iris/15 text-center">
            <p className="text-xs text-text-muted">
              Demo credentials pre-filled ·{' '}
              <span className="text-iris-bright font-medium">admin@slapulse.io</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          SLA Pulse v1.0 · Enterprise Performance Monitoring
        </p>
      </div>
    </div>
  );
}
