import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPersonalTask, getPersonalTasks, updatePersonalTask, deletePersonalTask } from '../services/api';

const Todo = () => {
  const navigate = useNavigate();
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState('Low');
  const [status, setStatus] = useState('Todo');
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchPersonalTasks();
  }, []);

  const fetchPersonalTasks = async () => {
    try {
      const data = await getPersonalTasks();
      setPersonalTasks(data);
    } catch (err) {
      console.error("Failed to fetch personal tasks:", err);
      setError(err.message || 'An error occurred while fetching personal tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const newTask = { title: taskTitle, description: taskDescription, priority, status };
      const createdTask = await createPersonalTask(newTask);
      setPersonalTasks([...personalTasks, createdTask]);
      alert('Personal task added successfully!');
      resetModal();
    } catch (err) {
      console.error('Failed to add personal task:', err);
      alert(`Failed to add personal task: ${err.message || 'An error occurred.'}`);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setShowTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const updatedTaskData = { title: taskTitle, description: taskDescription, priority, status };
      const response = await updatePersonalTask(editingTask._id, updatedTaskData);
      setPersonalTasks(personalTasks.map(task => task._id === editingTask._id ? response : task));
      alert('Personal task updated successfully!');
      resetModal();
    } catch (err) {
      console.error('Failed to update personal task:', err);
      alert(`Failed to update personal task: ${err.message || 'An error occurred.'}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this personal task?')) {
      try {
        await deletePersonalTask(taskId);
        setPersonalTasks(personalTasks.filter(task => task._id !== taskId));
        alert('Personal task deleted successfully!');
      } catch (err) {
        console.error('Failed to delete personal task:', err);
        alert(`Failed to delete personal task: ${err.message || 'An error occurred.'}`);
      }
    }
  };

  const resetModal = () => {
    setShowTaskModal(false);
    setTaskTitle('');
    setTaskDescription('');
    setPriority('Low');
    setStatus('Todo');
    setEditingTask(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading personal tasks...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">My Personal Tasks</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300"
        >
          Back to Dashboard
        </button>
      </nav>

      {/* Tasks Content */}
      <div className="flex-grow p-8">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Tasks</h3>
          
          <button 
            onClick={() => { setShowTaskModal(true); setEditingTask(null); }}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg mb-4"
          >
            + Add New Personal Task
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalTasks.length === 0 ? (
              <p className="text-gray-600">No personal tasks found. Add one to get started!</p>
            ) : (
              personalTasks.map(task => (
                <div key={task._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-800">{task.title}</h4>
                  {task.description && <p className="text-sm text-gray-600 mb-1">{task.description}</p>}
                  <p className="text-sm text-gray-600">Priority: {task.priority}</p>
                  <p className="text-sm text-gray-600">Status: {task.status}</p>
                  <div className="flex justify-end text-sm mt-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-blue-500 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-blue-700 mb-6">{editingTask ? 'Edit Personal Task' : 'Add New Personal Task'}</h3>
            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="space-y-4">
              <div>
                <label htmlFor="taskTitle" className="block text-gray-700 text-sm font-semibold mb-2">Task Title</label>
                <input
                  type="text"
                  id="taskTitle"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-gray-700 text-sm font-semibold mb-2">Description</label>
                <textarea
                  id="taskDescription"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description (optional)"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows="3"
                ></textarea>
              </div>
              <div>
                <label htmlFor="priority" className="block text-gray-700 text-sm font-semibold mb-2">Priority</label>
                <select
                  id="priority"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-gray-700 text-sm font-semibold mb-2">Status</label>
                <select
                  id="status"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option>Todo</option>
                  <option>In Progress</option>
                  <option>Done</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todo; 