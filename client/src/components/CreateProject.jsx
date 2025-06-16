import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/api';

const CreateProject = () => {
  const [projectName, setProjectName] = useState('');
  const [customer, setCustomer] = useState('');
  const [initialStatuses, setInitialStatuses] = useState('Todo, In Progress, Done'); // Default statuses
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const statusesArray = initialStatuses.split(',').map(s => s.trim()).filter(s => s !== '');
      if (statusesArray.length === 0) {
        alert('Please define at least one task status.');
        return;
      }

      const response = await createProject(projectName, customer, statusesArray);
      console.log('Project created successfully:', response);
      alert(`Project '${projectName}' created successfully!`);
      setProjectName('');
      setCustomer('');
      setInitialStatuses('Todo, In Progress, Done');
      navigate('/projects'); // Redirect to project list after creation
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(`Failed to create project: ${error.message || 'An error occurred.'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="projectName" className="block text-gray-700 text-sm font-semibold mb-2">Project Name</label>
            <input
              type="text"
              id="projectName"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="customer" className="block text-gray-700 text-sm font-semibold mb-2">Customer</label>
            <input
              type="text"
              id="customer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="statuses" className="block text-gray-700 text-sm font-semibold mb-2">Initial Task Statuses (comma-separated)</label>
            <input
              type="text"
              id="statuses"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Todo, In Progress, Done"
              value={initialStatuses}
              onChange={(e) => setInitialStatuses(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject; 