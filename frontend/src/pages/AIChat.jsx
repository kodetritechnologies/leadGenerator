import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight, CornerDownLeft } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function AIChat() {
  const { user, refreshUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [historyThreads, setHistoryThreads] = useState([]);

  const messagesEndRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const res = await api.get('/ai/chats');
      if (res.success) setHistoryThreads(res.data.chats);
    } catch (e) {
      console.error(e);
    }
  };

  const selectThread = async (id) => {
    setLoading(true);
    setChatId(id);
    try {
      const res = await api.get(`/ai/chats/${id}/messages`);
      if (res.success) setMessages(res.data.messages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query;
    setQuery('');
    setLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await api.post('/ai/chat', { message: userMsg, chatId });
      if (res.success) {
        setChatId(res.data.chatId);
        setMessages(prev => [...prev, res.data.assistantMessage]);
        refreshUser();
        fetchThreads();
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Server error'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Find restaurants in Mumbai with poor SEO.",
    "Show hotels in Jaipur without websites.",
    "Suggest dentists in Delhi needing a mobile responsive design.",
    "Recommend Pune gyms likely to buy eCommerce scheduling."
  ];

  return (
    <div className="h-[calc(100vh-10rem)] flex border rounded-xl overflow-hidden bg-card shadow-sm text-xs">

      {/* Sidebar Thread List */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col justify-between hidden md:flex">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Chat Sessions</span>
          <button
            onClick={() => { setChatId(null); setMessages([]); }}
            className="text-[10px] text-primary font-bold hover:underline"
          >
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {historyThreads.map((thread) => (
            <button
              key={thread._id}
              onClick={() => selectThread(thread._id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg truncate font-medium transition-all ${chatId === thread._id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            >
              {thread.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Primary Message Area */}
      <div className="flex-1 flex flex-col justify-between bg-card relative">

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">LeadBrain Sales Co-pilot</h3>
                <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                  Ask me questions to search, query, and rank target prospects. I can filter businesses based on missing websites, rating limits, mobile configurations, or generate direct outbound emails.
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-2 gap-3 w-full text-left">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(p)}
                    className="p-3 border rounded-xl bg-muted/40 hover:bg-muted hover:border-primary/20 transition-all font-medium text-muted-foreground hover:text-foreground leading-snug"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div key={i} className={`flex space-x-3.5 items-start ${isAssistant ? 'justify-start' : 'justify-end text-right'}`}>
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border flex items-center justify-center text-indigo-500 flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className="space-y-3 max-w-[85%] text-left">
                    <div className={`p-4 rounded-2xl shadow-sm text-xs leading-relaxed ${isAssistant ? 'bg-muted/50 text-foreground border' : 'bg-primary text-primary-foreground'}`}>
                      <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                    </div>

                    {/* Inline Matched Leads Shortcut buttons */}
                    {isAssistant && m.suggestedLeads && m.suggestedLeads.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Recommended Leads:</span>
                        <div className="flex flex-wrap gap-2">
                          {m.suggestedLeads.map((leadId) => (
                            <Link
                              key={leadId}
                              to={`/search/${leadId}`}
                              className="px-2.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary hover:text-primary-foreground text-primary rounded-lg font-bold flex items-center space-x-1 transition-all"
                            >
                              <span>Inspect Lead ID: {leadId.substring(18)}...</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-primary/25 flex items-center justify-center font-bold text-primary flex-shrink-0 uppercase">
                      {user?.name?.substring(0, 2)}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex space-x-3 items-start justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border flex items-center justify-center text-indigo-500 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-muted/30 border rounded-2xl w-48 animate-pulse h-10" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t bg-card/60 backdrop-blur-md sticky bottom-0">
          <form onSubmit={handleSubmit} className="relative flex items-center border rounded-xl overflow-hidden bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <input
              type="text"
              placeholder="Ask lead finder co-pilot..."
              disabled={loading}
              className="w-full pl-4 pr-12 py-3 bg-transparent border-none outline-none text-xs"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 p-1.5 bg-primary disabled:opacity-40 text-primary-foreground rounded-lg transition-colors flex items-center"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-2 px-1">
            <span>Deducts 1 AI Credit per request</span>
            <span className="hidden sm:inline-block">Press enter to send query</span>
          </div>
        </div>

      </div>
    </div>
  );
}
