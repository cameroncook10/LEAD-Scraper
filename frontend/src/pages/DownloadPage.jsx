import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Monitor, Apple, ArrowRight, Shield, Zap, RefreshCw, Lock, Mail, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const GITHUB_RELEASES_URL =
  'https://github.com/cameroncook10/LEAD-Scraper/releases/latest';

export default function DownloadPage() {
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const email = searchParams.get('email');

    if (sessionId || email) {
      verifySubscription(email, sessionId);
    } else {
      const cachedEmail = localStorage.getItem('agentlead_verified_email');
      if (cachedEmail) {
        verifySubscription(cachedEmail);
      } else {
        setChecking(false);
      }
    }
  }, [searchParams]);

  async function verifySubscription(email, sessionId) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        // Dev mode — allow download when Supabase isn't configured
        setVerified(true);
        setChecking(false);
        return;
      }

      const body = {};
      if (email) body.email = email;
      if (sessionId) body.sessionId = sessionId;

      const res = await fetch(`${supabaseUrl}/functions/v1/verify-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.active) {
        setVerified(true);
        if (email) localStorage.setItem('agentlead_verified_email', email);
      } else {
        localStorage.removeItem('agentlead_verified_email');
      }
    } catch (err) {
      console.error('Subscription verification error:', err);
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AgentLead" className="w-9 h-9 object-contain" />
            <span className="font-bold text-base">
              <span className="text-white">Agent</span>
              <span className="text-cyan-400">Lead</span>
            </span>
          </a>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            Back to Home
          </a>
        </div>
      </nav>

      {verified ? <DownloadContent /> : <PaywallContent />}
    </div>
  );
}

/* ─── Verified: Show download links ─── */
function DownloadContent() {
  return (
    <section className="px-6 pt-16 pb-24">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-6">
            <Download className="w-8 h-8 text-cyan-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Download </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              AgentLead
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
            Your subscription is active. Download the desktop app to start scraping
            leads, qualifying with AI, and automating your outreach.
          </p>
        </motion.div>

        {/* Download buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col items-center gap-4 mb-16"
        >
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-10 py-4 rounded-xl font-semibold transition-all bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 text-lg"
          >
            <Monitor className="w-6 h-6" />
            Download for Windows
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-xs text-gray-500">Requires Windows 10 or later</p>

          <div className="flex items-center gap-3 px-10 py-4 rounded-xl font-semibold bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed mt-2">
            <Apple className="w-5 h-5" />
            macOS — Coming Soon
          </div>
        </motion.div>

        {/* Features row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          {[
            { icon: Zap, label: 'Scraping runs locally', desc: 'Fast, private, no server limits' },
            { icon: RefreshCw, label: 'Auto-updates', desc: 'Always on the latest version' },
            { icon: Shield, label: 'Secure', desc: 'Your data stays on your machine' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-16 text-left max-w-lg mx-auto"
        >
          <h3 className="text-lg font-semibold mb-4 text-center">Getting Started</h3>
          <ol className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
              <span>Download and install the app for your platform</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
              <span>Open AgentLead and sign in with your Google account</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
              <span>Start your first scraping campaign and let AI qualify your leads</span>
            </li>
          </ol>
        </motion.div>

        <p className="mt-12 text-xs text-gray-600">
          Already installed?{' '}
          <a href="agentlead://launch" className="text-cyan-500 hover:underline">
            Launch AgentLead
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─── Not verified: Show paywall ─── */
function PaywallContent() {
  return (
    <section className="px-6 pt-16 pb-24">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Subscribe to </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Download
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            AgentLead is available exclusively to subscribers. Choose a plan to
            get instant access to the desktop app.
          </p>
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col items-center gap-4 mb-12"
        >
          <a
            href="/#pricing"
            className="flex items-center gap-3 px-10 py-4 rounded-xl font-semibold transition-all bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 text-lg"
          >
            View Plans & Subscribe
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Free trial CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-lg mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Want a Free Trial?</h3>
          </div>
          <p className="text-gray-400 text-sm mb-5">
            We offer free trials on a case-by-case basis. Send us an email with your
            business name and use case, and we'll get you set up.
          </p>
          <a
            href="mailto:support@agentlead.io?subject=Free%20Trial%20Request&body=Hi%20AgentLead%20team%2C%0A%0AI'd%20like%20to%20request%20a%20free%20trial.%0A%0ABusiness%20name%3A%20%0AUse%20case%3A%20%0A%0AThanks!"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email support@agentlead.io
          </a>
        </motion.div>

        {/* What you get */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-12"
        >
          {[
            { icon: Zap, label: 'AI Lead Qualification', desc: 'Score and rank every lead automatically' },
            { icon: RefreshCw, label: 'Automated Outreach', desc: 'DMs, comments, and emails on autopilot' },
            { icon: Shield, label: 'Local & Secure', desc: 'Your data never leaves your machine' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
