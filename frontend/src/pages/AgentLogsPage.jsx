import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function AgentLogsPage() {
  const [logs, setLogs] = useState([]);
  const [agents, setAgents] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAgentData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAgentData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const [logsRes, statusRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/agents/logs`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/agents/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setLogs(logsRes.data);
      setAgents(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      toast.error('Failed to load agent logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedAgent !== 'all' && log.agentName !== selectedAgent) return false;
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'running':
        return <Zap className="w-5 h-5 text-blue-400 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30';
      case 'running':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/10 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading agent logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Logs</h1>
          <p className="text-gray-400">Real-time monitoring of all background agents</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchAgentData}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoRefresh"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="w-4 h-4 rounded bg-gray-700 border-gray-600 cursor-pointer"
        />
        <label htmlFor="autoRefresh" className="text-gray-300 text-sm cursor-pointer">
          Auto-refresh every 5 seconds
        </label>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(agents).map(([agentName, agentStatus]) => (
          <AgentStatusCard key={agentName} agentName={agentName} status={agentStatus} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">Filter by:</span>
        </div>

        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Agents</option>
          <option value="scraper">Lead Scraper</option>
          <option value="qualifier">Lead Qualifier</option>
          <option value="dm-agent">DM Agent</option>
          <option value="analytics">Analytics Agent</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <span className="text-gray-400 text-sm">
          {filteredLogs.length} results
        </span>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-cyan-500/20 backdrop-blur-xl bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Agent</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                        <span className="text-white font-medium">{log.agentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{log.action}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize text-sm text-gray-300">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {log.duration ? `${log.duration}ms` : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.error ? (
                        <button className="text-red-400 hover:text-red-300 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Error
                        </button>
                      ) : (
                        <span className="text-green-400">OK</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Queue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard label="Pending Jobs" value={filteredLogs.filter((l) => l.status === 'pending').length} />
        <StatsCard label="Running Jobs" value={filteredLogs.filter((l) => l.status === 'running').length} />
        <StatsCard label="Failed Jobs" value={filteredLogs.filter((l) => l.status === 'failed').length} />
      </div>
    </div>
  );
}

function AgentStatusCard({ agentName, status }) {
  const statusColors = {
    active: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Active' },
    idle: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Idle' },
    error: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Error' },
  };

  const color = statusColors[status.state] || statusColors.idle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 border ${color.bg} border-gray-700 backdrop-blur-xl bg-gray-900/50`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold capitalize">{agentName}</h3>
        <div className={`w-3 h-3 rounded-full ${color.text.replace('text-', 'bg-')}`}></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status</span>
          <span className={`font-medium ${color.text}`}>{color.label}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Jobs</span>
          <span className="text-gray-300">{status.jobsProcessed || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Uptime</span>
          <span className="text-gray-300">{status.uptime || 'N/A'}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatsCard({ label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-6 border border-cyan-500/20 backdrop-blur-xl bg-gray-900/50"
    >
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

export default AgentLogsPage;
