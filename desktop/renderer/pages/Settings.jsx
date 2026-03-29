import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/ElectronAuthContext';
import { useToast } from '../components/ToastNotification';

const BACKEND_URL = 'http://localhost:3099';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'outreach', label: 'Outreach Channels' },
  { id: 'apikeys', label: 'API Keys' },
  { id: 'preferences', label: 'Preferences' },
];

// ── Shared styles ──
const styles = {
  page: {
    minHeight: '100vh',
    background: '#050505',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '2rem',
  },
  header: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
  tabBar: {
    display: 'flex',
    gap: '0.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '2rem',
  },
  tab: (active) => ({
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: active ? '#22d3ee' : '#9ca3af',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #22d3ee' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.2s',
  }),
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '1.5rem',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.8125rem',
    color: '#9ca3af',
    marginBottom: '0.375rem',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },
  button: {
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    color: '#fff',
    border: 'none',
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonOutline: {
    background: 'transparent',
    color: '#22d3ee',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  buttonDanger: {
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    padding: '0.625rem 1.5rem',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  badge: (color) => ({
    display: 'inline-block',
    padding: '0.2rem 0.6rem',
    borderRadius: 6,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: color === 'green' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
    color: color === 'green' ? '#10b981' : '#f59e0b',
  }),
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  fieldGroup: {
    marginBottom: '1rem',
  },
  muted: {
    color: '#6b7280',
    fontSize: '0.8125rem',
  },
  toggle: (on) => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: on ? '#22d3ee' : 'rgba(255,255,255,0.1)',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  }),
  toggleDot: (on) => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 3,
    left: on ? 23 : 3,
    transition: 'left 0.2s',
  }),
};

// ── Account Tab ──
function AccountTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      const cached = await window.electronAPI?.getSubscriptionCache?.();
      if (cached) {
        setSubInfo(cached);
      }
    } catch {}
  };

  const openBillingPortal = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      if (data?.url) {
        if (window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url);
        } else {
          window.open(data.url, '_blank');
        }
      } else {
        toast.error('Billing Portal', 'Could not open billing portal. Please try again.');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      toast.error('Billing Portal', 'Failed to open billing portal.');
    }
  };

  return (
    <div>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Profile</h3>
        <div style={styles.row}>
          <span style={styles.label}>Email</span>
          <span style={{ fontSize: '0.875rem' }}>{user?.email || 'Not signed in'}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>User ID</span>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
            {user?.id || '--'}
          </span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Subscription</h3>
        <div style={styles.row}>
          <span style={styles.label}>Status</span>
          <span style={styles.badge(subInfo?.active ? 'green' : 'yellow')}>
            {subInfo?.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={openBillingPortal} style={styles.buttonOutline}>
            Manage Billing
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Outreach Channels Tab ──
function OutreachTab() {
  const toast = useToast();
  const { user } = useAuth();

  const [smtp, setSmtp] = useState({ host: '', port: '587', username: '', password: '' });
  const [channels, setChannels] = useState({ instagram: false, facebook: false });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/outreach`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.smtp) setSmtp(data.smtp);
        if (data.channels) setChannels(data.channels);
      }
    } catch {}
  };

  const saveSmtp = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/outreach/smtp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(smtp),
      });
      if (res.ok) {
        toast.success('SMTP Settings', 'Email settings saved successfully.');
      } else {
        toast.error('SMTP Settings', 'Failed to save email settings.');
      }
    } catch (err) {
      toast.error('SMTP Settings', 'Could not reach the backend.');
    }
  };

  const toggleChannel = async (channel) => {
    const updated = { ...channels, [channel]: !channels[channel] };
    setChannels(updated);
    try {
      await fetch(`${BACKEND_URL}/api/settings/outreach/channels`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(updated),
      });
      toast.success('Channels', `${channel} ${updated[channel] ? 'connected' : 'disconnected'}.`);
    } catch {
      toast.error('Channels', 'Failed to update channel settings.');
    }
  };

  return (
    <div>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Social Channels</h3>
        <div style={styles.row}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Instagram</div>
            <div style={styles.muted}>Connect for DM outreach</div>
          </div>
          <button style={styles.toggle(channels.instagram)} onClick={() => toggleChannel('instagram')}>
            <div style={styles.toggleDot(channels.instagram)} />
          </button>
        </div>
        <div style={styles.row}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Facebook</div>
            <div style={styles.muted}>Connect for Messenger outreach</div>
          </div>
          <button style={styles.toggle(channels.facebook)} onClick={() => toggleChannel('facebook')}>
            <div style={styles.toggleDot(channels.facebook)} />
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Email (SMTP)</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>SMTP Host</label>
          <input
            style={styles.input}
            placeholder="smtp.gmail.com"
            value={smtp.host}
            onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Port</label>
          <input
            style={styles.input}
            placeholder="587"
            value={smtp.port}
            onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            placeholder="your@email.com"
            value={smtp.username}
            onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={{ ...styles.input, marginBottom: 0 }}
            type="password"
            placeholder="App password"
            value={smtp.password}
            onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
          />
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          <button onClick={saveSmtp} style={styles.button}>
            Save SMTP Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── API Keys Tab ──
function ApiKeysTab() {
  const toast = useToast();
  const { user } = useAuth();

  const [keys, setKeys] = useState({ googlePlaces: '', sendGrid: '' });
  const [showKeys, setShowKeys] = useState({ googlePlaces: false, sendGrid: false });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/api-keys`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys({
          googlePlaces: data.googlePlaces || '',
          sendGrid: data.sendGrid || '',
        });
      }
    } catch {}
  };

  const saveKey = async (keyName) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/api-keys`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ [keyName]: keys[keyName] }),
      });
      if (res.ok) {
        toast.success('API Key', `${keyName === 'googlePlaces' ? 'Google Places' : 'SendGrid'} key saved.`);
      } else {
        toast.error('API Key', 'Failed to save API key.');
      }
    } catch {
      toast.error('API Key', 'Could not reach the backend.');
    }
  };

  const maskKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
  };

  return (
    <div>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Google Places API</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>API Key</label>
          <input
            style={styles.input}
            type={showKeys.googlePlaces ? 'text' : 'password'}
            placeholder="AIza..."
            value={keys.googlePlaces}
            onChange={(e) => setKeys({ ...keys, googlePlaces: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => saveKey('googlePlaces')} style={styles.button}>
            Save
          </button>
          <button
            onClick={() => setShowKeys({ ...showKeys, googlePlaces: !showKeys.googlePlaces })}
            style={styles.buttonOutline}
          >
            {showKeys.googlePlaces ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>SendGrid</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>API Key</label>
          <input
            style={styles.input}
            type={showKeys.sendGrid ? 'text' : 'password'}
            placeholder="SG..."
            value={keys.sendGrid}
            onChange={(e) => setKeys({ ...keys, sendGrid: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => saveKey('sendGrid')} style={styles.button}>
            Save
          </button>
          <button
            onClick={() => setShowKeys({ ...showKeys, sendGrid: !showKeys.sendGrid })}
            style={styles.buttonOutline}
          >
            {showKeys.sendGrid ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preferences Tab ──
function PreferencesTab() {
  const toast = useToast();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState({
    notifications: true,
    autoScrapeOnSearch: false,
    defaultRadius: '5000',
    defaultResultLimit: '20',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/preferences`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs((prev) => ({ ...prev, ...data }));
      }
    } catch {}
  };

  const savePreferences = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        toast.success('Preferences', 'Preferences saved successfully.');
      } else {
        toast.error('Preferences', 'Failed to save preferences.');
      }
    } catch {
      toast.error('Preferences', 'Could not reach the backend.');
    }
  };

  return (
    <div>
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Notifications</h3>
        <div style={styles.row}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Desktop Notifications</div>
            <div style={styles.muted}>Get notified when scraping completes</div>
          </div>
          <button
            style={styles.toggle(prefs.notifications)}
            onClick={() => setPrefs({ ...prefs, notifications: !prefs.notifications })}
          >
            <div style={styles.toggleDot(prefs.notifications)} />
          </button>
        </div>
        <div style={styles.row}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Auto-scrape on Search</div>
            <div style={styles.muted}>Automatically start scraping when a search is executed</div>
          </div>
          <button
            style={styles.toggle(prefs.autoScrapeOnSearch)}
            onClick={() => setPrefs({ ...prefs, autoScrapeOnSearch: !prefs.autoScrapeOnSearch })}
          >
            <div style={styles.toggleDot(prefs.autoScrapeOnSearch)} />
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Scraping Defaults</h3>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Default Search Radius (meters)</label>
          <input
            style={styles.input}
            type="number"
            placeholder="5000"
            value={prefs.defaultRadius}
            onChange={(e) => setPrefs({ ...prefs, defaultRadius: e.target.value })}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Default Result Limit</label>
          <input
            style={{ ...styles.input, marginBottom: 0 }}
            type="number"
            placeholder="20"
            value={prefs.defaultResultLimit}
            onChange={(e) => setPrefs({ ...prefs, defaultResultLimit: e.target.value })}
          />
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          <button onClick={savePreferences} style={styles.button}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Settings Page ──
export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab />;
      case 'outreach':
        return <OutreachTab />;
      case 'apikeys':
        return <ApiKeysTab />;
      case 'preferences':
        return <PreferencesTab />;
      default:
        return <AccountTab />;
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Settings</h1>
      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={styles.tab(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
