import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
  MapPin,
  Globe,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

function SettingsPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl">
        {activeTab === 'account' && <AccountSettings user={user} setUser={setUser} />}
        {activeTab === 'security' && <SecuritySettings user={user} />}
        {activeTab === 'integrations' && <IntegrationsSettings />}
        {activeTab === 'preferences' && <PreferencesSettings />}
        {activeTab === 'notifications' && <NotificationsSettings />}
        {activeTab === 'billing' && <BillingSettings />}
      </div>
    </div>
  );
}

function AccountSettings({ user, setUser }) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    timezone: 'America/New_York',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save Changes
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

function SecuritySettings({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </motion.button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
            <p className="text-gray-400 text-sm mt-1">Add an extra layer of security</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm transition"
          >
            Enable
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function IntegrationsSettings() {
  const integrations = [
    { name: 'SendGrid', icon: '✉️', status: 'connected', key: 'sendgrid_api_key' },
    { name: 'Twilio', icon: '📱', status: 'disconnected', key: 'twilio_api_key' },
    { name: 'Supabase', icon: '🗄️', status: 'connected', key: 'supabase_key' },
    { name: 'Claude API', icon: '🤖', status: 'connected', key: 'anthropic_api_key' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {integrations.map((integration) => (
        <div
          key={integration.key}
          className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{integration.icon}</span>
            <div>
              <h3 className="text-white font-semibold">{integration.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  integration.status === 'connected' ? 'bg-green-400' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-400 capitalize">
                  {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition"
          >
            {integration.status === 'connected' ? 'Reconfigure' : 'Connect'}
          </motion.button>
        </div>
      ))}
    </motion.div>
  );
}

function PreferencesSettings() {
  const [preferences, setPreferences] = useState({
    scrapingSources: ['zillow', 'nextdoor', 'google-maps'],
    leadLimit: 1000,
    autoQualify: true,
    dailySchedule: true,
  });

  const sources = [
    { id: 'zillow', name: 'Zillow', icon: '🏠' },
    { id: 'nextdoor', name: 'Nextdoor', icon: '🏘️' },
    { id: 'google-maps', name: 'Google Maps', icon: '📍' },
    { id: 'web', name: 'Web Search', icon: '🌐' },
  ];

  const toggleSource = (sourceId) => {
    setPreferences({
      ...preferences,
      scrapingSources: preferences.scrapingSources.includes(sourceId)
        ? preferences.scrapingSources.filter((s) => s !== sourceId)
        : [...preferences.scrapingSources, sourceId],
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/preferences`,
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Scraping Preferences</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Preferred Sources
            </label>
            <div className="space-y-2">
              {sources.map((source) => (
                <label key={source.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.scrapingSources.includes(source.id)}
                    onChange={() => toggleSource(source.id)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <span className="text-gray-300">
                    {source.icon} {source.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Lead Limit
            </label>
            <input
              type="number"
              value={preferences.leadLimit}
              onChange={(e) => setPreferences({ ...preferences, leadLimit: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.autoQualify}
              onChange={(e) => setPreferences({ ...preferences, autoQualify: e.target.checked })}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            />
            <span className="text-gray-300">Auto-qualify leads with AI</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.dailySchedule}
              onChange={(e) => setPreferences({ ...preferences, dailySchedule: e.target.checked })}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            />
            <span className="text-gray-300">Enable daily scraping schedule</span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition"
          >
            Save Preferences
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsSettings() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    leadAlerts: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
            { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser notifications' },
            { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive weekly performance report' },
            { key: 'leadAlerts', label: 'Hot Lead Alerts', description: 'Get notified when hot leads are found' },
          ].map((option) => (
            <label key={option.key} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition">
              <div>
                <p className="text-white font-medium">{option.label}</p>
                <p className="text-gray-400 text-sm">{option.description}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications[option.key]}
                onChange={(e) => setNotifications({ ...notifications, [option.key]: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BillingSettings() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Current Plan</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <span className="text-gray-300">Plan Type</span>
            <span className="text-white font-semibold">Professional</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <span className="text-gray-300">Billing Period</span>
            <span className="text-white font-semibold">Monthly</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <span className="text-gray-300">Renewal Date</span>
            <span className="text-white font-semibold">April 23, 2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Amount</span>
            <span className="text-white font-semibold">$99/month</span>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-gray-900/50 border border-cyan-500/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Payment Method</h2>
        <div className="flex items-center justify-between pb-6 border-b border-gray-800">
          <div>
            <p className="text-white font-medium">Visa ending in 4242</p>
            <p className="text-gray-400 text-sm">Expires 12/26</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition"
          >
            Update
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsPage;
