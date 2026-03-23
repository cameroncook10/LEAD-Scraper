import React, { useState, useEffect } from 'react';
import { getJobs, getJobDetails } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

function JobMonitor() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchJobDetails(selectedJobId);
      const interval = setInterval(() => fetchJobDetails(selectedJobId), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const data = await getJobs(null, 50);
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      setError('Failed to load jobs');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchJobDetails = async (jobId) => {
    try {
      const data = await getJobDetails(jobId);
      setSelectedJobDetails(data);
    } catch (err) {
      console.error('Failed to load job details:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Scrape Jobs</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Jobs ({jobs.length})</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No jobs yet</p>
                </div>
              ) : (
                jobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedJobId === job.id
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {job.source}
                      </p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </p>
                    {job.total_leads > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {job.processed_leads} / {job.total_leads} leads
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Job details */}
        <div className="lg:col-span-2">
          {selectedJobDetails ? (
            <div className="space-y-4">
              {/* Job info */}
              <div className={`border rounded-lg p-6 ${getStatusColor(selectedJobDetails.job.status)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedJobDetails.job.source}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      ID: {selectedJobDetails.job.id}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedJobDetails.job.status)}`}>
                    {selectedJobDetails.job.status}
                  </span>
                </div>

                {/* Progress bar */}
                {selectedJobDetails.job.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700">Progress</span>
                      <span className="text-gray-700">
                        {selectedJobDetails.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedJobDetails.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedJobDetails.job.total_leads}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedJobDetails.job.processed_leads}
                    </p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t border-gray-300 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Started:</span>
                    <span>
                      {selectedJobDetails.job.started_at
                        ? new Date(selectedJobDetails.job.started_at).toLocaleString()
                        : 'Not started'}
                    </span>
                  </div>
                  {selectedJobDetails.job.completed_at && (
                    <div className="flex justify-between text-gray-600">
                      <span>Completed:</span>
                      <span>
                        {new Date(selectedJobDetails.job.completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {selectedJobDetails.job.error_message && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                    {selectedJobDetails.job.error_message}
                  </div>
                )}
              </div>

              {/* Logs */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Logs</h4>
                </div>
                <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {selectedJobDetails.logs.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No logs yet</p>
                    </div>
                  ) : (
                    selectedJobDetails.logs.map((log, idx) => (
                      <div key={idx} className="p-3 text-sm">
                        <div className="flex items-start justify-between">
                          <p className="text-gray-900 flex-1">{log.message}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                            log.level === 'error' ? 'bg-red-100 text-red-800' :
                            log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.level}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
              <div className="text-center">
                <p className="text-gray-500">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobMonitor;
