import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Flame, Sparkles, Send, CalendarClock, CheckCircle, Search, CreditCard, ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/leads/stats');
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981'];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-muted rounded-xl border lg:col-span-2" />
          <div className="h-80 bg-muted rounded-xl border" />
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'text-indigo-500 bg-indigo-500/10', link: '/search' },
    { title: 'Hot Leads', value: stats?.hotLeads || 0, icon: Flame, color: 'text-orange-500 bg-orange-500/10', link: '/search?minOpportunityScore=80' },
    { title: 'New Leads', value: stats?.newLeads || 0, icon: Sparkles, color: 'text-purple-500 bg-purple-500/10', link: '/crm' },
    { title: 'Emails Sent', value: stats?.emailsSent || 0, icon: Send, color: 'text-emerald-500 bg-emerald-500/10', link: '/crm' },
    { title: 'Follow-ups Pending', value: stats?.followUpsPending || 0, icon: CalendarClock, color: 'text-yellow-500 bg-yellow-500/10', link: '/crm' },
    { title: 'Closed Deals', value: stats?.closedDeals || 0, icon: CheckCircle, color: 'text-teal-500 bg-teal-500/10', link: '/crm' },
    { title: 'Audits Run', value: stats?.analysisCompleted || 0, icon: Search, color: 'text-blue-500 bg-blue-500/10', link: '/search' },
    { title: 'Credits Left', value: user?.aiCredits || 0, icon: CreditCard, color: 'text-pink-500 bg-pink-500/10', link: '/billing' },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time metrics, pipeline analytics, and outbound tracking.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link 
              key={idx}
              to={card.link}
              className="bg-card border rounded-xl p-6 flex items-center justify-between hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-bold font-heading group-hover:text-primary transition-colors">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Leads Area Chart */}
        <div className="bg-card border rounded-xl p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-semibold text-base">Monthly Lead Inflow</h3>
            <p className="text-xs text-muted-foreground">Volume of business prospects generated per month.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlyLeads || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--card-foreground))'
                  }} 
                />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Rates & Quick stats */}
        <div className="bg-card border rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-semibold text-base">Sales Efficiency</h3>
            <p className="text-xs text-muted-foreground">Outreach funnel and conversion performance.</p>
          </div>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            
            {/* Conversion Circle */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-2xl font-black text-indigo-500 font-heading">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Average conversion rate</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-500 font-heading">{stats?.emailSuccessRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Email open/reply rate</p>
              </div>
            </div>

            {/* Inflow sources list */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top lead channels</p>
              <div className="space-y-2.5">
                {(stats?.leadSources || []).map((source, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <span className="font-bold text-muted-foreground">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <button 
            onClick={() => window.location.href = '/search'}
            className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Scan new leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
