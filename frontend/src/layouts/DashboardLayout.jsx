import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Sparkles, FolderKanban, Users, 
  CreditCard, ShieldAlert, LogOut, Sun, Moon, Bell, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import CommandPalette from '../components/CommandPalette';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Command palette hotkey (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Lead Finder', path: '/search', icon: Search },
    { name: 'AI Chat Co-pilot', path: '/chat', icon: Sparkles },
    { name: 'CRM Pipeline', path: '/crm', icon: FolderKanban },
    { name: 'Billing', path: '/billing', icon: CreditCard },
    { name: 'Admin Console', path: '/admin', icon: ShieldAlert },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen w-screen flex bg-background text-foreground transition-colors duration-200 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-card flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Kodetri Technologies Logo" className="h-10 w-auto object-contain" />
          </Link>
          <button className="lg:hidden p-1 rounded hover:bg-muted" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Account / Credits Panel */}
        <div className="p-4 border-t space-y-3 bg-muted/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-primary uppercase">
              {user?.name?.substring(0, 2) || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-1.5 border border-border">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>AI Credits remaining:</span>
              <span className="font-bold text-foreground">{user?.aiCredits}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: (() => {
                    const planLimits = { free: 100, starter: 500, professional: 2000, enterprise: 10000 };
                    const max = planLimits[user?.subscription?.plan || 'free'] || 100;
                    return `${Math.min(100, Math.max(0, ((user?.aiCredits || 0) / max) * 100))}%`;
                  })()
                }} 
              />
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out Account
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="sticky top-0 h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 rounded hover:bg-muted" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search Palette Trigger */}
            <button 
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 border rounded-lg text-xs bg-muted/40 hover:bg-muted text-muted-foreground transition-all cursor-text w-64 justify-between"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5" />
                <span>Search dashboard...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono border rounded bg-card">Ctrl+K</kbd>
            </button>
          </div>

          {/* Right Header Panel Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              title="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-card animate-pulse" />
                )}
              </button>

              {/* Notification Overlay Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                    <span className="font-semibold text-sm">Real-time Notifications</span>
                    {notifications.length > 0 && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                        {notifications.length} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y">
                    {notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <div key={i} className="p-3 text-xs hover:bg-muted/50 transition-colors">
                          <p className="font-semibold text-foreground">{n.title}</p>
                          <p className="text-muted-foreground mt-0.5">{n.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-muted-foreground text-xs">
                        No notifications to display
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile widget */}
            <div className="flex items-center space-x-2 border-l pl-3 ml-1">
              <span className="text-xs font-semibold hidden sm:inline-block">{user?.name}</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">
                {user?.subscription?.plan}
              </span>
            </div>

          </div>
        </header>

        {/* Scrollable Workspace Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/20">
          <Outlet />
        </main>
      </div>

      {/* Command Palette portal */}
      <CommandPalette isOpen={commandPaletteOpen} setIsOpen={setCommandPaletteOpen} />
    </div>
  );
}
