import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getTasks, updateTask } from '../services/api';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [errorTasks, setErrorTasks] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const currentUserId = user._id;
        setUserId(currentUserId);
        console.log('User object from localStorage (setting userId and attempting to fetch tasks):', currentUserId);

        const fetchAssignedTasks = async (idToFetch) => {
          setLoadingTasks(true);
          console.log('Making API call to fetch assigned tasks for ID:', idToFetch);
          try {
            const tasksData = await getTasks(null, idToFetch);
            setAssignedTasks(tasksData);
          } catch (err) {
            console.error("Failed to fetch assigned tasks:", err);
            setErrorTasks(err.message || 'An error occurred while fetching assigned tasks.');
          } finally {
            setLoadingTasks(false);
          }
        };

        if (currentUserId) {
          fetchAssignedTasks(currentUserId);
        } else {
          setLoadingTasks(false);
          setErrorTasks('User ID not found. Please log in again.');
        }

      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        setUserId(null); 
        setLoadingTasks(false);
        setErrorTasks('Error loading user data. Please log in again.');
      }
    } else {
      setLoadingTasks(false);
    }
  }, []);

  const dashboardItems = [
    { name: 'Discuss', icon: '💬', path: '#' }, // Placeholder icons
    { name: 'To-do', icon: '✅', path: '/todo' },
    // { name: 'Project', icon: '📊' }, // Project is excluded for employees
    { name: 'Apps', icon: '📱', path: '#' },
    { name: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = () => {
    logout(); // Call the logout function from api.js
    navigate('/signin'); // Redirect to sign-in page
  };

  const handleUpdateAssignedTask = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...taskToUpdate, status: newStatus };
      await updateTask(taskToUpdate._id, updatedData);
      // Update the task in the local state
      setAssignedTasks(assignedTasks.map(task => 
        task._id === taskToUpdate._id ? { ...task, status: newStatus } : task
      ));
      alert('Task status updated successfully!');
      resetUpdateModal();
    } catch (err) {
      console.error('Failed to update assigned task:', err);
      alert(`Failed to update task: ${err.message || 'An error occurred.'}`);
    }
  };

  const resetUpdateModal = () => {
    setShowUpdateModal(false);
    setTaskToUpdate(null);
    setNewStatus('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">ProFlow Employee</h1>
        <div>
          {/* Placeholder for user profile/notifications */}
          <span className="text-gray-600 mr-4">Welcome, Employee!</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
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

        {/* Assigned Tasks Section */}
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-xl mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Tasks Assigned To You</h3>
          {loadingTasks ? (
            <p>Loading assigned tasks...</p>
          ) : errorTasks ? (
            <p className="text-red-600">Error: {errorTasks}</p>
          ) : assignedTasks.length === 0 ? (
            <p className="text-gray-600">No tasks assigned to you.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedTasks.map(task => (
                <div key={task._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-800">{task.title}</h4>
                  {task.description && <p className="text-sm text-gray-600 mb-1">{task.description}</p>}
                  <p className="text-sm text-gray-600">Project: {task.project ? task.project.name : 'N/A'}</p>
                  <p className="text-sm text-gray-600">Priority: {task.priority}</p>
                  <p className="text-sm text-gray-600">Status: {task.status}</p>
                  {task.plannedDateStart && <p className="text-sm text-gray-600">Start: {new Date(task.plannedDateStart).toLocaleDateString()}</p>}
                  {task.plannedDateEnd && <p className="text-sm text-gray-600">End: {new Date(task.plannedDateEnd).toLocaleDateString()}</p>}
                  <div className="flex justify-end text-sm mt-2">
                    <button
                      onClick={() => { setTaskToUpdate(task); setNewStatus(task.status); setShowUpdateModal(true); }}
                      className="text-green-600 hover:underline mr-2"
                    >
                      Update Status
                    </button>
                    <Link to={`/project/${task.project._id}`} className="text-blue-500 hover:underline text-sm">View Project</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Update Task Status Modal */}
      {showUpdateModal && taskToUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-blue-700 mb-6">Update Status for '{taskToUpdate.title}'</h3>
            <form onSubmit={handleUpdateAssignedTask} className="space-y-4">
              <div>
                <label htmlFor="newStatus" className="block text-gray-700 text-sm font-semibold mb-2">New Status</label>
                <select
                  id="newStatus"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  {/* Assuming standard statuses for now, ideally fetch from project */}
                  <option>Todo</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetUpdateModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard; 