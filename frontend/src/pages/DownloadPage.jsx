import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Monitor, Apple, ArrowRight, Shield, Zap, RefreshCw } from 'lucide-react';

const GITHUB_RELEASES_URL =
  'https://github.com/cameroncook10/LEAD-Scraper/releases/latest';

export default function DownloadPage() {
  const platform = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'mac';
    return 'win';
  }, []);

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
        </div>
      </nav>

      {/* Hero */}
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
              Install the desktop app to start scraping leads, qualifying with AI,
              and automating your outreach.
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
    </div>
  );
}
