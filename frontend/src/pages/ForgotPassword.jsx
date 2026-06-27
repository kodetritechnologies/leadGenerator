import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(''); // Display mock token for easy dev testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgotpassword', { email });
      if (res.success) {
        setSuccess(true);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
      }
    } catch (err) {
      setError(err.message || 'Error executing request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-xl glass-panel">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight">Reset Password</h2>
          <p className="text-sm text-muted-foreground mt-2">Enter your email and we'll send a password recovery link.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/20 text-foreground rounded-lg space-y-2">
              <div className="flex items-center text-primary font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span>Reset link dispatched</span>
              </div>
              <p className="text-xs text-muted-foreground">
                In local environments, we mock the email sending process and supply the reset key directly below.
              </p>
            </div>

            {resetToken && (
              <div className="p-3 bg-muted rounded-lg border font-mono text-[11px] space-y-1">
                <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Dev Reset URL:</span>
                <Link to={`/reset-password/${resetToken}`} className="text-primary hover:underline block break-all">
                  {window.location.origin}/reset-password/{resetToken}
                </Link>
              </div>
            )}

            <Link to="/login" className="block text-center w-full py-2.5 bg-secondary hover:bg-secondary/90 text-foreground font-semibold rounded-lg text-sm transition-colors">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/15 border border-destructive/25 text-destructive rounded-lg text-xs font-semibold flex items-center">
                <ShieldAlert className="w-4 h-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="name@agency.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-sm shadow transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Send Recovery Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
