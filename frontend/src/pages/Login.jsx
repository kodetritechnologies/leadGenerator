import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed. Verify your email and password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-xl glass-panel relative z-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Kodetri Technologies Logo" className="mx-auto h-20 w-auto mb-6 object-contain" />
          <h2 className="text-3xl font-heading font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to manage your workspace and find leads.</p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-destructive/15 border border-destructive/25 text-destructive rounded-lg flex items-center text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="you@agency.com"
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-sm shadow transition-colors mt-6 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">Create account</Link>
        </p>

      </div>
    </div>
  );
}
