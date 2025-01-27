import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Calendar,
  Settings,
  PlusSquare,
  BarChart2,
  Activity,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { useAuthStore } from '../store/authStore';
import CreateTeamModal from './CreateTeamModal';

export default function Sidebar() {
  const location = useLocation();
  const { teams, fetchTeams } = useTeamStore();
  const { isAdmin } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState(true);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-blue-600' },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare, color: 'text-green-600' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, color: 'text-purple-600' },
    { name: 'Reports', href: '/reports', icon: BarChart2, color: 'text-orange-600' },
    { name: 'Analytics', href: '/analytics', icon: Activity, color: 'text-pink-600' },
    { name: 'Documentation', href: '/docs', icon: BookOpen, color: 'text-teal-600' },
    ...(isAdmin ? [{ name: 'Settings', href: '/settings', icon: Settings, color: 'text-gray-600' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              TaskMaster
            </span>
          </div>

          <div className="flex-1 px-3 py-4 overflow-y-auto">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      isActive(item.href)
                        ? `bg-gray-100 ${item.color}`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${item.color}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8">
              <div className="px-3 mb-2">
                <button
                  onClick={() => setExpandedTeams(!expandedTeams)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  Teams
                  {expandedTeams ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
              {expandedTeams && (
                <nav className="space-y-1">
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/team/${team.id}`}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                        isActive(`/team/${team.id}`)
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Users className="w-5 h-5 mr-3 text-indigo-500" />
                      {team.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  >
                    <PlusSquare className="w-5 h-5 mr-3 text-green-500" />
                    Create Team
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateTeamModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}