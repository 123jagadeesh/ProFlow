import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../services/api';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    customer: '',
    initialStatuses: 'Todo, In Progress, Done'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const statusesArray = formData.initialStatuses.split(',').map(s => s.trim()).filter(s => s !== '');
    if (statusesArray.length === 0) {
      setError('Please define at least one task status.');
      return;
    }

    if (!formData.projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);

    try {
      await createProject(formData.projectName, formData.customer, statusesArray);
      setSuccess(`Project '${formData.projectName}' created successfully!`);
      setTimeout(() => {
        navigate('/projects', { 
          state: { 
            message: `Project '${formData.projectName}' created successfully!`,
            type: 'success'
          } 
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to create project:', error);
      setError(error.message || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Project</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectName">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customer">
              Customer
            </label>
            <input
              type="text"
              id="customer"
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="initialStatuses">
              Task Statuses <span className="text-red-500">*</span>
              <span className="block text-xs text-gray-500 font-normal mt-1">
                Comma-separated list (e.g., Todo, In Progress, Done)
              </span>
            </label>
            <textarea
              id="initialStatuses"
              name="initialStatuses"
              value={formData.initialStatuses}
              onChange={handleChange}
              className="w-full h-32 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Todo, In Progress, Done"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;