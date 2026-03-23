import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Activity, 
  ArrowRight, 
  PlayCircle, 
  PauseCircle,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { startScrape } from '../services/api';

function DashboardEnhanced({ onJobCreated }) {
  const [source, setSource] = useState('web_search');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const sources = [
    { value: 'web_search', label: '🔍 Web Search', color: 'from-blue-500 to-cyan-500' },
    { value: 'google_maps', label: '📍 Google Maps', color: 'from-red-500 to-orange-500' },
    { value: 'zillow', label: '🏠 Zillow', color: 'from-purple-500 to-pink-500' },
    { value: 'nextdoor', label: '👥 Nextdoor', color: 'from-green-500 to-emerald-500' }
  ];

  const handleSubmit = async (e) => {
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
      setLimit(100);
      
      setTimeout(() => onJobCreated(), 500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start scrape job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Lead Scraper
              </h1>
              <p className="text-xs text-slate-400">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-slate-400 hover:text-white transition">Docs</button>
            <button className="px-4 py-2 text-slate-400 hover:text-white transition">Support</button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">Account</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Leads */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-blue-500/50 rounded-xl p-6 transition transform hover:scale-105 duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">Total Leads</p>
                <h3 className="text-3xl font-bold">12,450</h3>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+2,340 this month</span>
            </div>
          </div>

          {/* Jobs Completed */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-green-500/50 rounded-xl p-6 transition transform hover:scale-105 duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">Jobs Completed</p>
                <h3 className="text-3xl font-bold">48</h3>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <Activity className="w-4 h-4" />
              <span>All time</span>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-orange-500/50 rounded-xl p-6 transition transform hover:scale-105 duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">Active Jobs</p>
                <h3 className="text-3xl font-bold">3</h3>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-orange-400 text-sm">
              <PlayCircle className="w-4 h-4" />
              <span>Running</span>
            </div>
          </div>

          {/* Avg Quality Score */}
          <div className="group bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 hover:border-purple-500/50 rounded-xl p-6 transition transform hover:scale-105 duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-medium">Avg Quality Score</p>
                <h3 className="text-3xl font-bold">8.4</h3>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-purple-400 text-sm">
              <span>Out of 10</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create New Job - Main Card */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8 space-y-6 sticky top-24">
              <div>
                <h2 className="text-2xl font-bold mb-2">Create Scrape Job</h2>
                <p className="text-slate-400 text-sm">Start a new lead collection</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              )}

              {/* Source Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3">Data Source</label>
                <div className="space-y-2">
                  {sources.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSource(s.value)}
                      className={`w-full p-3 rounded-lg border-2 transition text-left font-medium ${
                        source === s.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">Search Query</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'SaaS companies in NYC'"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {/* Limit Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">Number of Leads</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  min="10"
                  max="10000"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <p className="text-xs text-slate-400 mt-2">Max 10,000 per job</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition transform ${
                  loading
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Scraping</span>
                  </>
                )}
              </button>

              <div className="border-t border-slate-700 pt-6">
                <p className="text-xs text-slate-400 mb-3 font-semibold">QUICK TIPS</p>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li>• Be specific with your queries</li>
                  <li>• AI qualification is included</li>
                  <li>• Results available immediately</li>
                  <li>• See pricing for rate limits</li>
                </ul>
              </div>
            </form>
          </div>

          {/* Recent Activity & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-slate-700/50 hover:bg-slate-600 rounded-lg p-4 text-left transition group">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition">
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="font-semibold">Templates</span>
                  </div>
                  <p className="text-xs text-slate-400">Use preset searches</p>
                </button>

                <button className="bg-slate-700/50 hover:bg-slate-600 rounded-lg p-4 text-left transition group">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="font-semibold">Import CSV</span>
                  </div>
                  <p className="text-xs text-slate-400">Upload your list</p>
                </button>

                <button className="bg-slate-700/50 hover:bg-slate-600 rounded-lg p-4 text-left transition group">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-semibold">View Analytics</span>
                  </div>
                  <p className="text-xs text-slate-400">Deep dive reports</p>
                </button>

                <button className="bg-slate-700/50 hover:bg-slate-600 rounded-lg p-4 text-left transition group">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center group-hover:bg-orange-500/20 transition">
                      <Activity className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="font-semibold">API Docs</span>
                  </div>
                  <p className="text-xs text-slate-400">Integrate programmatically</p>
                </button>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 border border-slate-700 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6">Recent Jobs</h3>
              <div className="space-y-4">
                {[
                  {
                    name: 'Tech Companies NYC',
                    source: 'Web Search',
                    count: '2,340',
                    status: 'completed',
                    date: '2h ago'
                  },
                  {
                    name: 'Insurance Brokers',
                    source: 'Google Maps',
                    count: '1,850',
                    status: 'completed',
                    date: '5h ago'
                  },
                  {
                    name: 'Real Estate Agents',
                    source: 'Zillow',
                    count: '945',
                    status: 'running',
                    date: '15min ago'
                  }
                ].map((job, i) => (
                  <div
                    key={i}
                    className="bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 rounded-lg p-4 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold group-hover:text-blue-400 transition">{job.name}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                          <span>{job.source}</span>
                          <span>•</span>
                          <span>{job.count} leads</span>
                          <span>•</span>
                          <span>{job.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {job.status === 'completed' ? (
                          <div className="flex items-center space-x-2 text-green-400 text-sm">
                            <CheckCircle className="w-5 h-5" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-orange-400 text-sm">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            <span>Running</span>
                          </div>
                        )}
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Features */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Unlock Pro Features</h3>
                  <p className="text-slate-400 text-sm">Get unlimited leads and advanced tools</p>
                </div>
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">PRO</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-300 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Unlimited lead exports</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Advanced AI qualification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>CRM integrations included</span>
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 rounded-lg transition">
                Upgrade Now →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardEnhanced;
