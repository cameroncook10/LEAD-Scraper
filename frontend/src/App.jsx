import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import JobMonitor from './pages/JobMonitor';
import LeadsView from './pages/LeadsView';
import { LampDemo } from './components/ui/lamp-demo';
import { NeuralHeroDemo } from './components/ui/flow-field-demo';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [jobRefresh, setJobRefresh] = useState(0);

  const handleJobCreated = () => {
    setJobRefresh(prev => prev + 1);
    setCurrentPage('jobs');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Scraper</h1>
              <p className="text-sm text-gray-500 mt-1">AI-powered lead qualification system</p>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentPage('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'home'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('jobs')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'jobs'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Jobs
              </button>
              <button
                onClick={() => setCurrentPage('leads')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 'leads'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Leads
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full flex-1">
        {currentPage === 'home' && (
          <div className="w-full flex flex-col bg-slate-950 overflow-x-hidden">
            <NeuralHeroDemo />
            <div className="w-full min-h-[500px] flex items-center justify-center -mt-20 z-10 relative">
              <LampDemo />
            </div>
          </div>
        )}
        {currentPage === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <Dashboard onJobCreated={handleJobCreated} />
          </div>
        )}
        {currentPage === 'jobs' && (
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <JobMonitor key={jobRefresh} />
          </div>
        )}
        {currentPage === 'leads' && (
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <LeadsView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Lead Scraper MVP • Built with React, Node.js, and Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
