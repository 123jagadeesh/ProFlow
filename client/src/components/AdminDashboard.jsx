import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dashboardItems = [
    { name: 'Discuss', icon: '💬', path: '#' },
    { name: 'To-do', icon: '✅', path: '/todo' },
    { name: 'Project', icon: '📊', path: '/projects' },
    { name: 'Apps', icon: '��', path: '#' },
    { name: 'Settings', icon: '⚙️', path: '#' },
    { name: 'Add Employees', icon: '➕', path: '/add-employee' },
  ];

  const handleLogout = () => {
    logout(); // Call the logout function from api.js
    navigate('/signin'); // Redirect to sign-in page
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">ProFlow Admin</h1>
        <div>
          {/* Placeholder for user profile/notifications */}
          <span className="text-gray-600 mr-4">Welcome, Admin!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {dashboardItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 