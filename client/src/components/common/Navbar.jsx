import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUserName(user?.name || 'User');
  }, []);

  return (
    <nav className="fixed top-0 left-60 w-[calc(100%-240px)] bg-white z-50 border-b border-gray-200">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/src/assets/proflow-logo.png" alt="ProFlow" className="h-8 w-auto" />
          <span className="ml-2 text-xl font-semibold text-blue-600">ProFlow</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Good day, {userName}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold hover:bg-blue-700 transition-colors"
          >
            {userName.substring(0, 2).toUpperCase()}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Profile
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  // Toggle theme logic here
                }}
              >
                Theme
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  localStorage.removeItem('user');
                  window.location.href = '/signin';
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;