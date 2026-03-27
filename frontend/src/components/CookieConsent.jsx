import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'agentlead_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto backdrop-blur-xl bg-gray-900/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-300 leading-relaxed">
              We use cookies to improve your experience and analyze site usage.
              By clicking "Accept", you consent to our use of cookies. Read our{' '}
              <Link to="/privacy" className="text-cyan-400 hover:underline">
                Privacy Policy
              </Link>{' '}
              for more information.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
