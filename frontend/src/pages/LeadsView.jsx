import React, { useState, useEffect } from 'react';
import { getLeads, getLeadsStats, exportLeads, deleteLead } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

function LeadsView() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    source: '',
    category: '',
    minScore: 0,
    maxScore: 100,
    search: '',
    limit: 50,
    offset: 0
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getLeads(filters);
      setLeads(data.leads || []);
      setTotalLeads(data.total || 0);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getLeadsStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportLeads(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export leads:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(id);
        setLeads(leads.filter(l => l.id !== id));
      } catch (error) {
        console.error('Failed to delete lead:', error);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      offset: 0 // Reset pagination
    }));
  };

  const handlePageChange = (newOffset) => {
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Hot';
    if (score >= 50) return 'Warm';
    return 'Cold';
  };

  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(totalLeads / filters.limit);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Hot Leads</p>
            <p className="text-3xl font-bold text-green-600">{stats.scoreDistribution.hot}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Warm Leads</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.scoreDistribution.warm}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Avg Score</p>
            <p className="text-3xl font-bold text-blue-600">{stats.averageScore}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Name, email, phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Source filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sources</option>
              <option value="web_search">Web Search</option>
              <option value="google_maps">Google Maps</option>
              <option value="zillow">Zillow</option>
              <option value="nextdoor">Nextdoor</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="invalid">Invalid</option>
            </select>
          </div>

          {/* Min Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Score: {filters.minScore}
            </label>
            <input
              type="range"
              name="minScore"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={handleFilterChange}
              className="w-full"
            />
          </div>

          {/* Max Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Score: {filters.maxScore}
            </label>
            <input
              type="range"
              name="maxScore"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={handleFilterChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Export button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleExport}
            disabled={exporting || leads.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            {exporting ? 'Exporting...' : '📥 Export to CSV'}
          </button>
        </div>
      </div>

      {/* Leads table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {lead.phone && (
                          <p className="text-gray-900">{lead.phone}</p>
                        )}
                        {lead.email && (
                          <p className="text-gray-600 truncate">{lead.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <p className="text-gray-900">{lead.business_type}</p>
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {lead.website}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-sm ${getScoreColor(lead.ai_score)}`}>
                          {lead.ai_score}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {getScoreLabel(lead.ai_score)} ({Math.round(lead.ai_confidence * 100)}%)
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {lead.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalLeads)} of {totalLeads} leads
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange((page - 1) * filters.limit)}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(filters.offset + filters.limit)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadsView;
