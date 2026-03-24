import React, { useState } from 'react';
import { 
  Zap, TrendingUp, Users, Activity, ArrowRight, PlayCircle, 
  CheckCircle, Clock, Search, Filter, Inbox, Settings, Target, 
  BarChart3, MessageSquare, Briefcase, Bell, Link2, Download,
  Sliders, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startScrape } from '../services/api';

const chartData = {
  '7D': [60, 70, 65, 80, 85, 90, 100],
  '30D': [30, 45, 35, 55, 40, 60, 50, 70, 65, 75, 70, 85, 80, 90, 85, 95, 90, 88, 92, 87, 94, 91, 96, 93, 98, 95, 92, 97, 94, 100],
  '90D': Array.from({length: 90}, () => Math.floor(Math.random() * 60) + 40)
};

const mockLeads = [
  { id: 1, name: "Johnson HVAC", location: "Phoenix, AZ", score: "94", status: "Hot", industry: "Services" },
  { id: 2, name: "Prime Landscaping", location: "Charlotte, NC", score: "87", status: "Warm", industry: "Services" },
  { id: 3, name: "Elite Plumbing", location: "Richmond, VA", score: "91", status: "Hot", industry: "Contractor" },
  { id: 4, name: "Shango Roofing", location: "Richmond, VA", score: "96", status: "Hot", industry: "Contractor" },
  { id: 5, name: "TechFlow Solutions", location: "Austin, TX", score: "45", status: "Cold", industry: "Software" },
  { id: 6, name: "Apex Builders", location: "Miami, FL", score: "62", status: "Cold", industry: "Contractor" },
];

function DashboardEnhanced() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
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

  const sources = [
    { value: 'web_search', label: 'Web Search' },
    { value: 'google_maps', label: 'Google Maps' },
    { value: 'zillow', label: 'Zillow' },
    { value: 'nextdoor', label: 'Nextdoor' }
  ];

  const handleStartScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!query.trim()) {
        setError('Please enter a search query');
        setLoading(false);
        return;
      }
      const result = await startScrape(source, query, parseInt(limit));
      setSuccess(`✓ Scrape job started (ID: ${result.jobId})`);
      setQuery('');
      // Optionally navigate to Jobs or Overview
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start scrape job');
    } finally {
      setLoading(false);
    }
  };

  const [settings, setSettings] = useState({
    autoDm: true,
    autoEmail: false,
    aiQualify: true,
    weeklyReport: true
  });

  const tabs = [
    { name: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Leads', icon: <Users className="w-5 h-5" /> },
    { name: 'Targeting', icon: <Target className="w-5 h-5" /> },
    { name: 'Campaigns', icon: <Zap className="w-5 h-5" /> },
    { name: 'Inbox', icon: <Inbox className="w-5 h-5" /> },
    { name: 'Analytics', icon: <Activity className="w-5 h-5" /> },
    { name: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  // Derived state
  const activeChartData = chartData[timeFilter];
  
  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = leadFilter === 'All' || lead.status === leadFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/50 border-r border-slate-800">
        <div className="p-6 flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            AgentLead
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.name 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-xl border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{activeTab}</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Site</span>
            </button>
            <div className="w-px h-6 bg-slate-800"></div>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition relative">
              <Bell className="w-5 h-5 text-slate-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-slate-800 flex items-center justify-center font-bold text-sm">
              CC
            </div>
          </div>
        </header>

        {/* Tab Content Wrappers */}
        <div className="flex-1 p-8">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: "Total Leads", value: "12,847", change: "+22%", trend: "up" },
                  { title: "DMs Sent", value: "3,291", change: "+18%", trend: "up" },
                  { title: "Comments Hooked", value: "5,102", change: "+31%", trend: "up" },
                  { title: "Conversions", value: "847", change: "+42%", trend: "up" }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition">
                    <div className="text-sm text-slate-400 mb-2">{stat.title}</div>
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <div className="flex items-center text-sm text-emerald-400 font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold">Conversion Funnel Activity</h3>
                  <div className="flex bg-slate-800 p-1 rounded-lg">
                    {['7D', '30D', '90D'].map(time => (
                      <button 
                        key={time}
                        onClick={() => setTimeFilter(time)}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition ${timeFilter === time ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-1 md:gap-2">
                  {activeChartData.map((val, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/80 rounded-t-sm hover:from-cyan-400 hover:to-cyan-400 transition-all cursor-pointer"
                      style={{ height: `${val}%`, minWidth: '4px' }}
                    />
                  ))}
                </div>
              </div>

              {/* Searchable Leads List */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Recent Signups</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search leads..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500 text-white w-64"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredLeads.slice(0, 4).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800 transition">
                      <div>
                        <div className="font-bold">{lead.name}</div>
                        <div className="text-xs text-slate-400">{lead.location} • {lead.industry}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-cyan-400 font-bold">{lead.score}%</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'Hot' ? 'bg-red-500/20 text-red-400' : lead.status === 'Warm' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="text-center py-8 text-slate-500">No leads found matching your search.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === 'Leads' && (
            <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex bg-slate-800 p-1 rounded-lg">
                  {['All', 'Hot', 'Warm', 'Cold'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setLeadFilter(f)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${leadFilter === f ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition border border-slate-700">
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex-1 overflow-hidden flex flex-col">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Company Name</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                      <th className="px-6 py-4 font-medium">Industry</th>
                      <th className="px-6 py-4 font-medium">AI Score</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition cursor-pointer">
                        <td className="px-6 py-4 font-bold text-white">{lead.name}</td>
                        <td className="px-6 py-4 text-slate-400">{lead.location}</td>
                        <td className="px-6 py-4 text-slate-400">{lead.industry}</td>
                        <td className="px-6 py-4 font-mono text-cyan-400">{lead.score}%</td>
                        <td className="px-6 py-4">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'Hot' ? 'bg-red-500/20 text-red-400' : lead.status === 'Warm' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLeads.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-slate-500">No leads matching current filters.</div>
                )}
              </div>
            </div>
          )}

          {/* TARGETING TAB */}
          {activeTab === 'Targeting' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-2">AI Engagement Settings</h3>
                <p className="text-slate-400 mb-8">Configure how the AI agent identifies and extracts lead profiles.</p>
                
                <div className="space-y-6">
                  {[
                    { key: 'autoDm', title: 'Auto-DM Qualified Leads', desc: 'Automatically send the highly-converting intro sequence to leads scoring over 85%.' },
                    { key: 'autoEmail', title: 'Auto-Email Warm Leads', desc: 'Add warm leads (Score 60-84) directly into an email sequence.' },
                    { key: 'aiQualify', title: 'Deep AI Qualification', desc: 'Spend extra tokens to extract revenue estimates, exact tech stack, and recent news.' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                      <div>
                        <div className="font-bold text-white mb-1">{setting.title}</div>
                        <div className="text-sm text-slate-400">{setting.desc}</div>
                      </div>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, [setting.key]: !s[setting.key] }))}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${settings[setting.key] ? 'bg-cyan-500' : 'bg-slate-600'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${settings[setting.key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CAMPAIGNS TAB */}
          {activeTab === 'Campaigns' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Scrape Form Integration */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
                <h3 className="text-xl font-bold mb-6">Start New Scrape Campaign</h3>
                <form onSubmit={handleStartScrape} className="space-y-6">
                  {/* Source selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Data Source</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sources.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSource(s.value)}
                          className={`p-4 rounded-xl border-2 font-medium transition-colors ${
                            source === s.value
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Query input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Search Query</label>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., plumbers in New York..."
                      className="w-full bg-slate-800 border border-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 text-white"
                    />
                  </div>

                  {/* Limit input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Number of Leads to Scrape</label>
                    <input
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      min="1"
                      max="1000"
                      className="w-full bg-slate-800 border border-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 text-white"
                    />
                  </div>

                  {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
                  {success && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">{success}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25'
                    }`}
                  >
                    {loading ? 'Starting Campaign...' : 'Launch Scrape Campaign'}
                  </button>
                </form>
              </div>

              <div className="flex justify-between">
                <h3 className="text-xl font-bold">Active Campaigns</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: "NYC Plumbers Q3", sent: 1240, replies: 145, status: "Active" },
                  { name: "SaaS Founders - Cold Email", sent: 3400, replies: 89, status: "Paused" },
                  { name: "Local Realtors SMS", sent: 500, replies: 210, status: "Active" }
                ].map((camp, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition group cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold group-hover:text-cyan-400 transition">{camp.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${camp.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                        {camp.status}
                      </span>
                    </div>
                    <div className="flex gap-8 mt-6">
                      <div>
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Sent</div>
                        <div className="text-xl font-bold">{camp.sent}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Replies</div>
                        <div className="text-xl font-bold text-cyan-400">{camp.replies}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INBOX TAB */}
          {activeTab === 'Inbox' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl h-full flex overflow-hidden animate-in fade-in duration-300">
              <div className="w-1/3 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 font-bold">Recent Messages</div>
                <div className="flex-1 overflow-y-auto">
                  {[
                    { name: "Sarah Jenkins", company: "Elite Roofing", msg: "Can we schedule a call for Tuesday?", unread: true, time: "10m" },
                    { name: "Mike Ross", company: "LegalTech Inc", msg: "I'm interested in your pricing.", unread: true, time: "1h" },
                    { name: "David Chen", company: "Peak Plumbers", msg: "Not right now, thanks.", unread: false, time: "1d" }
                  ].map((msg, i) => (
                    <div key={i} className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition ${msg.unread ? 'bg-slate-800/30' : ''}`}>
                      <div className="flex justify-between mb-1">
                        <span className={`font-medium ${msg.unread ? 'text-white' : 'text-slate-300'}`}>{msg.name}</span>
                        <span className="text-xs text-slate-500">{msg.time}</span>
                      </div>
                      <div className="text-xs text-cyan-500 mb-2">{msg.company}</div>
                      <div className={`text-sm truncate pr-4 ${msg.unread ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                        {msg.msg}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900/30">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p>Select a conversation to view the thread</p>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'Analytics' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4">Conversion Funnel</h3>
                  <div className="space-y-4">
                    {[
                      { step: "Total Scraped", val: 12847, pct: 100, color: "bg-slate-600" },
                      { step: "Qualified Leads (Score > 50)", val: 8402, pct: 65, color: "bg-blue-500" },
                      { step: "Contacted", val: 3291, pct: 25, color: "bg-cyan-500" },
                      { step: "Replied", val: 847, pct: 6, color: "bg-emerald-500" }
                    ].map((f, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{f.step}</span>
                          <span className="font-bold">{f.val}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${f.color}`} style={{ width: `${f.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                   <h3 className="text-lg font-bold mb-4">Industry Breakdown</h3>
                   <div className="flex gap-4 items-center">
                     <div className="w-48 h-48 rounded-full border-8 border-slate-800 relative flex items-center justify-center">
                       <span className="text-sm text-slate-400">Top 3</span>
                       {/* Decorative pie chart visual */}
                       <div className="absolute top-0 right-0 bottom-1/2 left-1/2 border-t-8 border-r-8 border-cyan-500 rounded-tr-full"></div>
                       <div className="absolute bottom-0 right-0 top-1/2 left-1/2 border-b-8 border-r-8 border-blue-500 rounded-br-full"></div>
                     </div>
                     <div className="flex-1 space-y-4">
                       <div>
                         <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-cyan-500 rounded-full"></div> <span className="text-sm font-medium">Home Services</span></div>
                         <div className="text-2xl font-bold ml-5 text-white">45%</div>
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> <span className="text-sm font-medium">SaaS / Software</span></div>
                         <div className="text-2xl font-bold ml-5 text-white">35%</div>
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-slate-600 rounded-full"></div> <span className="text-sm font-medium">Real Estate</span></div>
                         <div className="text-2xl font-bold ml-5 text-white">20%</div>
                       </div>
                     </div>
                   </div>
                </div>
               </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'Settings' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
               <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-6 border-b border-slate-800 pb-4">Account Profile</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Workspace Name</label>
                    <input type="text" defaultValue="Cameron's Workspace" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                    <input type="email" defaultValue="cameron@example.com" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
                <button className="mt-6 bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">Save Changes</button>
               </div>

               <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-6 border-b border-slate-800 pb-4">Connected Integrations</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-700/50 rounded-xl bg-slate-800/30">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center font-bold">SF</div>
                      <div>
                        <div className="font-bold">Salesforce</div>
                        <div className="text-xs text-slate-400">Syncs leads automatically every 1h</div>
                      </div>
                    </div>
                    <button className="text-red-400 text-sm font-medium hover:text-red-300">Disconnect</button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center font-bold">HS</div>
                      <div>
                        <div className="font-bold">HubSpot</div>
                        <div className="text-xs text-slate-400">Not connected</div>
                      </div>
                    </div>
                    <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300">Connect</button>
                  </div>
                </div>
               </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}

export default DashboardEnhanced;
