import React, { useState } from 'react';
import { User, Settings as SettingsIcon, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 text-xs max-w-2xl">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure user accounts details, view credit statuses and edit appearance styles.</p>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
        <h3 className="font-semibold text-sm border-b pb-2 flex items-center">
          <User className="w-4 h-4 text-primary mr-1.5" />
          <span>Profile Specifications</span>
        </h3>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-lg flex items-center font-bold">
            <ShieldCheck className="w-4 h-4 mr-2" />
            <span>Profile details updated (Simulated)!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
              <input 
                type="text" required
                className="w-full px-3 py-2 border rounded-lg bg-background outline-none focus:border-primary text-xs"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase">Email Address (Read-only)</label>
              <input 
                type="email" disabled
                className="w-full px-3 py-2 border rounded-lg bg-muted/40 text-muted-foreground outline-none text-xs"
                value={email}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">User Authorization Role</p>
              <p className="font-bold text-foreground mt-1 uppercase tracking-wider text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full w-fit">
                {user?.role}
              </p>
            </div>
            
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Credit Balance</p>
              <p className="font-bold text-foreground mt-1 text-sm">{user?.aiCredits} credits</p>
            </div>
          </div>

          <button 
            type="submit"
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg shadow transition-colors"
          >
            Save Profile Configurations
          </button>
        </form>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-sm border-b pb-2 flex items-center">
          <SettingsIcon className="w-4 h-4 text-primary mr-1.5" />
          <span>Platform Theme Preferences</span>
        </h3>
        
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-foreground">Color Palette Mode</p>
            <p className="text-muted-foreground mt-0.5">Toggle between dark mode (Vercel style) or classic light settings.</p>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-secondary border hover:bg-muted text-foreground font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-yellow-500" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>Dark Theme</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
