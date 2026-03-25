/**
 * Settings Page — Social Account Connections
 * 
 * Shows connected Instagram/Facebook accounts with connect/disconnect buttons.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Instagram, Facebook, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const PROVIDERS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    description: 'Send auto-DMs to leads on Instagram',
    color: 'from-pink-500 to-purple-500',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    description: 'Send messages via Facebook Messenger',
    color: 'from-blue-500 to-blue-600',
  },
];

export function SettingsPage() {
  const { accessToken, user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState(null);

  // Check URL params for connection status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      fetchConnections();
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    }
    if (params.get('error')) {
      console.error('OAuth error:', params.get('error'));
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  useEffect(() => {
    if (accessToken) fetchConnections();
  }, [accessToken]);

  const fetchConnections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/connections`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    setConnectingProvider(provider);
    try {
      const res = await fetch(`${API_BASE}/api/auth/${provider}/connect`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider) => {
    try {
      await fetch(`${API_BASE}/api/auth/disconnect/${provider}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchConnections();
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
    }
  };

  const isConnected = (providerId) => connections.some(c => c.provider === providerId);
  const getConnection = (providerId) => connections.find(c => c.provider === providerId);

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-display text-3xl md:text-4xl mb-2">
          <span className="gradient-text-subtle">Account </span>
          <span className="gradient-text-cyan">Settings</span>
        </h1>
        <p className="text-gray-500 mb-10">Manage your connected accounts and integrations</p>

        {/* User info */}
        {user && (
          <div className="glass-liquid rounded-2xl p-6 mb-8 flex items-center gap-4">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full" />
            )}
            <div>
              <p className="text-white font-semibold">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        )}

        {/* Social connections */}
        <h2 className="text-lg font-semibold text-white mb-4">Connected Accounts</h2>
        <div className="space-y-4">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const connected = isConnected(provider.id);
            const conn = getConnection(provider.id);

            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-liquid rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{provider.name}</span>
                      {connected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">
                      {connected
                        ? `Connected${conn?.pageName ? ` · ${conn.pageName}` : ''}`
                        : provider.description}
                    </p>
                  </div>
                </div>

                {connected ? (
                  <button
                    onClick={() => handleDisconnect(provider.id)}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(provider.id)}
                    disabled={connectingProvider === provider.id}
                    className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {connectingProvider === provider.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    Connect
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
