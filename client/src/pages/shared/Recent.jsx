import React from 'react';

const Recent = () => {
  const recentActivities = [
    { id: 1, type: 'project', title: 'Project A Updated', time: '2 hours ago' },
    { id: 2, type: 'chat', title: 'New message from Team Alpha', time: '3 hours ago' },
    { id: 3, type: 'meet', title: 'Meeting scheduled: Sprint Planning', time: '5 hours ago' },
    { id: 4, type: 'task', title: 'Task completed: Database Setup', time: 'Yesterday' }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {recentActivities.map(activity => (
          <div key={activity.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-blue-600 text-lg">
                  {activity.type === 'project' && '📊'}
                  {activity.type === 'chat' && '💬'}
                  {activity.type === 'meet' && '📅'}
                  {activity.type === 'task' && '✓'}
                </span>
                <div>
                  <h3 className="font-medium text-gray-900">{activity.title}</h3>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recent;