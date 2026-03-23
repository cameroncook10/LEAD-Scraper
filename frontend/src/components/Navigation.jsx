import React, { useState } from 'react';
import { Button } from './Button';

export const Navigation = ({ currentPage, onPageChange, pages = [] }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const defaultPages = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'jobs', label: 'Jobs', icon: '⚙️' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'campaigns', label: 'Campaigns', icon: '📧' },
    { id: 'settings', label: 'Settings', icon: '⚡' }
  ];

  const navPages = pages.length > 0 ? pages : defaultPages;

  const handlePageChange = (pageId) => {
    onPageChange(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
              LeadScraper
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navPages.map(page => (
              <button
                key={page.id}
                onClick={() => handlePageChange(page.id)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${currentPage === page.id
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                <span className="mr-2">{page.icon}</span>
                {page.label}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-slideDown">
            {navPages.map(page => (
              <button
                key={page.id}
                onClick={() => handlePageChange(page.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${currentPage === page.id
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                <span className="mr-2">{page.icon}</span>
                {page.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export const Footer = () => (
  <footer className="bg-slate-50 border-t border-slate-200 mt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">About</h3>
          <p className="text-sm text-slate-600">LeadScraper: AI-powered lead qualification and automated outreach</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Features</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><a href="#" className="hover:text-cyan-600">Web Scraping</a></li>
            <li><a href="#" className="hover:text-cyan-600">Lead Qualification</a></li>
            <li><a href="#" className="hover:text-cyan-600">Auto-Messaging</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Resources</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><a href="#" className="hover:text-cyan-600">Documentation</a></li>
            <li><a href="#" className="hover:text-cyan-600">API Reference</a></li>
            <li><a href="#" className="hover:text-cyan-600">Support</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li><a href="#" className="hover:text-cyan-600">Privacy</a></li>
            <li><a href="#" className="hover:text-cyan-600">Terms</a></li>
            <li><a href="#" className="hover:text-cyan-600">Security</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-8">
        <p className="text-center text-sm text-slate-600">
          © 2024 LeadScraper. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);
