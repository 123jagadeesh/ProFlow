import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, createTask, getTasks, updateTask, deleteTask, getEmployees } from '../services/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For task creation modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [priority, setPriority] = useState('Low');
  const [statusColumn, setStatusColumn] = useState(''); // Changed to empty string to be dynamic
  const [editingTask, setEditingTask] = useState(null); // State to hold task being edited
  const [parentTaskId, setParentTaskId] = useState(null); // New state for parent task ID

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectData = await getProjectById(id);
        setProject(projectData);

        const tasksData = await getTasks(id);
        setTasks(tasksData);

        const employeesData = await getEmployees();
        setEmployees(employeesData.employees); // Assuming employees are returned in an object with a 'employees' key

      } catch (err) {
        console.error("Failed to fetch project details or tasks/employees:", err);
        setError(err.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const newTaskData = {
        title: taskTitle,
        description: taskDescription,
        projectId: id,
        parentTaskId: parentTaskId,
        assigneeIds: selectedAssigneeIds,
        priority,
        status: statusColumn,
      };
      const createdTask = await createTask(newTaskData);
      console.log('Task created successfully:', createdTask);
      setTasks([...tasks, createdTask]); // Add the new task to the local state
      alert(`${editingTask ? 'Task' : 'Subtask'} '${taskTitle}' added successfully!`);
      resetTaskModal();
    } catch (err) {
      console.error('Failed to add task:', err);
      alert(`Failed to add task: ${err.message || 'An error occurred.'}`);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setSelectedAssigneeIds(task.assignee ? task.assignee.map(a => a._id) : []);
    setPriority(task.priority);
    setStatusColumn(task.status);
    setParentTaskId(task.parentTask ? task.parentTask._id : null); // Set parent task ID if it's a subtask
    setShowAddTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const updatedTaskData = {
        title: taskTitle,
        description: taskDescription,
        assigneeIds: selectedAssigneeIds,
        priority,
        status: statusColumn,
      };
      const response = await updateTask(editingTask._id, updatedTaskData);
      console.log('Task updated successfully:', response);
      setTasks(tasks.map(task => task._id === editingTask._id ? response : task));
      alert(`Task '${taskTitle}' updated successfully!`);
      resetTaskModal();
    } catch (err) {
      console.error('Failed to update task:', err);
      alert(`Failed to update task: ${err.message || 'An error occurred.'}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task (and its subtasks)?')) {
      try {
        await deleteTask(taskId);
        // Filter out the deleted task and any of its subtasks
        setTasks(tasks.filter(task => task._id !== taskId && task.parentTask !== taskId));
        alert('Task deleted successfully!');
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert(`Failed to delete task: ${err.message || 'An error occurred.'}`);
      }
    }
  };

  const resetTaskModal = () => {
    setShowAddTaskModal(false);
    setTaskTitle('');
    setTaskDescription('');
    setSelectedAssigneeIds([]);
    setPriority('Low');
    setStatusColumn('');
    setEditingTask(null);
    setParentTaskId(null); // Reset parent task ID
  };

  const tasksByStatus = tasks.reduce((acc, task) => {
    // Only include top-level tasks here, subtasks will be rendered nested
    if (!task.parentTask) {
      acc[task.status] = acc[task.status] || [];
      acc[task.status].push(task);
    }
    return acc;
  }, {}); // Initial empty object, statuses will be keys

  const getSubtasks = (parentId) => {
    return tasks.filter(task => task.parentTask && task.parentTask._id === parentId);
  };

  const renderTaskCard = (task) => {
    const subtasks = getSubtasks(task._id);

    return (
      <div key={task._id} className="bg-white p-3 rounded-lg shadow-sm mb-2 border border-gray-200">
        <h5 className="font-semibold text-gray-800">{task.title}</h5>
        {task.description && <p className="text-sm text-gray-600 mb-1">{task.description}</p>}
        <p className="text-sm text-gray-600">Assignee: {task.assignee && task.assignee.length > 0 ? task.assignee.map(a => a.name).join(', ') : 'Unassigned'}</p>
        <p className="text-sm text-gray-600">Priority: {task.priority}</p>
        <div className="flex justify-end text-sm mt-2">
          <button
            onClick={() => handleAddSubtask(task._id, task.status)}
            className="text-green-600 hover:underline mr-2"
          >
            Add Subtask
          </button>
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

        {subtasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h6 className="text-md font-semibold text-gray-700 mb-2">Subtasks:</h6>
            {subtasks.map(renderTaskCard)} {/* Recursively render subtasks */}
          </div>
        )}
      </div>
    );
  };

  const handleAddSubtask = (parentId, status) => {
    setParentTaskId(parentId);
    setStatusColumn(status); // Pre-fill status based on parent task's column
    setTaskTitle('');
    setTaskDescription('');
    setSelectedAssigneeIds([]);
    setPriority('Low');
    setEditingTask(null);
    setShowAddTaskModal(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading project details...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found.</div>;
  }

  const projectStatuses = project.statuses || ['Todo', 'In Progress', 'Done']; // Fallback to default if not defined

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">ProFlow Project: {project.name}</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300"
        >
          Back to Projects
        </button>
      </nav>

      {/* Project Details and Tasks */}
      <div className="flex-grow p-8">
        <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Project Details</h3>
          <p className="text-gray-700"><strong>Customer:</strong> {project.customer}</p>
          <p className="text-gray-700"><strong>Created At:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
          {/* Add more project specific details here */}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Tasks</h3>
          
          {/* Task Columns / Kanban Board */}
          <div className="flex space-x-4 overflow-x-auto">
            {projectStatuses.map((status) => (
              <div key={status} className="flex-shrink-0 w-80 bg-gray-50 p-4 rounded-lg shadow-inner">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{status}</h4>
                <button 
                  onClick={() => { setStatusColumn(status); setShowAddTaskModal(true); setEditingTask(null); setParentTaskId(null); }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg mb-4"
                >
                  + Add Task
                </button>
                {(tasksByStatus[status] || []).map(renderTaskCard)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-blue-700 mb-6">{editingTask ? 'Edit Task' : parentTaskId ? `Add Subtask to ${tasks.find(t => t._id === parentTaskId)?.title}` : `Add New Task for ${statusColumn}`}</h3>
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
              {!parentTaskId && ( // Hide parent task selection if creating a subtask
                <div>
                  <label htmlFor="assignee" className="block text-gray-700 text-sm font-semibold mb-2">Assignee</label>
                  <select
                    id="assignee"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    multiple
                    size="5" // Show at least 5 options at once
                    value={selectedAssigneeIds}
                    onChange={(e) => {
                      const options = Array.from(e.target.options);
                      const values = options.filter(option => option.selected).map(option => option.value);
                      setSelectedAssigneeIds(values);
                    }}
                  >
                    <option value="">Select Assignee(s)</option>
                    {(parentTaskId ? tasks.find(t => t._id === parentTaskId)?.assignee || [] : employees).map(employee => (
                      <option key={employee._id} value={employee._id}>{employee.name} ({employee.email})</option>
                    ))}
                  </select>
                </div>
              )}
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
                  value={statusColumn}
                  onChange={(e) => setStatusColumn(e.target.value)}
                  required
                >
                  {projectStatuses.map(statusOption => (
                    <option key={statusOption} value={statusOption}>{statusOption}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetTaskModal}
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

export default ProjectDetail; 