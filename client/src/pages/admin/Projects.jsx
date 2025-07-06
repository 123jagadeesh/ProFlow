import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../../services/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getProjects();
        setProjects(response);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError(err.message || 'An error occurred while fetching projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading projects...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">Your Projects</h2>
        <Link 
          to="/admin-dashboard/projects/create"
          className="mb-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300"
        >
          Create New Project
        </Link>

        {projects.length === 0 ? (
          <p className="text-gray-600">No projects found. Start by creating a new one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project._id}
                to={`/admin-dashboard/projects/${project._id}`} // Link to individual project detail page
                className="block bg-gray-50 p-5 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
                <p className="text-gray-600">Customer: {project.customer}</p>
                <p className="text-gray-600">Tasks: {project.tasks || 0}</p>
                {/* Add more project details as needed */}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects; 