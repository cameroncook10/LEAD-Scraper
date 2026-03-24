import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap, TrendingUp, Users, Activity, ArrowRight,
  Search, Inbox, Settings, Target,
  BarChart3, MessageSquare, Bell, Download,
  ArrowLeft, Instagram, Facebook, Mail, Globe,
  Play, Pause, CheckCircle, XCircle, Loader2, Clock, RefreshCw,
  ChevronDown, ChevronUp, Eye, Terminal
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startScrape, getScrapeStatus, getJobs, getLeads, getLeadsStats, exportLeads, saveOutreachCredentials, loadOutreachCredentials } from '../services/api';
import { supabase } from '../lib/supabase';

/* ════════════════════════════════════════════════
   DASHBOARD — Premium Glass Design System
   ════════════════════════════════════════════════ */

/* ═══ Reusable Glass Card (defined outside to prevent re-mount on state change) ═══ */
const Card = ({ children, className = '', mesh = 'mesh-cyan' }) => (
  <div className={`${mesh} glass-liquid rounded-2xl p-6 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/10 ${className}`}>
    {children}
  </div>
);

/* ═══ Empty State ═══ */
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-cyan-500/40" />
    </div>
    <h4 className="text-lg font-semibold text-gray-300 mb-2">{title}</h4>
    <p className="text-sm text-gray-500 max-w-sm">{subtitle}</p>
  </div>
);

/* ═══ Job Status Badge ═══ */
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    running: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  const icons = {
    pending: Clock,
    running: Loader2,
    completed: CheckCircle,
    failed: XCircle,
  };
  const Icon = icons[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pending}`}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

function DashboardEnhanced() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['Overview', 'Leads', 'Targeting', 'Campaigns', 'Inbox', 'Analytics', 'Settings'];
  const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'Overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timeFilter, setTimeFilter] = useState('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [leadFilter, setLeadFilter] = useState('All');
  
  // Scraper State
  const [source, setSource] = useState('web_search');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Campaign monitor state
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [jobLogs, setJobLogs] = useState([]);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const pollRef = useRef(null);
  const logsEndRef = useRef(null);

  // Real leads + stats from Supabase
  const [realLeads, setRealLeads] = useState([]);
  const [leadStats, setLeadStats] = useState({ total: 0, dmsSent: 0, emailsSent: 0, conversions: 0 });
  const [loadingLeads, setLoadingLeads] = useState(false);

  const sources = [
    { value: 'web_search', label: 'Web Search' },
    { value: 'google_maps', label: 'Google Maps' },
    { value: 'zillow', label: 'Zillow' },
    { value: 'nextdoor', label: 'Nextdoor' }
  ];

  // Fetch jobs list
  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const data = await getJobs();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally { setLoadingJobs(false); }
  }, []);

  // Fetch real leads from Supabase
  const fetchLeads = useCallback(async () => {
    try {
      setLoadingLeads(true);
      const data = await getLeads();
      setRealLeads(data.leads || data || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally { setLoadingLeads(false); }
  }, []);

  // Fetch lead stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await getLeadsStats();
      setLeadStats({
        total: data.totalLeads || 0,
        dmsSent: data.dmsSent || 0,
        emailsSent: data.emailsSent || 0,
        conversions: data.conversions || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchJobs();
    fetchLeads();
    fetchStats();
  }, [fetchJobs, fetchLeads, fetchStats]);

  // Poll job status when a campaign is active
  useEffect(() => {
    if (!activeJobId) return;
    const poll = async () => {
      try {
        const data = await getScrapeStatus(activeJobId);
        setJobStatus(data.job);
        setJobLogs(data.logs || []);
        setJobProgress(data.progress || 0);
        // Stop polling when job is done
        if (data.job?.status === 'completed' || data.job?.status === 'failed') {
          clearInterval(pollRef.current);
          pollRef.current = null;
          // Refresh jobs and leads
          fetchJobs();
          fetchLeads();
          fetchStats();
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };
    poll(); // immediate first poll
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeJobId, fetchJobs, fetchLeads, fetchStats]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jobLogs]);

  const handleStartScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!query.trim()) { setError('Please enter a search query'); setLoading(false); return; }
      const result = await startScrape(source, query, parseInt(limit));
      setSuccess(`Scrape job launched! Monitoring...`);
      setActiveJobId(result.jobId);
      setJobStatus({ status: 'pending', source });
      setJobLogs([]);
      setJobProgress(0);
      // Don't clear query - user might want to reference it
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start scrape job');
    } finally { setLoading(false); }
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      const blob = await exportLeads();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // View a past job in the monitor
  const handleViewJob = async (jobId) => {
    setActiveJobId(jobId);
    setJobStatus(null);
    setJobLogs([]);
    setJobProgress(0);
  };

  const [settings, setSettings] = useState({
    autoDm: false, autoEmail: false, aiQualify: true, weeklyReport: false
  });

  // Outreach channel config
  const [outreach, setOutreach] = useState({
    igToken: '', igBusinessId: '', fbPageId: '', fbToken: '',
    smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: ''
  });
  const [connected, setConnected] = useState({ instagram: false, facebook: false, email: false });
  const [savingOutreach, setSavingOutreach] = useState(false);
  const [outreachMsg, setOutreachMsg] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState(false);

  // OAuth Connect via Supabase Auth (built-in providers)
  const handleOAuthConnect = async (provider) => {
    try {
      // Map our provider names to Supabase provider names
      const providerMap = {
        instagram: 'facebook',  // Instagram uses Facebook OAuth
        facebook: 'facebook',
        google: 'google',
      };
      const supabaseProvider = providerMap[provider] || provider;

      // Scopes for each provider
      const scopeMap = {
        facebook: 'email,pages_show_list,pages_messaging,instagram_basic,instagram_manage_messages',
        google: 'email https://www.googleapis.com/auth/gmail.send',
      };

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: `${window.location.origin}/dashboard?tab=Settings&connected=${provider}`,
          scopes: scopeMap[supabaseProvider] || 'email',
        },
      });

      if (error) throw error;
      // Supabase handles the redirect
    } catch (err) {
      setOutreachMsg({ type: 'error', text: `Failed to connect ${provider}: ${err.message}` });
    }
  };

  // Load saved credentials on mount + check OAuth callback params
  useEffect(() => {
    loadOutreachCredentials().then(data => {
      if (data.connected) setConnected(data.connected);
      if (data.email) setOutreach(o => ({ ...o, smtpHost: data.email.smtpHost, smtpPort: data.email.smtpPort, smtpUser: data.email.smtpUser }));
      if (data.facebook) setOutreach(o => ({ ...o, fbPageId: data.facebook.pageId }));
      if (data.instagram) setOutreach(o => ({ ...o, igBusinessId: data.instagram.businessId }));
    }).catch(() => {});

    // Check for OAuth callback params
    const connectedProvider = searchParams.get('connected');
    const oauthError = searchParams.get('error');
    if (connectedProvider) {
      setOutreachMsg({ type: 'success', text: `${connectedProvider.charAt(0).toUpperCase() + connectedProvider.slice(1)} connected successfully!` });
      setConnected(c => ({ ...c, [connectedProvider]: true }));
    }
    if (oauthError) {
      setOutreachMsg({ type: 'error', text: `OAuth error: ${oauthError.replace(/_/g, ' ')}` });
    }

    // Check subscription status
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') setHasSubscription(true);
  }, []);

  // Subscription paywall
  const [hasSubscription, setHasSubscription] = useState(() => {
    return localStorage.getItem('agentlead_subscribed') === 'true';
  });
  useEffect(() => {
    if (hasSubscription) localStorage.setItem('agentlead_subscribed', 'true');
  }, [hasSubscription]);

  const handleSaveOutreach = async () => {
    setSavingOutreach(true);
    setOutreachMsg(null);
    try {
      await saveOutreachCredentials({
        instagram: { accessToken: outreach.igToken, businessId: outreach.igBusinessId },
        facebook: { pageId: outreach.fbPageId, pageToken: outreach.fbToken },
        email: { smtpHost: outreach.smtpHost, smtpPort: outreach.smtpPort, smtpUser: outreach.smtpUser, smtpPass: outreach.smtpPass },
      });
      setOutreachMsg({ type: 'success', text: 'Outreach credentials saved!' });
      // Refresh connection status
      const data = await loadOutreachCredentials();
      if (data.connected) setConnected(data.connected);
    } catch (err) {
      setOutreachMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save credentials' });
    } finally { setSavingOutreach(false); }
  };

  const tabs = [
    { name: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Leads', icon: <Users className="w-5 h-5" /> },
    { name: 'Targeting', icon: <Target className="w-5 h-5" /> },
    { name: 'Campaigns', icon: <Zap className="w-5 h-5" /> },
    { name: 'Inbox', icon: <Inbox className="w-5 h-5" /> },
    { name: 'Analytics', icon: <Activity className="w-5 h-5" /> },
    { name: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  // ── Empty chart data (real data will populate from Supabase) ──
  const emptyChart = { '7D': Array(7).fill(0), '30D': Array(30).fill(0), '90D': Array(90).fill(0) };
  const activeChartData = emptyChart[timeFilter];

  // ── Leads from Supabase ──
  const getLeadStatus = (aiScore) => aiScore >= 80 ? 'Hot' : aiScore >= 50 ? 'Warm' : 'Cold';

  const filteredLeads = realLeads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const matchSearch = lead.name?.toLowerCase().includes(q) || lead.industry?.toLowerCase().includes(q) || lead.description?.toLowerCase().includes(q)
      || lead.ai_category?.toLowerCase().includes(q) || lead.email?.toLowerCase().includes(q) || lead.business_type?.toLowerCase().includes(q);
    const leadStatus = getLeadStatus(lead.ai_score || 0);
    const matchStatus = leadFilter === 'All' || leadStatus === leadFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden noise-overlay">
      {/* ══════ SUBSCRIPTION PAYWALL ══════ */}
      {!hasSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(5,5,5,0.92)' }}>
          <div className="glass-liquid rounded-2xl p-10 max-w-md text-center border border-white/[0.06] shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Your 3-Day Free Trial</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Get full access to lead scraping, AI qualification, auto-DMs, and all dashboard features. Your card won't be charged until the trial ends.
            </p>
            <button
              onClick={() => navigate('/#pricing')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 mb-3"
            >
              View Plans & Start Trial
            </button>

            {/* Promo Code */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-gray-600 mb-2">Have a promo code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && promoCode.toLowerCase().trim() === 'web') {
                      setHasSubscription(true);
                    }
                  }}
                  className="flex-1 glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                />
                <button
                  onClick={() => {
                    if (promoCode.toLowerCase().trim() === 'web') {
                      setHasSubscription(true);
                    } else {
                      setPromoError(true);
                      setTimeout(() => setPromoError(false), 2000);
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/[0.06] transition"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-xs text-red-400 mt-2">Invalid promo code</p>}
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 text-gray-400 border border-white/[0.06] transition-all duration-300 mt-3"
            >
              ← Back to Site
            </button>
          </div>
        </div>
      )}
      <aside className="hidden md:flex flex-col w-64 glass-liquid border-r border-white/[0.06]">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="Agent Lead" className="w-9 h-9 object-contain" />
          </div>
          <span className="font-bold text-base tracking-tight">
            <span className="text-white">Agent</span>
            <span className="text-cyan-400">Lead</span>
          </span>
        </div>

        {/* Nav Tabs */}
        <nav className="flex-1 px-3 space-y-1 mt-2 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.name 
                  ? 'glass-liquid liquid-border text-cyan-400 shadow-lg shadow-cyan-500/10' 
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="p-4 text-center">
          <span className="text-xs text-gray-600">Agent Lead v1.0</span>
        </div>
      </aside>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 glass-nav px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-display">
            <span className="gradient-text-subtle">{activeTab}</span>
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="btn-ghost px-4 py-2 text-sm rounded-lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Site
            </button>
            <button className="relative w-10 h-10 rounded-full glass-liquid flex items-center justify-center transition hover:shadow-lg hover:shadow-cyan-500/10">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-cyan-500/20">
              CC
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8">
          
          {/* ═══════════════ OVERVIEW ═══════════════ */}
          {activeTab === 'Overview' && (
            <div className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { title: "Total Leads", value: leadStats.total.toLocaleString(), icon: Users },
                  { title: "DMs Sent", value: leadStats.dmsSent.toLocaleString(), icon: MessageSquare },
                  { title: "Emails Sent", value: leadStats.emailsSent.toLocaleString(), icon: Mail },
                  { title: "Conversions", value: leadStats.conversions.toLocaleString(), icon: TrendingUp }
                ].map((stat, i) => (
                  <Card key={i}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400 font-medium">{stat.title}</span>
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <stat.icon className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold gradient-text-cyan">{stat.value}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <span>{stat.value === '0' ? 'No data yet' : 'Live from Supabase'}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Chart */}
              <Card className="!p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold text-white">Activity</h3>
                  <div className="flex glass-liquid rounded-lg p-1">
                    {['7D', '30D', '90D'].map(time => (
                      <button 
                        key={time}
                        onClick={() => setTimeFilter(time)}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
                          timeFilter === time 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-48 flex items-end justify-between gap-1 relative">
                  {activeChartData.length > 0 && activeChartData.every(v => v === 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                      Activity will appear here once you start campaigns
                    </div>
                  ) : (
                    activeChartData.map((val, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/80 rounded-t-sm transition-all cursor-pointer hover:from-cyan-400 hover:to-cyan-300"
                        style={{ height: `${val}%`, minWidth: '3px' }}
                      />
                    ))
                  )}
                </div>
              </Card>

              {/* Recent Leads */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Recent Leads</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" placeholder="Search by keyword..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="glass-liquid text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-white w-64 border-none"
                    />
                  </div>
                </div>
                {filteredLeads.length === 0 ? (
                  <EmptyState icon={Users} title="No leads yet" subtitle="Start a scrape campaign to begin collecting qualified leads." />
                ) : (
                  <div className="space-y-2">
                    {filteredLeads.slice(0, 4).map(lead => {
                      const score = lead.ai_score || 0;
                      const status = getLeadStatus(score);
                      return (
                        <div key={lead.id} className="flex items-center justify-between p-4 glass-liquid rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/5">
                          <div>
                            <div className="font-semibold text-white">{lead.name}</div>
                            <div className="text-xs text-gray-500">{lead.address || lead.location || '—'} · {lead.ai_category || lead.business_type || '—'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-cyan-400 font-bold text-sm">{score}%</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'Hot' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : status === 'Warm' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'}`}>
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ═══════════════ LEADS ═══════════════ */}
          {activeTab === 'Leads' && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex glass-liquid rounded-xl p-1">
                  {['All', 'Hot', 'Warm', 'Cold'].map(f => (
                    <button 
                      key={f} onClick={() => setLeadFilter(f)}
                      className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        leadFilter === f ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' : 'text-gray-500 hover:text-white'
                      }`}
                    >{f}</button>
                  ))}
                </div>
                <button onClick={handleExportCSV} className="btn-ghost px-4 py-2 text-sm rounded-xl flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </button>
              </div>

              <Card className="flex-1 !p-0 overflow-hidden flex flex-col">
                {filteredLeads.length === 0 ? (
                  <EmptyState icon={Users} title="No leads in database" subtitle="Your scraped and qualified leads will appear here. Start a campaign to populate." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => {
                        const score = Math.round((lead.quality_score || 0) * 100);
                        const status = getLeadStatus(lead.quality_score || 0);
                        return (
                          <tr key={lead.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition cursor-pointer">
                            <td className="px-6 py-4 font-semibold text-white">{lead.name}</td>
                            <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">{lead.business_type || lead.ai_category || '—'}</td>
                            <td className="px-6 py-4 text-gray-400">{lead.address || '—'}</td>
                            <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{score}%</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'Hot' ? 'bg-red-500/15 text-red-400' : status === 'Warm' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          )}

          {/* ═══════════════ TARGETING ═══════════════ */}
          {activeTab === 'Targeting' && (
            <div className="max-w-3xl space-y-8">
              <Card className="!p-8" mesh="mesh-violet">
                <h3 className="text-xl font-bold mb-2">
                  <span className="gradient-text-cyan">AI Engagement</span> Settings
                </h3>
                <p className="text-gray-500 mb-8 text-sm">Configure how the AI agent identifies, qualifies, and engages lead profiles.</p>
                
                <div className="space-y-4">
                  {[
                    { key: 'autoDm', title: 'Auto-DM Qualified Leads', desc: 'Automatically send intro sequences to leads scoring over 85%.' },
                    { key: 'autoEmail', title: 'Auto-Email Warm Leads', desc: 'Add warm leads (Score 60-84) directly into your email sequence.' },
                    { key: 'aiQualify', title: 'Deep AI Qualification', desc: 'Extract revenue estimates, tech stack, and recent news for each lead.' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-5 glass-liquid rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/5">
                      <div>
                        <div className="font-semibold text-white mb-1">{setting.title}</div>
                        <div className="text-sm text-gray-500">{setting.desc}</div>
                      </div>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, [setting.key]: !s[setting.key] }))}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings[setting.key] ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${settings[setting.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ═══════════════ CAMPAIGNS ═══════════════ */}
          {activeTab === 'Campaigns' && (
            <div className="space-y-8">
              {/* Scrape Form */}
              <Card className="!p-8 liquid-border" mesh="mesh-blue">
                <h3 className="text-xl font-bold mb-6">
                  <span className="gradient-text-cyan">Launch</span> New Campaign
                </h3>
                <form onSubmit={handleStartScrape} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Data Source</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sources.map(s => (
                        <button key={s.value} type="button" onClick={() => setSource(s.value)}
                          className={`p-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                            source === s.value
                              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                              : 'glass-liquid text-gray-500 hover:text-white'
                          }`}
                        >{s.label}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Search Query</label>
                    <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="e.g., plumbers in New York..."
                      className="w-full glass-liquid text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-white border-none placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Lead Limit</label>
                    <input type="number" value={limit} onChange={e => setLimit(e.target.value)} min="1" max="1000"
                      className="w-full glass-liquid text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-white border-none"
                    />
                  </div>

                  {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                  {success && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}

                  <button type="submit" disabled={loading} className={`btn w-full py-4 rounded-xl font-bold text-base transition-all ${loading ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'btn-primary shadow-2xl shadow-cyan-500/20'}`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Launching...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2"><Play className="w-5 h-5" /> Launch Scrape Campaign</span>
                    )}
                  </button>
                </form>
              </Card>

              {/* ═══ LIVE CAMPAIGN MONITOR ═══ */}
              {activeJobId && jobStatus && (
                <Card className="!p-0 overflow-hidden liquid-border" mesh="mesh-violet">
                  {/* Monitor Header */}
                  <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        jobStatus.status === 'running' ? 'bg-cyan-500/20' : jobStatus.status === 'completed' ? 'bg-emerald-500/20' : jobStatus.status === 'failed' ? 'bg-red-500/20' : 'bg-amber-500/20'
                      }`}>
                        {jobStatus.status === 'running' ? <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> :
                         jobStatus.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                         jobStatus.status === 'failed' ? <XCircle className="w-5 h-5 text-red-400" /> :
                         <Clock className="w-5 h-5 text-amber-400" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                          Campaign Monitor
                          <StatusBadge status={jobStatus.status} />
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Job ID: <span className="font-mono text-gray-400">{activeJobId.slice(0, 8)}...</span>
                          {jobStatus.source && <> &middot; Source: <span className="text-cyan-400">{sources.find(s => s.value === jobStatus.source)?.label || jobStatus.source}</span></>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => { setActiveJobId(null); setJobStatus(null); setJobLogs([]); }}
                      className="text-gray-500 hover:text-white transition text-sm px-3 py-1.5 rounded-lg hover:bg-white/5">
                      Close
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-medium">Progress</span>
                      <span className="text-xs font-bold text-cyan-400">{jobProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          jobStatus.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                          jobStatus.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                          'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${jobProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{jobStatus.processed_leads || 0} leads processed</span>
                      <span>{jobStatus.total_leads || 0} total</span>
                    </div>
                  </div>

                  {/* Agent Activity Logs */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-semibold text-white">Agent Activity</h4>
                    </div>
                    <div className="glass-liquid rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1.5">
                      {jobLogs.length === 0 ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Waiting for agent activity...</span>
                        </div>
                      ) : (
                        [...jobLogs].reverse().map((log, i) => (
                          <div key={i} className={`flex items-start gap-2 ${
                            log.level === 'error' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            <span className="text-gray-600 shrink-0">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                            <span className={`shrink-0 ${log.level === 'error' ? 'text-red-500' : 'text-cyan-500'}`}>
                              {log.level === 'error' ? '[ERR]' : '[AGT]'}
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>

                  {/* Results Summary (when complete) */}
                  {jobStatus.status === 'completed' && (
                    <div className="px-6 pb-6">
                      <div className="glass-liquid rounded-xl p-5 border border-emerald-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="font-bold text-emerald-400">Campaign Complete</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-2xl font-bold text-white">{jobStatus.total_leads || 0}</div>
                            <div className="text-xs text-gray-500">Leads Scraped</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">{jobStatus.processed_leads || 0}</div>
                            <div className="text-xs text-gray-500">AI Qualified</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-white">{sources.find(s => s.value === jobStatus.source)?.label || '—'}</div>
                            <div className="text-xs text-gray-500">Data Source</div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('Leads')} className="mt-4 btn-primary px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <Eye className="w-4 h-4" /> View Leads
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error details */}
                  {jobStatus.status === 'failed' && jobStatus.error_message && (
                    <div className="px-6 pb-6">
                      <div className="glass-liquid rounded-xl p-4 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="font-bold text-red-400 text-sm">Campaign Failed</span>
                        </div>
                        <p className="text-xs text-red-300/70">{jobStatus.error_message}</p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* ═══ CAMPAIGN HISTORY ═══ */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Campaign History</h3>
                  <button onClick={fetchJobs} className="btn-ghost px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
                {jobs.length === 0 ? (
                  <EmptyState icon={Zap} title="No campaigns yet" subtitle="Launch your first scrape campaign above to start generating leads." />
                ) : (
                  <div className="space-y-3">
                    {jobs.map(job => (
                      <div key={job.id} className="glass-liquid rounded-xl p-5 flex items-center justify-between hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            job.status === 'running' ? 'bg-cyan-500/20' : job.status === 'completed' ? 'bg-emerald-500/20' : job.status === 'failed' ? 'bg-red-500/20' : 'bg-amber-500/20'
                          }`}>
                            {job.status === 'running' ? <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> :
                             job.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                             job.status === 'failed' ? <XCircle className="w-5 h-5 text-red-400" /> :
                             <Clock className="w-5 h-5 text-amber-400" />}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm flex items-center gap-2">
                              {sources.find(s => s.value === job.source)?.label || job.source} Scrape
                              <StatusBadge status={job.status} />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(job.created_at).toLocaleDateString()} at {new Date(job.created_at).toLocaleTimeString()}
                              {job.total_leads > 0 && <> &middot; {job.total_leads} leads</>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleViewJob(job.id)}
                          className="btn-ghost px-4 py-2 text-xs rounded-lg flex items-center gap-1.5 hover:text-cyan-400">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ INBOX ═══════════════ */}
          {activeTab === 'Inbox' && (
            <Card className="h-[calc(100vh-12rem)] !p-0 overflow-hidden flex">
              <div className="w-1/3 border-r border-white/[0.06] flex flex-col">
                <div className="p-5 border-b border-white/[0.06]">
                  <h4 className="font-semibold text-white text-sm">Messages</h4>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-gray-600 text-center px-4">No conversations yet.<br/>Replies from your DMs and emails will appear here.</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-cyan-500/30" />
                </div>
                <p className="text-gray-600 text-sm">Select a conversation to view</p>
              </div>
            </Card>
          )}

          {/* ═══════════════ ANALYTICS ═══════════════ */}
          {activeTab === 'Analytics' && (() => {
            const totalScraped = realLeads.length;
            const qualified = realLeads.filter(l => (l.ai_score || 0) >= 50).length;
            const contacted = leadStats.dmsSent + leadStats.emailsSent;
            const replied = leadStats.conversions;
            const maxVal = Math.max(totalScraped, 1);
            const industries = {};
            realLeads.forEach(l => {
              const ind = l.ai_category || l.business_type || 'Unknown';
              industries[ind] = (industries[ind] || 0) + 1;
            });
            const topIndustries = Object.entries(industries).sort((a, b) => b[1] - a[1]).slice(0, 8);
            const maxInd = topIndustries.length > 0 ? topIndustries[0][1] : 1;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card mesh="mesh-blue">
                  <h3 className="text-lg font-semibold text-white mb-6">Conversion Funnel</h3>
                  <div className="space-y-5">
                    {[
                      { step: "Total Scraped", val: totalScraped, pct: totalScraped > 0 ? 100 : 0, color: "from-gray-600 to-gray-500" },
                      { step: "Qualified (Score > 50%)", val: qualified, pct: (qualified / maxVal) * 100, color: "from-blue-500 to-blue-400" },
                      { step: "Contacted", val: contacted, pct: (contacted / maxVal) * 100, color: "from-cyan-500 to-cyan-400" },
                      { step: "Replied", val: replied, pct: (replied / maxVal) * 100, color: "from-emerald-500 to-emerald-400" }
                    ].map((f, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">{f.step}</span>
                          <span className="font-bold text-white">{f.val}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${f.color} rounded-full transition-all`} style={{ width: `${Math.round(f.pct)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card mesh="mesh-violet">
                  <h3 className="text-lg font-semibold text-white mb-6">Industry Breakdown</h3>
                  {topIndustries.length === 0 ? (
                    <EmptyState icon={BarChart3} title="No data yet" subtitle="Industry analytics will populate as your lead database grows." />
                  ) : (
                    <div className="space-y-3">
                      {topIndustries.map(([name, count], i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-gray-400 truncate max-w-[200px]">{name}</span>
                            <span className="font-bold text-white">{count}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all" style={{ width: `${(count / maxInd) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            );
          })()}

          {/* ═══════════════ SETTINGS ═══════════════ */}
          {activeTab === 'Settings' && (
            <div className="max-w-4xl space-y-8">
              {/* Account */}
              <Card className="!p-8">
                <h3 className="text-lg font-semibold text-white mb-6 pb-4 border-b border-white/[0.06]">Account Profile</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace Name</label>
                    <input type="text" defaultValue="" placeholder="My Workspace" className="w-full glass-liquid rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" defaultValue="" placeholder="you@email.com" className="w-full glass-liquid rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border-none" />
                  </div>
                </div>
                <button className="btn-primary px-6 py-2.5 rounded-xl text-sm mt-6">Save Changes</button>
              </Card>

              {/* Outreach Channels */}
              <Card className="!p-8" mesh="mesh-violet">
                <h3 className="text-lg font-semibold text-white mb-2 pb-4 border-b border-white/[0.06]">
                  <span className="gradient-text-cyan">Your</span> Outreach Channels
                </h3>
                <p className="text-gray-500 text-sm mb-6">Connect your own Instagram, Facebook, and Email to send DMs and emails from your accounts.</p>
                
                <div className="space-y-4">
                  {/* Instagram */}
                  <div className="glass-liquid rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">Instagram DM</div>
                          <div className="text-xs text-gray-500">Send DMs from your business account</div>
                        </div>
                      </div>
                      {connected.instagram && <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Connected</span>}
                    </div>
                    {!connected.instagram && (
                      <button onClick={() => handleOAuthConnect('instagram')}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition flex items-center justify-center gap-2">
                        <Instagram className="w-4 h-4" /> Connect with Facebook (Instagram)
                      </button>
                    )}
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-400 transition">Or enter credentials manually</summary>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <input type="text" placeholder="Business Account ID" value={outreach.igBusinessId}
                          onChange={e => setOutreach(o => ({ ...o, igBusinessId: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                        <input type="password" placeholder="Page Access Token" value={outreach.igToken}
                          onChange={e => setOutreach(o => ({ ...o, igToken: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                      </div>
                    </details>
                  </div>

                  {/* Facebook */}
                  <div className="glass-liquid rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">Facebook Messenger</div>
                          <div className="text-xs text-gray-500">Send messages from your Facebook page</div>
                        </div>
                      </div>
                      {connected.facebook && <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Connected</span>}
                    </div>
                    {!connected.facebook && (
                      <button onClick={() => handleOAuthConnect('facebook')}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-90 transition flex items-center justify-center gap-2">
                        <Facebook className="w-4 h-4" /> Connect with Facebook
                      </button>
                    )}
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-400 transition">Or enter credentials manually</summary>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <input type="text" placeholder="Page ID" value={outreach.fbPageId}
                          onChange={e => setOutreach(o => ({ ...o, fbPageId: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                        <input type="password" placeholder="Page Access Token" value={outreach.fbToken}
                          onChange={e => setOutreach(o => ({ ...o, fbToken: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                      </div>
                    </details>
                  </div>

                  {/* Email */}
                  <div className="glass-liquid rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">Email</div>
                          <div className="text-xs text-gray-500">Send emails from your company email account</div>
                        </div>
                      </div>
                      {connected.email && <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Connected</span>}
                    </div>
                    {!connected.email && (
                      <button onClick={() => handleOAuthConnect('google')}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" /> Connect with Google (Gmail)
                      </button>
                    )}
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-400 transition">Or enter SMTP credentials manually</summary>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <input type="text" placeholder="SMTP Host (e.g. smtp.gmail.com)" value={outreach.smtpHost}
                          onChange={e => setOutreach(o => ({ ...o, smtpHost: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                        <input type="text" placeholder="Port (587)" value={outreach.smtpPort}
                          onChange={e => setOutreach(o => ({ ...o, smtpPort: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Your Email Address" value={outreach.smtpUser}
                          onChange={e => setOutreach(o => ({ ...o, smtpUser: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                        <input type="password" placeholder="App Password" value={outreach.smtpPass}
                          onChange={e => setOutreach(o => ({ ...o, smtpPass: e.target.value }))}
                          className="w-full glass rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/[0.06] placeholder-gray-600"
                        />
                      </div>
                    </details>
                  </div>
                </div>

                {outreachMsg && (
                  <div className={`mt-4 p-3 rounded-xl text-sm ${outreachMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {outreachMsg.text}
                  </div>
                )}

                <button onClick={handleSaveOutreach} disabled={savingOutreach}
                  className={`mt-6 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${savingOutreach ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'btn-primary shadow-lg shadow-cyan-500/20'}`}>
                  {savingOutreach ? 'Saving...' : 'Save Outreach Settings'}
                </button>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default DashboardEnhanced;
