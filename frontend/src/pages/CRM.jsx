import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Star, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import api from '../services/api';

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCRMLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', { params: { limit: 100 } });
      if (res.success) {
        setLeads(res.data.leads);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMLeads();
  }, []);

  const pipelineStages = [
    { key: 'new', label: 'New Lead', color: 'border-t-blue-500 bg-blue-500/5' },
    { key: 'qualified', label: 'Qualified', color: 'border-t-indigo-500 bg-indigo-500/5' },
    { key: 'contacted', label: 'Contacted', color: 'border-t-yellow-500 bg-yellow-500/5' },
    { key: 'proposal_sent', label: 'Proposal Sent', color: 'border-t-purple-500 bg-purple-500/5' },
    { key: 'won', label: 'Won', color: 'border-t-emerald-500 bg-emerald-500/5' },
    { key: 'lost', label: 'Lost', color: 'border-t-red-500 bg-red-500/5' }
  ];

  const moveStage = async (leadId, currentStatus, direction) => {
    const currentIndex = pipelineStages.findIndex(s => s.key === currentStatus);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= pipelineStages.length) return;

    const newStatus = pipelineStages[newIndex].key;

    // Optimistically update
    setLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: newStatus } : l));

    try {
      await api.put(`/leads/${leadId}/status`, { status: newStatus });
    } catch (e) {
      console.error(e);
      fetchCRMLeads(); // rollback on error
    }
  };

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="h-10 w-44 bg-muted rounded" /><div className="grid grid-cols-6 gap-4 h-96 bg-muted rounded-xl border" /></div>;
  }

  return (
    <div className="space-y-6 text-xs h-[calc(100vh-10rem)] flex flex-col">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <FolderKanban className="w-7 h-7 mr-2.5 text-primary" />
          <span>Sales Pipeline CRM</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage client discovery stages and outreach states in columns.</p>
      </div>

      {/* Kanban Board columns */}
      <div className="flex-1 flex overflow-x-auto gap-4 pb-4 items-start pr-1 select-none">
        
        {pipelineStages.map((stage) => {
          const stageLeads = leads.filter(l => l.status === stage.key);
          return (
            <div 
              key={stage.key} 
              className={`w-72 md:w-80 flex-shrink-0 border border-t-2 rounded-xl flex flex-col h-full max-h-full overflow-hidden shadow-sm ${stage.color}`}
            >
              {/* Header column title */}
              <div className="p-3 border-b flex justify-between items-center bg-card/65 font-bold">
                <span className="text-[11px] text-foreground">{stage.label}</span>
                <span className="px-1.5 py-0.5 bg-secondary text-muted-foreground rounded-full text-[9px]">
                  {stageLeads.length}
                </span>
              </div>

              {/* Card stack inside lane */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {stageLeads.length > 0 ? (
                  stageLeads.map((lead) => {
                    const b = lead.business;
                    return (
                      <div 
                        key={lead._id}
                        className="p-3 bg-card border rounded-lg hover:shadow transition-shadow space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-foreground truncate max-w-[120px]">{b.name}</h4>
                            {lead.isBookmarked && <Bookmark className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{b.industry} • {b.city}</p>
                        </div>

                        <div className="flex justify-between items-center border-t pt-2">
                          <div className="flex items-center space-x-0.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold font-mono text-[10px]">{b.rating}</span>
                          </div>
                          
                          {/* Navigation buttons */}
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => moveStage(lead._id, lead.status, -1)}
                              className="p-1 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
                              title="Move left"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <Link 
                              to={`/search/${lead._id}`} 
                              className="px-2 py-0.5 bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary rounded text-[9px] font-bold"
                            >
                              Inspect
                            </Link>
                            <button 
                              onClick={() => moveStage(lead._id, lead.status, 1)}
                              className="p-1 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
                              title="Move right"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-muted-foreground italic text-center py-4 opacity-55">Lane empty</p>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
