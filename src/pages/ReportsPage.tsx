import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { useTeamStore } from '../store/teamStore';
import { BarChart3, PieChart, TrendingUp, Download } from 'lucide-react';
import { formatDate } from '../lib/utils';

export default function ReportsPage() {
  const { tasks } = useTaskStore();
  const { teams } = useTeamStore();

  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tasksByPriority = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tasksByTeam = tasks.reduce((acc, task) => {
    const team = teams.find(t => t.id === task.team_id);
    if (team) {
      acc[team.name] = (acc[team.name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const completionRate = tasks.length > 0
    ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {tasks.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PieChart className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completion Rate
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {completionRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Teams
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {teams.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Status</h3>
            <div className="space-y-4">
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {status.replace('_', ' ')}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-blue-500"
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-600">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Priority</h3>
            <div className="space-y-4">
              {Object.entries(tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600">
                    {priority}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full ${
                          priority === 'urgent'
                            ? 'bg-red-500'
                            : priority === 'high'
                            ? 'bg-orange-500'
                            : priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-600">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}