import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, Award, Database, Send, Sliders } from 'lucide-react';
import api from '../services/api';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Credit edit state
  const [editingUserId, setEditingUserId] = useState(null);
  const [creditInput, setCreditInput] = useState('');

  const loadAdminData = async () => {
    try {
      const usersRes = await api.get('/admin/users');
      if (usersRes.success) setUsers(usersRes.data.users);

      const statsRes = await api.get('/admin/stats');
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateCredits = async (userId) => {
    if (!creditInput || isNaN(creditInput)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/credits`, { credits: Number(creditInput) });
      if (res.success) {
        alert('Credits updated successfully!');
        setEditingUserId(null);
        setCreditInput('');
        loadAdminData();
      }
    } catch (err) {
      alert(err.message || 'Error updating credits');
    }
  };

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="h-10 w-44 bg-muted rounded" /><div className="h-64 bg-muted rounded-xl border" /></div>;
  }

  return (
    <div className="space-y-8 text-xs">
      
      <div className="flex items-center space-x-3.5 pb-6 border-b">
        <div className="w-10 h-10 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center justify-center text-red-500">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Global configuration, credits allocations overrides, and statistics audits.</p>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">System Accounts</p>
            <p className="text-xl font-bold font-heading text-foreground mt-0.5">{stats?.totalUsers || 0}</p>
          </div>
          <Users className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="bg-card border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Aggregate Leads</p>
            <p className="text-xl font-bold font-heading text-foreground mt-0.5">{stats?.totalLeads || 0}</p>
          </div>
          <Database className="w-5 h-5 text-purple-500" />
        </div>

        <div className="bg-card border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Outbound emails</p>
            <p className="text-xl font-bold font-heading text-foreground mt-0.5">{stats?.totalEmails || 0}</p>
          </div>
          <Send className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="bg-card border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Pro Subscribers</p>
            <p className="text-xl font-bold font-heading text-foreground mt-0.5">
              {(stats?.plans?.starter || 0) + (stats?.plans?.professional || 0) + (stats?.plans?.enterprise || 0)}
            </p>
          </div>
          <Award className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* User list settings */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/10">
          <h3 className="font-semibold text-sm">Active User Roster</h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Credits</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-muted-foreground">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">{u.name}</td>
                <td className="py-3.5 px-4">{u.email}</td>
                <td className="py-3.5 px-4 uppercase font-semibold text-[10px]">{u.role}</td>
                <td className="py-3.5 px-4 font-bold text-foreground">
                  {editingUserId === u._id ? (
                    <div className="flex items-center space-x-1">
                      <input 
                        type="number"
                        className="w-16 px-1.5 py-0.5 border rounded outline-none text-xs bg-background"
                        value={creditInput}
                        onChange={e => setCreditInput(e.target.value)}
                      />
                      <button 
                        onClick={() => handleUpdateCredits(u._id)}
                        className="px-2 py-0.5 bg-primary text-primary-foreground font-semibold rounded text-[10px]"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingUserId(null)}
                        className="px-2 py-0.5 bg-secondary text-foreground rounded text-[10px]"
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <span>{u.aiCredits}</span>
                  )}
                </td>
                <td className="py-3.5 px-4 capitalize font-semibold">{u.subscription?.plan}</td>
                <td className="py-3.5 px-4 text-right">
                  <button 
                    disabled={editingUserId === u._id}
                    onClick={() => { setEditingUserId(u._id); setCreditInput(u.aiCredits); }}
                    className="px-2 py-1 bg-secondary text-foreground border rounded text-[9px] font-bold hover:bg-secondary/80 flex items-center space-x-1 ml-auto"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Credits</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
