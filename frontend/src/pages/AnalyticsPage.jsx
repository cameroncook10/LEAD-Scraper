import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    leadsScraped: [],
    leadQuality: { hot: 0, warm: 0, cold: 0, invalid: 0 },
    conversionFunnel: [],
    emailMetrics: [],
    smsMetrics: [],
    revenueBySource: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analytics/summary`,
        {
          params: { dateRange },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analytics/export`,
        {
          params: { dateRange, format },
          headers: { Authorization: `Bearer ${token}` },
          responseType: format === 'pdf' ? 'blob' : 'json',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('csv')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              CSV
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              PDF
            </motion.button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads Scraped"
          value={analytics.leadsScraped.reduce((sum, item) => sum + item.count, 0)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Hot Leads"
          value={analytics.leadQuality.hot}
          icon={<BarChart3 className="w-5 h-5" />}
          color="text-red-400"
        />
        <MetricCard
          title="Warm Leads"
          value={analytics.leadQuality.warm}
          icon={<BarChart3 className="w-5 h-5" />}
          color="text-yellow-400"
        />
        <MetricCard
          title="Cold Leads"
          value={analytics.leadQuality.cold}
          icon={<BarChart3 className="w-5 h-5" />}
          color="text-blue-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time */}
        <ChartContainer title="Leads Scraped Over Time">
          <Line
            data={{
              labels: analytics.leadsScraped.map((item) => item.date),
              datasets: [
                {
                  label: 'Leads Scraped',
                  data: analytics.leadsScraped.map((item) => item.count),
                  borderColor: '#06b6d4',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  tension: 0.4,
                  fill: true,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#9ca3af' },
                },
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#9ca3af' },
                },
              },
            }}
          />
        </ChartContainer>

        {/* Lead Quality Distribution */}
        <ChartContainer title="Lead Quality Distribution">
          <Doughnut
            data={{
              labels: ['Hot', 'Warm', 'Cold', 'Invalid'],
              datasets: [
                {
                  data: [
                    analytics.leadQuality.hot,
                    analytics.leadQuality.warm,
                    analytics.leadQuality.cold,
                    analytics.leadQuality.invalid,
                  ],
                  backgroundColor: [
                    '#ef4444',
                    '#eab308',
                    '#3b82f6',
                    '#6b7280',
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#e5e7eb' },
                },
              },
            }}
          />
        </ChartContainer>

        {/* Conversion Funnel */}
        <ChartContainer title="Conversion Funnel">
          <Bar
            data={{
              labels: ['Leads', 'Contacted', 'Responded', 'Converted'],
              datasets: [
                {
                  label: 'Count',
                  data: [100, 75, 45, 12],
                  backgroundColor: '#06b6d4',
                  borderColor: '#0891b2',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              indexAxis: 'y',
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#9ca3af' },
                },
                y: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#9ca3af' },
                },
              },
            }}
          />
        </ChartContainer>

        {/* Revenue by Source */}
        <ChartContainer title="Revenue by Source">
          <Bar
            data={{
              labels: ['Zillow', 'Nextdoor', 'Google Maps', 'Web'],
              datasets: [
                {
                  label: 'Revenue ($)',
                  data: [1200, 900, 1500, 800],
                  backgroundColor: [
                    '#06b6d4',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#9ca3af' },
                },
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#9ca3af' },
                },
              },
            }}
          />
        </ChartContainer>
      </div>

      {/* Email & SMS Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Metrics */}
        <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Email Metrics</h3>
          <div className="space-y-4">
            <MetricRow label="Sent" value="1,245" />
            <MetricRow label="Delivered" value="1,189 (95.5%)" color="text-green-400" />
            <MetricRow label="Opened" value="534 (42.8%)" color="text-blue-400" />
            <MetricRow label="Clicked" value="187 (15.0%)" color="text-yellow-400" />
            <MetricRow label="Bounced" value="56 (4.5%)" color="text-red-400" />
          </div>
        </div>

        {/* SMS Metrics */}
        <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">SMS Metrics</h3>
          <div className="space-y-4">
            <MetricRow label="Sent" value="543" />
            <MetricRow label="Delivered" value="512 (94.3%)" color="text-green-400" />
            <MetricRow label="Read" value="289 (53.2%)" color="text-blue-400" />
            <MetricRow label="Replied" value="78 (14.4%)" color="text-yellow-400" />
            <MetricRow label="Failed" value="31 (5.7%)" color="text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color = 'text-cyan-400' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg bg-cyan-500/10 ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function ChartContainer({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      <div className="h-80">
        {children}
      </div>
    </motion.div>
  );
}

function MetricRow({ label, value, color = 'text-gray-300' }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-800 last:border-b-0">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export default AnalyticsPage;
