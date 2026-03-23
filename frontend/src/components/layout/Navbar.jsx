import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Settings, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user] = React.useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-gray-900/50 border-b border-gray-800 backdrop-blur-xl sticky top-0 z-40">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>

          {/* User Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setShowDropdown(!showDropdown)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.firstName?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </motion.button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 border border-gray-700 shadow-lg z-50"
              >
                <div className="p-4 border-b border-gray-700">
                  <p className="text-sm font-medium text-white">{user?.email}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/dashboard/settings');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 transition text-left"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
