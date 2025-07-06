import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { FiPaperclip, FiPlus, FiUpload, FiLayout, FiList } from 'react-icons/fi';
import { getProjectById, createTask, getTasks, updateTask, deleteTask, getEmployees, uploadAttachmentToProject } from '../../services/api';
import AttachmentManager from '../../components/project/AttachmentManager';

const tabs = [
  { name: 'Board', path: 'board', icon: <FiLayout className="mr-2" /> },
  { name: 'Backlog', path: 'backlog', icon: <FiList className="mr-2" /> },
  { name: 'Attachments', path: 'attachments', icon: <FiPaperclip className="mr-2" /> },
];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  // For task creation modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [priority, setPriority] = useState('Low');
  const [statusColumn, setStatusColumn] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);

  // Fetch project data and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectData = await getProjectById(id);
        setProject(projectData);
        
        const tasksData = await getTasks(id);
        setTasks(tasksData);
        
        const employeesData = await getEmployees();
        setEmployees(employeesData.employees || []);
        
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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    await uploadAttachmentToProject(id, file);
    setFile(null);
    setUploading(false);
    fetchProject();
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

  // Get the current tab from the URL
  const currentTab = location.pathname.split('/').pop() || 'board';

  // Render the appropriate content based on the current tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'board':
        return <div>Board View</div>;
      case 'backlog':
        return <div>Backlog View</div>;
      case 'attachments':
        return (
          <div className="mt-6">
            <AttachmentManager 
              projectId={id}
              canUpload={user?.role === 'admin'}
              canDelete={user?.role === 'admin'}
            />
          </div>
        );
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
        <p className="text-gray-600 mt-2">{project.description}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <Link
              key={tab.name}
              to={tab.path}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname.endsWith(tab.path)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <Outlet context={{ project, tasks, employees }} />
      </div>

      {/* Modals and other UI elements */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            {/* Task form goes here */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {}}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;