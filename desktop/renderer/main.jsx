import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardEnhanced from '../../frontend/src/pages/Dashboard_Enhanced';
import { LoginPage } from '../../frontend/src/pages/LoginPage';
import { AuthProvider } from './contexts/ElectronAuthContext';
import { SubscriptionGate } from './contexts/SubscriptionGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastNotification';
import Settings from './pages/Settings';
import '../../frontend/src/index.css';

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ToastProvider>
          <AuthProvider>
            <SubscriptionGate>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardEnhanced />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </SubscriptionGate>
          </AuthProvider>
        </ToastProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
