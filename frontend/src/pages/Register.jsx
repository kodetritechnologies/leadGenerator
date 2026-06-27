import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed. Check details.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-xl glass-panel relative z-10">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Kodetri Technologies Logo" className="mx-auto h-20 w-auto mb-6 object-contain" />
          <h2 className="text-3xl font-heading font-extrabold tracking-tight">Create Workspace</h2>
          <p className="text-sm text-muted-foreground mt-2">Initialize your MERN agency co-pilot account.</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-destructive/15 border border-destructive/25 text-destructive rounded-lg flex items-center text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="john@agency.com"
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="•••••••• (Min 6 chars)"
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Workspace Role selection is removed */}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-sm shadow transition-colors mt-6 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Setup Account'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
        </p>

      </div>
    </div>
  );
}
