import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { useTeamStore } from '../store/teamStore';
import { Activity, Clock, Target, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { tasks } = useTaskStore();
  const { teams } = useTeamStore();

  const averageCompletionTime = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((acc, task) => {
      const created = new Date(task.created_at);
      const updated = new Date(task.updated_at);
      return acc + (updated.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // in days
  };

  const productivityTrend = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    const completedTasks = tasks.filter(t => 
      t.status === 'completed' && 
      new Date(t.updated_at) >= thirtyDaysAgo
    );

    const tasksByDay = completedTasks.reduce((acc, task) => {
      const date = new Date(task.updated_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tasksByDay).sort((a, b) => 
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Task Completion Rate
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {tasks.length > 0
                      ? `${Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%`
                      : '0%'}
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
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Completion Time
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {averageCompletionTime()} days
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
                <Target className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue Tasks
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {tasks.filter(t => 
                      t.status !== 'completed' && 
                      t.due_date && 
                      new Date(t.due_date) < new Date()
                    ).length}
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
                    Team Efficiency
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {teams.length > 0
                      ? `${Math.round(tasks.filter(t => t.status === 'completed').length / teams.length)}`
                      : '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Trend (Last 30 Days)</h3>
            <div className="h-64">
              <div className="h-full flex items-end">
                {productivityTrend().map(([date, count], index) => (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center"
                  >
                    <div
                      className="w-full bg-indigo-500 rounded-t"
                      style={{
                        height: `${(count / Math.max(...productivityTrend().map(([_, c]) => c))) * 100}%`,
                      }}
                    />
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}