import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Terminal, Settings, User, CreditCard, Sparkles, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function CommandPalette({ isOpen, setIsOpen }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { toggleTheme, theme } = useTheme();
  const { logout, user } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const actions = [
    { name: 'Go to Dashboard', icon: Terminal, action: () => navigate('/') },
    { name: 'Lead Search Database', icon: Search, action: () => navigate('/search') },
    { name: 'AI Chat Co-pilot', icon: Sparkles, action: () => navigate('/chat') },
    { name: 'Billing & Subscriptions', icon: CreditCard, action: () => navigate('/billing') },
    { name: 'Admin Control Panel', icon: User, action: () => navigate('/admin') },
    { name: 'Account Settings', icon: Settings, action: () => navigate('/settings') },
    { name: 'Toggle Theme Mode', icon: theme === 'dark' ? Sun : Moon, action: () => toggleTheme() },
    { name: 'Sign Out Account', icon: LogOut, action: () => { logout(); navigate('/login'); } },
  ];

  const filtered = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full max-w-lg overflow-hidden bg-card text-card-foreground border rounded-xl shadow-2xl glass-panel animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 border-b">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, pages, or settings..."
            className="w-full py-4 text-sm bg-transparent outline-none border-none placeholder:text-muted-foreground"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono border rounded bg-muted text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="flex items-center w-full px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  <Icon className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary" />
                  <span className="flex-1 font-medium">{item.name}</span>
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No actions found matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
