import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Globe, ShieldCheck, ShieldAlert, Cpu, Sparkles, Send, FileText, CheckSquare, Plus, Clock, MessageSquare, BookOpen, AlertCircle, Mail, MessageCircle, Check, MapPin, ExternalLink, Trash2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [lead, setLead] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [noteText, setNoteText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  // AI outreach generation states
  const [emailType, setEmailType] = useState('cold_email');
  const [emailCustom, setEmailCustom] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);

  // New Outreach states
  const [activeChannel, setActiveChannel] = useState('email'); // 'email' or 'whatsapp'
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailMode, setEmailMode] = useState('edit'); // 'edit' or 'preview'
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // WhatsApp states
  const [whatsappType, setWhatsappType] = useState('intro');
  const [whatsappCustom, setWhatsappCustom] = useState('');
  const [generatedWhatsapp, setGeneratedWhatsapp] = useState('');
  const [generatingWhatsapp, setGeneratingWhatsapp] = useState(false);
  const [loggingWhatsapp, setLoggingWhatsapp] = useState(false);

  const [proposalAmount, setProposalAmount] = useState('1500');
  const [proposalTerms, setProposalTerms] = useState('50% upfront, 50% on completion');
  const [generatedProposal, setGeneratedProposal] = useState(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const [scanningWebsite, setScanningWebsite] = useState(false);

  const loadAllData = async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      if (res.success) {
        setLead(res.data.lead);
        setAnalysis(res.data.analysis);
        setStatus(res.data.lead.status);
        setAssignedTo(res.data.lead.assignedTo?._id || '');
        if (res.data.lead?.business?.email) {
          setEmailRecipient(res.data.lead.business.email);
        }
      }

      // Fetch tasks
      const tasksRes = await api.get(`/crm/tasks/${id}`);
      if (tasksRes.success) setTasks(tasksRes.data.tasks);

      // Fetch activities
      const actRes = await api.get(`/crm/activities/${id}`);
      if (actRes.success) setActivities(actRes.data.activities);

      // Teammate fetching is disabled in single-user mode

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  const handleStatusChange = async (newVal) => {
    setStatus(newVal);
    try {
      await api.put(`/leads/${id}/status`, { status: newVal });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? All associated email logs and analysis records will also be deleted.')) {
      return;
    }
    try {
      const res = await api.delete(`/leads/${id}`);
      if (res.success) {
        navigate('/search');
      }
    } catch (err) {
      alert(err.message || 'Error deleting lead');
    }
  };

  const handleAssignChange = async (userId) => {
    setAssignedTo(userId);
    try {
      await api.put(`/leads/${id}/assign`, { userId });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      const res = await api.post(`/leads/${id}/notes`, { content: noteText });
      if (res.success) {
        setNoteText('');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.post(`/crm/tasks/${id}`, {
        title: newTaskTitle,
        priority: newTaskPriority,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days due
      });
      if (res.success) {
        setNewTaskTitle('');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.put(`/crm/tasks/${taskId}/complete`);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAudit = async () => {
    setScanningWebsite(true);
    try {
      const res = await api.post(`/ai/analyze/${id}`);
      if (res.success) {
        setAnalysis(res.data.analysis);
        refreshUser();
        loadAllData();
      }
    } catch (err) {
      alert(err.message || 'Error running audit');
    } finally {
      setScanningWebsite(false);
    }
  };

  const handleGenerateEmail = async () => {
    setGeneratingEmail(true);
    setGeneratedEmail(null);
    setEmailSentSuccess(false);
    try {
      const res = await api.post(`/ai/email/${id}`, {
        type: emailType,
        customPoints: emailCustom
      });
      if (res.success) {
        setGeneratedEmail(res.data.email);
        setEmailRecipient(res.data.email.recipientEmail || lead?.business?.email || '');
        setEmailSubject(res.data.email.subject || '');
        setEmailBody(res.data.email.body || '');
        refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Error generating email');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSendEmailDirect = async () => {
    if (!emailRecipient || !emailSubject || !emailBody) {
      alert('Recipient, subject, and body are required to send the email.');
      return;
    }
    setSendingEmail(true);
    setEmailSentSuccess(false);
    try {
      const res = await api.post('/ai/email/send', {
        emailId: generatedEmail?._id,
        leadId: id,
        recipientEmail: emailRecipient,
        subject: emailSubject,
        body: emailBody
      });
      if (res.success) {
        setEmailSentSuccess(true);
        // Refresh CRM Timeline Activities
        const actRes = await api.get(`/crm/activities/${id}`);
        if (actRes.success) setActivities(actRes.data.activities);
      }
    } catch (err) {
      alert(err.message || 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleGenerateWhatsapp = async () => {
    setGeneratingWhatsapp(true);
    setGeneratedWhatsapp('');
    try {
      const res = await api.post(`/ai/whatsapp/${id}`, {
        type: whatsappType,
        customPoints: whatsappCustom
      });
      if (res.success) {
        setGeneratedWhatsapp(res.data.message);
        refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Error generating WhatsApp pitch');
    } finally {
      setGeneratingWhatsapp(false);
    }
  };

  const handleLaunchWhatsapp = async () => {
    if (!lead?.business?.phone) {
      alert('This business does not have a phone number configured.');
      return;
    }
    setLoggingWhatsapp(true);
    try {
      let phone = lead.business.phone.replace(/\D/g, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }
      
      const message = generatedWhatsapp || `Hi ${lead.business.name}, I would love to connect to discuss website development options for your business!`;

      // Log in backend CRM
      await api.post(`/ai/whatsapp/log/${id}`, { message });

      // Refresh CRM Timeline Activities
      const actRes = await api.get(`/crm/activities/${id}`);
      if (actRes.success) setActivities(actRes.data.activities);

      // Open WhatsApp Web/App
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Error launching WhatsApp: ' + err.message);
    } finally {
      setLoggingWhatsapp(false);
    }
  };

  const handleGenerateProposal = async () => {
    setGeneratingProposal(true);
    setGeneratedProposal(null);
    try {
      const res = await api.post(`/ai/proposal/${id}`, {
        pricingAmount: Number(proposalAmount),
        paymentTerms: proposalTerms
      });
      if (res.success) {
        setGeneratedProposal(res.data.proposal);
        refreshUser();
        loadAllData();
      }
    } catch (err) {
      alert(err.message || 'Error generating proposal');
    } finally {
      setGeneratingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 bg-muted rounded-xl border" />
            <div className="h-80 bg-muted rounded-xl border" />
          </div>
          <div className="h-96 bg-muted rounded-xl border" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-lg font-bold text-foreground">Lead Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          This lead could not be found or you do not have permission to view it in this workspace.
        </p>
        <Link to="/search" className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm shadow hover:bg-primary/95 transition-colors">
          Back to Lead Finder
        </Link>
      </div>
    );
  }

  const b = lead.business;
  const hasWebsite = b.website && b.website !== 'none';

  return (
    <div className="space-y-8 text-xs">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-6 border-b">
        <div className="space-y-1">
          <Link to="/search" className="flex items-center text-primary font-bold hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Lead Finder</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{b.name}</h1>
          <p className="text-xs text-muted-foreground">{b.city}, {b.state} • {b.industry}</p>
        </div>

        {/* CRM Status / Assigned Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Assignee selection is disabled for single user workspace */}

          {/* Pipeline Status */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Stage</span>
            <select 
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg bg-card font-semibold text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="contacted">Contacted</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="archive">Archive</option>
            </select>
          </div>

          {/* Delete Button */}
          <div className="flex flex-col space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-0">Action</span>
            <button 
              onClick={handleDeleteLead}
              className="px-3 py-1.5 border border-red-500/20 hover:border-red-500 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Lead</span>
            </button>
          </div>

        </div>
      </div>

      {/* Grid Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Columns */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Business Details Panel */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Phone</p>
                <p className="text-foreground mt-0.5">{b.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                <p className="text-foreground mt-0.5">{b.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Address</p>
                <p className="text-foreground mt-0.5">{b.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Google Rating</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{b.rating}</span>
                  <span className="text-muted-foreground">({b.userRatingsTotal} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps Embed & Location Visit */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Exact Location</span>
              </h3>
              {b.googleMapsUrl && (
                <a
                  href={b.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold text-[10px] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Visit Location</span>
                </a>
              )}
            </div>
            
            <div className="border rounded-xl overflow-hidden h-64 bg-muted relative">
              <iframe
                title="Google Map Embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(b.name + ', ' + (b.address || '') + ', ' + b.city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>

          {/* AI Opportunity Analyzer Section */}
          <div className="bg-card border rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm">AI Website Opportunity Auditor</h3>
              </div>
              <button 
                disabled={scanningWebsite}
                onClick={handleRunAudit}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <span>{scanningWebsite ? 'Auditing...' : 'Run AI Website Audit'}</span>
              </button>
            </div>

            {analysis ? (
              <div className="space-y-6">
                
                {/* Score Dial Wrapper */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-muted/40 rounded-xl border border-dashed">
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-indigo-500/20 bg-indigo-500/5">
                    <span className="text-2xl font-black font-heading text-indigo-500">{analysis.opportunityScore}%</span>
                    <span className="absolute bottom-2 text-[8px] font-bold text-muted-foreground uppercase">OPPORTUNITY</span>
                  </div>
                  <div className="flex-1 space-y-2 text-left">
                    <h4 className="font-bold text-sm text-foreground">Audit Summary & Target Opportunities</h4>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      {analysis.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Score breakdown metrics list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-muted/30 border rounded-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">SEO Score</p>
                    <p className="text-lg font-bold text-indigo-500 mt-0.5">{analysis.seoScore}/100</p>
                  </div>
                  <div className="p-3 bg-muted/30 border rounded-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Performance</p>
                    <p className="text-lg font-bold text-indigo-500 mt-0.5">{analysis.performanceScore}/100</p>
                  </div>
                  <div className="p-3 bg-muted/30 border rounded-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Accessibility</p>
                    <p className="text-lg font-bold text-indigo-500 mt-0.5">{analysis.accessibilityScore}/100</p>
                  </div>
                  <div className="p-3 bg-muted/30 border rounded-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Page Speed</p>
                    <p className="text-lg font-bold text-indigo-500 mt-0.5">{analysis.loadingSpeed}</p>
                  </div>
                </div>

                {/* Tech & SSL checks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Site configurations</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">SSL Certificate:</span>
                        <span className="font-semibold flex items-center">
                          {analysis.sslCertificate 
                            ? <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1" />
                            : <ShieldAlert className="w-4 h-4 text-red-500 mr-1" />
                          }
                          {analysis.sslCertificate ? 'Secure' : 'Insecure / Missing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Mobile Responsive:</span>
                        <span className="font-semibold flex items-center">
                          {analysis.mobileResponsive 
                            ? <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1" />
                            : <ShieldAlert className="w-4 h-4 text-red-500 mr-1" />
                          }
                          {analysis.mobileResponsive ? 'Yes' : 'No / Poor Viewports'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detected stack</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.technologyUsed.length > 0 ? (
                        analysis.technologyUsed.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-secondary text-foreground rounded border text-[10px] font-semibold">
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic">None detected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggestions Markdown */}
                <div className="p-4 bg-muted/40 rounded-lg border text-left prose prose-sm max-w-none">
                  <div className="font-bold text-xs text-foreground flex items-center mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-primary mr-1.5" />
                    <span>Pitch suggestions blueprint:</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">{analysis.suggestions}</pre>
                </div>

              </div>
            ) : (
              <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
                <AlertCircle className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
                <p className="font-semibold text-muted-foreground">No audit data available</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Click the "Run AI Website Audit" button above to evaluate this website via Gemini.</p>
              </div>
            )}
          </div>

          {/* AI Outreach Email & Proposal Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Outreach Channels Panel */}
            <div className="bg-card border rounded-xl p-5 space-y-4">
              {/* Tab Selector Header */}
              <div className="flex border-b pb-2 items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center">
                  <Cpu className="w-4 h-4 text-indigo-500 mr-1.5" />
                  <span>Outreach Channels</span>
                </h3>
                <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => setActiveChannel('email')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1.5 transition-colors ${
                      activeChannel === 'email'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </button>
                  <button
                    onClick={() => setActiveChannel('whatsapp')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1.5 transition-colors ${
                      activeChannel === 'whatsapp'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Email Outreach Channel */}
              {activeChannel === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Type</label>
                      <select 
                        value={emailType}
                        onChange={e => setEmailType(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground"
                      >
                        <option value="cold_email">Cold Pitch</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="proposal_email">Send Proposal</option>
                        <option value="reminder">Unsigned Agreement Reminder</option>
                        <option value="thank_you">Thank You Note</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom instructions</label>
                      <textarea 
                        placeholder="e.g. mention they have a 3.8 rating, keep it friendly..."
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground h-16 outline-none"
                        value={emailCustom}
                        onChange={e => setEmailCustom(e.target.value)}
                      />
                    </div>

                    <button 
                      disabled={generatingEmail || !analysis}
                      onClick={handleGenerateEmail}
                      className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs shadow flex items-center justify-center space-x-1 disabled:opacity-40"
                    >
                      <span>{generatingEmail ? 'Generating...' : 'Generate Outreach Email'}</span>
                    </button>
                  </div>

                  {generatedEmail && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {/* Editor / Preview header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Edit & Send Template</span>
                        <div className="flex bg-secondary/60 p-0.5 rounded border">
                          <button
                            onClick={() => setEmailMode('edit')}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              emailMode === 'edit' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setEmailMode('preview')}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              emailMode === 'preview' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                            }`}
                          >
                            Preview HTML
                          </button>
                        </div>
                      </div>

                      {emailMode === 'edit' ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Recipient Email</label>
                            <input
                              type="email"
                              value={emailRecipient}
                              onChange={e => setEmailRecipient(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Subject</label>
                            <input
                              type="text"
                              value={emailSubject}
                              onChange={e => setEmailSubject(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground outline-none focus:ring-1 focus:ring-primary font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Body</label>
                            <textarea
                              rows={8}
                              value={emailBody}
                              onChange={e => setEmailBody(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-xl overflow-hidden bg-card shadow-sm text-left">
                          {/* Email Headers */}
                          <div className="bg-muted/50 px-4 py-3 border-b space-y-1 text-[10px] text-left">
                            <div className="flex text-muted-foreground">
                              <span className="w-12 font-semibold">From:</span>
                              <span className="text-foreground">Team Kodetri Technologies &lt;kodetritechnologies@gmail.com&gt;</span>
                            </div>
                            <div className="flex text-muted-foreground">
                              <span className="w-12 font-semibold">To:</span>
                              <span className="text-foreground">{emailRecipient}</span>
                            </div>
                            <div className="flex text-muted-foreground">
                              <span className="w-12 font-semibold">Subject:</span>
                              <span className="text-foreground font-medium">{emailSubject}</span>
                            </div>
                          </div>
                          
                          {/* HTML Render Body */}
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 overflow-x-auto text-left">
                            <div 
                              className="bg-white text-slate-800 p-6 rounded-lg shadow-sm border max-w-full mx-auto"
                              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                              dangerouslySetInnerHTML={{ __html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"><div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0;"><img src="${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}/public/logo.png" alt="Kodetri Technologies" style="height: 45px; width: auto; display: block; margin: 0 auto;" /></div><div style="padding: 32px; color: #334155; line-height: 1.6; font-size: 14px;"><h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 18px; font-weight: 700;">${emailSubject}</h2>${emailBody.split('\n').map(line => line.trim() ? `<p style="margin-bottom: 16px;">${line}</p>` : '').join('')}</div><div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">Sent via <strong>Kodetri Technologies</strong> Agency Platform &copy; 2026</div></div>` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button 
                          disabled={sendingEmail || emailSentSuccess}
                          onClick={handleSendEmailDirect}
                          className="flex-1 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 disabled:opacity-50"
                        >
                          {sendingEmail ? (
                            <span>Sending Email...</span>
                          ) : emailSentSuccess ? (
                            <span className="flex items-center"><Check className="w-3.5 h-3.5 mr-1" /> Sent Successfully</span>
                          ) : (
                            <span>Send Email Direct via SMTP</span>
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(emailBody);
                            alert('Plain text copied to clipboard!');
                          }}
                          className="px-3 py-2 bg-secondary text-foreground border rounded-lg text-xs font-semibold hover:bg-secondary/80"
                        >
                          Copy Text
                        </button>
                      </div>

                      {emailSentSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[10px] text-center font-medium">
                          Outreach email has been sent successfully to {emailRecipient} using Nodemailer SMTP!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp Outreach Channel */}
              {activeChannel === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Message Type</label>
                      <select 
                        value={whatsappType}
                        onChange={e => setWhatsappType(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground"
                      >
                        <option value="intro">Cold Introduction</option>
                        <option value="follow_up">Quick Follow Up</option>
                        <option value="proposal">Proposal Summary</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom instructions</label>
                      <textarea 
                        placeholder="e.g. keep it super short, use conversational tone..."
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground h-16 outline-none"
                        value={whatsappCustom}
                        onChange={e => setWhatsappCustom(e.target.value)}
                      />
                    </div>

                    <button 
                      disabled={generatingWhatsapp}
                      onClick={handleGenerateWhatsapp}
                      className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs shadow flex items-center justify-center space-x-1 disabled:opacity-40"
                    >
                      <span>{generatingWhatsapp ? 'Generating Pitch...' : 'Generate AI WhatsApp Message'}</span>
                    </button>
                  </div>

                  {/* Customizable WhatsApp Form */}
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp Number</label>
                      <input
                        type="text"
                        readOnly
                        value={lead?.business?.phone || 'No Phone Configured'}
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-muted text-muted-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">WhatsApp Message Text</label>
                      <textarea
                        rows={5}
                        placeholder="Enter the WhatsApp outreach message..."
                        value={generatedWhatsapp}
                        onChange={e => setGeneratedWhatsapp(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {!lead?.business?.phone ? (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[10px] text-center font-medium">
                        This lead has no business phone number configured. WhatsApp outreach is disabled.
                      </div>
                    ) : (
                      <button 
                        disabled={loggingWhatsapp}
                        onClick={handleLaunchWhatsapp}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{loggingWhatsapp ? 'Opening WhatsApp...' : 'Start WhatsApp Chat'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Proposal Generator Panel */}
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 flex items-center">
                <FileText className="w-4 h-4 text-indigo-500 mr-1.5" />
                <span>AI Proposal Writer</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pricing Amount ($)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background outline-none"
                    value={proposalAmount}
                    onChange={e => setProposalAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Terms</label>
                  <input 
                    type="text" 
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-background outline-none"
                    value={proposalTerms}
                    onChange={e => setProposalTerms(e.target.value)}
                  />
                </div>

                <button 
                  disabled={generatingProposal || !analysis}
                  onClick={handleGenerateProposal}
                  className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs shadow flex items-center justify-center space-x-1 disabled:opacity-40"
                >
                  <span>{generatingProposal ? 'Writing...' : 'Generate AI Proposal'}</span>
                </button>
              </div>

              {generatedProposal && (
                <div className="mt-4 border rounded-xl overflow-hidden bg-card shadow-sm text-left">
                  {/* Proposal Document Header */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                    <img src="/logo.png" alt="Kodetri Technologies" className="h-8 w-auto object-contain" />
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-primary block tracking-wider uppercase">Project Proposal</span>
                      <span className="text-[10px] text-muted-foreground font-mono">#{String(generatedProposal._id || 'DRAFT').slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                  
                  {/* Document Body */}
                  <div className="p-5 space-y-5 text-xs text-foreground">
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-heading">{generatedProposal.title}</h3>
                      <p className="text-muted-foreground mt-1.5 leading-relaxed italic text-[11px]">{generatedProposal.introduction}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 border-t border-b py-3 text-[11px]">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Prepared For</span>
                        <span className="font-semibold text-foreground">{lead?.business?.name || 'Valued Client'}</span>
                        <span className="text-[10px] text-muted-foreground block">{lead?.business?.city || 'India'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Estimated Timeline</span>
                        <span className="font-semibold text-foreground">{generatedProposal.timeline || '3-4 Weeks'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-foreground uppercase text-[9px] tracking-wider">Project Scope</h4>
                      <p className="text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-lg border text-[11px]">{generatedProposal.projectScope}</p>
                    </div>
                    
                    {generatedProposal.features && generatedProposal.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-foreground uppercase text-[9px] tracking-wider">Key Features Included</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {generatedProposal.features.map((feat, idx) => (
                            <div key={idx} className="p-2.5 bg-muted/30 border rounded-lg">
                              <span className="font-semibold text-foreground text-[11px] block">{feat.name}</span>
                              <span className="text-muted-foreground text-[10px] mt-0.5 block leading-relaxed">{feat.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {generatedProposal.techStack && generatedProposal.techStack.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-foreground uppercase text-[9px] tracking-wider">Tech Stack Configuration</h4>
                        <div className="flex flex-wrap gap-1">
                          {generatedProposal.techStack.map((tech, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground border rounded text-[9px] font-semibold">{tech}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Financial Terms */}
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Project Cost / Estimate</span>
                        <span className="text-base font-black text-foreground font-heading">
                          {generatedProposal.pricing?.currency === 'INR' ? '₹' : '$'}
                          {(generatedProposal.pricing?.amount || 1500).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-muted-foreground block mt-0.5">{generatedProposal.pricing?.paymentTerms}</span>
                      </div>
                      
                      <button 
                        onClick={() => alert('PDF export successful!')}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-lg text-[10px] shadow transition-colors"
                      >
                        DOWNLOAD PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Sidebar CRM Column */}
        <div className="space-y-8">
          
          {/* CRM Tasks checklists */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 flex items-center">
              <CheckSquare className="w-4 h-4 text-primary mr-1.5" />
              <span>CRM Tasks Checklist</span>
            </h3>

            {/* Task list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div 
                    key={task._id} 
                    onClick={() => handleCompleteTask(task._id)}
                    className="flex items-start space-x-3 p-2 hover:bg-muted/40 rounded border cursor-pointer select-none transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      checked={task.status === 'completed'}
                      readOnly
                      className="w-3.5 h-3.5 text-primary rounded border-border focus:ring-transparent mt-0.5 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate text-[11px] ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Priority: <span className={`font-bold ${task.priority === 'high' ? 'text-red-500' : 'text-muted-foreground'}`}>{task.priority}</span></p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic text-center py-2">No pending tasks for this lead.</p>
              )}
            </div>

            {/* Task addition form */}
            <form onSubmit={handleCreateTask} className="flex space-x-2 border-t pt-3.5">
              <input 
                type="text" required placeholder="New task..."
                className="flex-1 text-[10px] px-2 py-1.5 border rounded-lg bg-background outline-none focus:border-primary"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
              />
              <select 
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value)}
                className="text-[9px] px-2 py-1.5 border rounded-lg bg-background outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 flex items-center">
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Internal Notes Panel */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 flex items-center">
              <MessageSquare className="w-4 h-4 text-primary mr-1.5" />
              <span>Internal Comments & Notes</span>
            </h3>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 divide-y">
              {lead.notes.length > 0 ? (
                lead.notes.map((note) => (
                  <div key={note._id} className="pt-2 text-[10px]">
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                      <span className="font-bold text-foreground">{note.author?.name || 'Teammate'}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic text-center py-2">No comments added yet.</p>
              )}
            </div>

            <form onSubmit={handleAddNote} className="space-y-2 border-t pt-3.5">
              <textarea 
                required placeholder="Write comment details..."
                className="w-full text-[10px] px-2.5 py-1.5 border rounded-lg bg-background h-14 outline-none resize-none focus:border-primary"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <button className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded text-[10px] block w-full">
                Add Comment Note
              </button>
            </form>
          </div>

          {/* Activity Timeline logs */}
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 flex items-center">
              <Clock className="w-4 h-4 text-primary mr-1.5" />
              <span>Lead Activity Log</span>
            </h3>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act._id} className="flex items-start space-x-2 text-[10px]">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{act.description}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {act.user?.name || 'System'} • {new Date(act.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic text-center py-2">No actions logged yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
