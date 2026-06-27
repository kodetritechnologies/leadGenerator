import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await api.put(`/auth/resetpassword/${token}`, { password });
      if (res.success) {
        setSuccess(true);
        // Refresh Auth Context state to log them in automatically
        await refreshUser();
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Reset link invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-xl glass-panel">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight">New Password</h2>
          <p className="text-sm text-muted-foreground mt-2">Create a secure password for your workspace access.</p>
        </div>

        {success ? (
          <div className="p-4 bg-primary/10 border border-primary/20 text-foreground rounded-lg flex items-center text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
            <span>Password updated! Accessing dashboard...</span>
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
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">New Password</label>
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

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg outline-none text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-sm shadow transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Save Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
