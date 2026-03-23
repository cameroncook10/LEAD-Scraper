import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  Mail,
  MessageSquare,
  BarChart3,
  Activity,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react';

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      label: 'Leads',
      icon: Database,
      path: '/dashboard/leads',
    },
    {
      label: 'Campaigns',
      icon: Mail,
      path: '/dashboard/campaigns',
    },
    {
      label: 'Templates',
      icon: MessageSquare,
      path: '/dashboard/templates',
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/dashboard/analytics',
    },
    {
      label: 'Agent Logs',
      icon: Activity,
      path: '/dashboard/agent-logs',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/dashboard/settings',
    },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 250 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-gray-900/50 border-r border-gray-800 backdrop-blur-xl flex-col overflow-hidden z-40"
      >
        <div className="w-250 h-full flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold">AL</span>
              </div>
              <span className="text-white font-semibold">Agent Lead</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition relative group ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {active && (
                      <ChevronRight className="w-4 h-4 ml-auto text-cyan-400" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm transition"
            >
              Start Scrape
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 w-64 h-screen bg-gray-900 border-r border-gray-800 backdrop-blur-xl z-40 lg:hidden flex flex-col"
      >
        {/* Close Button */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold">AL</span>
            </div>
            <span className="text-white font-semibold">Agent Lead</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-800/50 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </motion.div>

      {/* Sidebar width spacer for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}

export default Sidebar;
