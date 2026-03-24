import React, { useState } from 'react';
import { startScrape } from '../services/api';

function Dashboard({ onJobCreated }) {
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
    { value: 'nextdoor', label: 'Local Biz' },
    { value: 'premium', label: 'Premium' },
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
      
      // Notify parent to switch to jobs view
      setTimeout(() => onJobCreated(), 500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start scrape job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">1,245</p>
          <p className="text-xs text-gray-400 mt-2">All sources combined</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Hot Leads</p>
          <p className="text-3xl font-bold text-green-600 mt-2">342</p>
          <p className="text-xs text-gray-400 mt-2">Score 80+</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Processing</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">3</p>
          <p className="text-xs text-gray-400 mt-2">Active scrape jobs</p>
        </div>
      </div>

      {/* Scrape form */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start New Scrape Job</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Source
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sources.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`p-4 rounded-lg border-2 font-medium transition-colors ${
                    source === s.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Query input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., plumbers in New York, HVAC services, real estate agents"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a specific search query to find relevant leads
            </p>
          </div>

          {/* Limit input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Leads to Scrape
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
              max="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum 1000 leads per job. Each lead will be AI-qualified.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">⚠️ {error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Starting scrape...' : 'Start Scrape Job'}
          </button>
        </form>

        {/* Info box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>How it works:</strong> Enter your search query and select a data source. 
            We'll scrape leads from that source and use AI to qualify each one with a score (0-100), 
            category (hot/warm/cold), and confidence level.
          </p>
        </div>
      </div>

      {/* Features section */}
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                ✓
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Multi-source scraping</h4>
              <p className="text-sm text-gray-500 mt-1">Web search, Google Maps, Zillow, Nextdoor</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                ✓
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">AI qualification</h4>
              <p className="text-sm text-gray-500 mt-1">Claude Haiku analyzes and scores each lead</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                ✓
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Real-time progress</h4>
              <p className="text-sm text-gray-500 mt-1">Monitor scrape jobs and AI qualification</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                ✓
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Export to CSV</h4>
              <p className="text-sm text-gray-500 mt-1">Download filtered leads with all details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
