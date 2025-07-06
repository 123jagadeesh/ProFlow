import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './common/Navbar';
import Sidebar from './common/Sidebar';

const EmployeeDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-60 pt-16 w-[calc(100vw-240px)] h-[calc(100vh-64px)] bg-gray-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeDashboard;