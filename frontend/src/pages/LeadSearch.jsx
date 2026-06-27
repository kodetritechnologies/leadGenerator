import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Plus, Download, Star, ExternalLink, Bookmark, BookmarkCheck, ArrowLeftRight, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LeadSearch() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Search/Filter states
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedIndustry, setSelectedIndustry] = useState(searchParams.get('industry') || '');
  const [websiteStatus, setWebsiteStatus] = useState(searchParams.get('websiteStatus') || '');
  const [minRating, setMinRating] = useState('');
  const [minOppScore, setMinOppScore] = useState(searchParams.get('minOpportunityScore') || '');
  const [bookmarkOnly, setBookmarkOnly] = useState(searchParams.get('isBookmarked') === 'true');
  const [cities, setCities] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Manual Add Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '', website: '', email: '', phone: '', address: '', city: 'Mumbai', industry: 'Restaurants', rating: '4.0'
  });
  const [modalError, setModalError] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search: searchTerm,
        city: selectedCity,
        industry: selectedIndustry,
        websiteStatus,
        minRating,
        minOpportunityScore: minOppScore,
        isBookmarked: bookmarkOnly ? 'true' : undefined
      };

      const res = await api.get('/leads', { params });
      if (res.success) {
        setLeads(res.data.leads);
        setTotalPages(res.data.totalPages);
        setTotalLeads(res.data.totalLeads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, selectedCity, selectedIndustry, websiteStatus, minRating, minOppScore, bookmarkOnly]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/leads/cities');
        if (res.success) {
          setCities(res.data.cities);
        }
      } catch (err) {
        console.error('Error fetching active cities:', err);
      }
    };
    fetchCities();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleToggleBookmark = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.put(`/leads/${id}/bookmark`);
      if (res.success) {
        setLeads(prev => prev.map(l => l._id === id ? { ...l, isBookmarked: res.data.isBookmarked } : l));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const res = await api.post('/leads', newLead);
      if (res.success) {
        setModalOpen(false);
        setNewLead({ name: '', website: '', email: '', phone: '', address: '', city: 'Mumbai', industry: 'Restaurants', rating: '4.0' });
        setPage(1);
        fetchLeads();
      }
    } catch (err) {
      setModalError(err.message || 'Error inserting lead');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/leads/export', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Finder</h1>
          <p className="text-sm text-muted-foreground mt-1">Search cold prospect companies and analyze opportunities.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 border"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Grid Filters & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Sidebar Filters Toggle for Mobile */}
        <div className="lg:hidden flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
          <button 
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center text-xs font-semibold hover:text-primary transition-colors py-1.5 px-3 border rounded-lg bg-background text-foreground"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{filtersOpen ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
          <span className="text-[10px] text-muted-foreground font-bold font-mono">Found: {totalLeads} records</span>
        </div>

        {/* Sidebar Filters */}
        <div className={`bg-card border rounded-xl p-5 space-y-5 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-sm flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <span>Filters</span>
            </h3>
            <button 
              onClick={() => {
                setSelectedCity('');
                setSelectedIndustry('');
                setWebsiteStatus('');
                setMinRating('');
                setMinOppScore('');
                setBookmarkOnly(false);
                setSearchTerm('');
              }}
              className="text-[10px] text-primary font-bold hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4">
            
            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">City</label>
              <div className="relative">
                <select 
                  value={selectedCity}
                  onChange={e => { setSelectedCity(e.target.value); setPage(1); }}
                  className="w-full text-xs pl-3 pr-8 py-2.5 border rounded-lg bg-background border-border appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">All Cities</option>
                  {cities.map((city, idx) => (
                    <option key={idx} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Industry</label>
              <div className="relative">
                <select 
                  value={selectedIndustry}
                  onChange={e => { setSelectedIndustry(e.target.value); setPage(1); }}
                  className="w-full text-xs pl-3 pr-8 py-2.5 border rounded-lg bg-background border-border appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">All Industries</option>
                  <option value="Restaurants">Restaurants</option>
                  <option value="Dentists">Dentists</option>
                  <option value="Hotels">Hotels</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Gyms">Gyms</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Website existence */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Website</label>
              <div className="relative">
                <select 
                  value={websiteStatus}
                  onChange={e => { setWebsiteStatus(e.target.value); setPage(1); }}
                  className="w-full text-xs pl-3 pr-8 py-2.5 border rounded-lg bg-background border-border appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">All statuses</option>
                  <option value="available">Has Website</option>
                  <option value="missing">Missing Website</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Min Google Rating</label>
              <div className="relative">
                <select 
                  value={minRating}
                  onChange={e => { setMinRating(e.target.value); setPage(1); }}
                  className="w-full text-xs pl-3 pr-8 py-2.5 border rounded-lg bg-background border-border appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Any Rating</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Min Opp Score */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Opportunity Score</label>
              <div className="relative">
                <select 
                  value={minOppScore}
                  onChange={e => { setMinOppScore(e.target.value); setPage(1); }}
                  className="w-full text-xs pl-3 pr-8 py-2.5 border rounded-lg bg-background border-border appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Any Score</option>
                  <option value="80">Hot (80+ Score)</option>
                  <option value="50">Average (50+ Score)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Bookmark Filter */}
            <div className="flex items-center space-x-2 pt-2">
              <input 
                id="bookmark-filter"
                type="checkbox"
                checked={bookmarkOnly}
                onChange={e => { setBookmarkOnly(e.target.checked); setPage(1); }}
                className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="bookmark-filter" className="text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                Bookmarked Only
              </label>
            </div>

          </div>
        </div>

        {/* Lead Table List */}
        <div className="bg-card border rounded-xl lg:col-span-3 overflow-hidden shadow-sm flex flex-col justify-between min-h-[500px]">
          
          <div className="p-4 border-b">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search business names, tags, or cities..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </form>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-12 space-y-4">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="h-12 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : leads.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-12 text-center"></th>
                    <th className="py-3 px-4">Business</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Industry</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Website</th>
                    <th className="py-3 px-4 text-center">Opportunity</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => {
                    const b = lead.business;
                    const hasWebsite = b.website && b.website !== 'none';
                    return (
                      <tr key={lead._id} className="hover:bg-muted/30 transition-colors group">
                        <td className="py-3.5 px-4 text-center align-middle">
                          <button 
                            onClick={(e) => handleToggleBookmark(lead._id, e)}
                            className="p-1 rounded text-muted-foreground hover:bg-muted"
                          >
                            {lead.isBookmarked 
                              ? <BookmarkCheck className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                              : <Bookmark className="w-4 h-4 hover:text-indigo-500" />
                            }
                          </button>
                        </td>
                        <td 
                          className="py-3.5 px-4 font-semibold text-foreground align-middle max-w-[160px] truncate"
                          title={b.name}
                        >
                          {b.name}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground align-middle">{b.city}</td>
                        <td className="py-3.5 px-4 text-muted-foreground align-middle">{b.industry}</td>
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{b.rating || 0}</span>
                            <span className="text-[10px] text-muted-foreground">({b.userRatingsTotal || 0})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          {hasWebsite ? (
                            <a 
                              href={b.website} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center space-x-1"
                            >
                              <span className="truncate max-w-[120px]">{b.website.replace(/https?:\/\/(www\.)?/, '')}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                              Missing Website
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${lead.opportunityScore >= 80 ? 'bg-orange-500/15 text-orange-500' : lead.opportunityScore > 0 ? 'bg-indigo-500/15 text-indigo-500' : 'bg-muted text-muted-foreground'}`}>
                            {lead.opportunityScore > 0 ? `${lead.opportunityScore}/100` : 'Not Scanned'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right align-middle">
                          <Link 
                            to={`/search/${lead._id}`}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold rounded transition-all inline-flex items-center justify-center whitespace-nowrap"
                          >
                            Inspect Lead
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <Bookmark className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
                <h3 className="font-semibold text-base">No Leads Found</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  We couldn't find any business records matching your search queries. Try cleaning your filters.
                </p>
              </div>
            )}
          </div>

          {/* Table Footer / Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Showing page {page} of {totalPages} ({totalLeads} total records)</span>
              <div className="flex space-x-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 border rounded text-[11px] font-semibold hover:bg-muted disabled:opacity-40"
                >
                  Previous
                </button>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 border rounded text-[11px] font-semibold hover:bg-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Manual Insert Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold font-heading mb-4">Add Business Lead Manually</h2>
            {modalError && (
              <div className="p-3 mb-4 bg-red-500/10 text-red-500 rounded border text-xs">{modalError}</div>
            )}
            <form onSubmit={handleCreateLead} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Company Name</label>
                <input 
                  type="text" required placeholder="e.g. Apex Gyms"
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.name}
                  onChange={e => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Website URL</label>
                <input 
                  type="text" placeholder="e.g. http://site.com (or leave empty)"
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.website}
                  onChange={e => setNewLead(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Business Email</label>
                <input 
                  type="email" placeholder="e.g. hello@site.com"
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.email}
                  onChange={e => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Phone</label>
                <input 
                  type="text" placeholder="e.g. +91 99999 88888"
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.phone}
                  onChange={e => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">City</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.city}
                  onChange={e => setNewLead(prev => ({ ...prev, city: e.target.value }))}
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Indore">Indore</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Industry</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.industry}
                  onChange={e => setNewLead(prev => ({ ...prev, industry: e.target.value }))}
                >
                  <option value="Restaurants">Restaurants</option>
                  <option value="Dentists">Dentists</option>
                  <option value="Hotels">Hotels</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Gyms">Gyms</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Google Rating</label>
                <input 
                  type="number" step="0.1" min="0" max="5" required
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.rating}
                  onChange={e => setNewLead(prev => ({ ...prev, rating: e.target.value }))}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Address Details</label>
                <input 
                  type="text" placeholder="e.g. Bandra Road, Opposite Metro Station"
                  className="w-full px-3 py-2 border rounded-lg bg-background outline-none"
                  value={newLead.address}
                  onChange={e => setNewLead(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="col-span-2 flex justify-end space-x-2 mt-4 border-t pt-4">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-secondary rounded-lg text-foreground hover:bg-secondary/90 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 font-semibold"
                >
                  Insert Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
