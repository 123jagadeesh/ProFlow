import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, getTasks } from '../../services/api';

const EmployeeProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTasks, setUserTasks] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user ID from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user._id) {
          throw new Error('User not authenticated');
        }

        // Fetch all projects
        const projectsData = await getProjects();
        
        // Fetch all tasks and filter for the current user's tasks
        const allTasks = [];
        for (const project of projectsData) {
          try {
            const tasks = await getTasks(project._id);
            const userProjectTasks = tasks.filter(task => 
              task.assignee && 
              (task.assignee._id === user._id || 
               (Array.isArray(task.assignee) && task.assignee.some(a => a._id === user._id)))
            );
            
            if (userProjectTasks.length > 0) {
              allTasks.push({
                projectId: project._id,
                tasks: userProjectTasks
              });
            }
          } catch (err) {
            console.error(`Error fetching tasks for project ${project._id}:`, err);
          }
        }

        // Create a map of projectId to user's tasks
        const tasksMap = {};
        allTasks.forEach(item => {
          tasksMap[item.projectId] = item.tasks;
        });

        // Filter projects to only those where user has tasks
        const userProjects = projectsData.filter(project => tasksMap[project._id]);
        
        setProjects(userProjects);
        setUserTasks(tasksMap);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err.message || 'An error occurred while fetching your projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading your projects...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-blue-700 mb-6">Your Projects</h2>

        {projects.length === 0 ? (
          <p className="text-gray-600">You don't have any assigned projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const projectTasks = userTasks[project._id] || [];
              const todoCount = projectTasks.filter(t => t.status === 'Todo').length;
              const inProgressCount = projectTasks.filter(t => t.status === 'In Progress').length;
              const completedCount = projectTasks.filter(t => t.status === 'Done').length;
              
              return (
                <Link 
                  key={project._id}
                  to={`/employee-dashboard/projects/${project._id}`}
                  className="block bg-gray-50 p-5 rounded-lg shadow hover:shadow-md transition-shadow duration-200 
                  hover:border-l-4 hover:border-blue-500"
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.name}</h3>
                  <p className="text-gray-600 mb-3">{project.description?.substring(0, 100)}{project.description?.length > 100 ? '...' : ''}</p>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Your Tasks:</span>
                      <span className="font-medium">{projectTasks.length}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-600">To Do</span>
                        <span>{todoCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-yellow-600">In Progress</span>
                        <span>{inProgressCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Completed</span>
                        <span>{completedCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProjects;
