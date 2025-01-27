import React, { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import NotificationCenter from './NotificationCenter';
import { Link } from 'react-router-dom';

export default function Header() {
  const { user, signOut } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Bell className="w-6 h-6" />
            </button>
            {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
          </div>

          <Link 
            to="/settings"
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-6 h-6" />
          </Link>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}