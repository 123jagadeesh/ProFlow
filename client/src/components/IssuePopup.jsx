import React, { useState, useEffect } from 'react';
import { 
  updateTask, 
  addCommentToTask, 
  uploadAttachmentToTask, 
  getTasks, 
  getEmployees, 
  getSprints,
  createTask 
} from '../services/api';
import { FiX, FiPaperclip, FiSend, FiPlus, FiDownload, FiClock, FiUser, FiTag, FiFlag, FiMessageSquare } from 'react-icons/fi';

const statusColors = {
  'Todo': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'In Review': 'bg-purple-100 text-purple-800',
  'Done': 'bg-green-100 text-green-800'
};

const priorityColors = {
  'Low': 'bg-gray-100 text-gray-800',
  'Medium': 'bg-blue-100 text-blue-800',
  'High': 'bg-yellow-100 text-yellow-800',
  'Critical': 'bg-red-100 text-red-800'
};

const IssuePopup = ({ issue, onClose, onUpdate, user }) => {
  const [editTitle, setEditTitle] = useState(issue.title || '');
  const [editDescription, setEditDescription] = useState(issue.description || '');
  const [editStatus, setEditStatus] = useState(issue.status || 'Todo');
  const [editPriority, setEditPriority] = useState(issue.priority || 'Medium');
  const [editAssignee, setEditAssignee] = useState(issue.assignee?._id || '');
  const [editReporter, setEditReporter] = useState(
    issue.reporter?._id || 
    (issue.reporter && typeof issue.reporter === 'string' ? issue.reporter : user?._id || '')
  );
  const [editSprint, setEditSprint] = useState(
    issue.sprint?._id || 
    (issue.sprint && typeof issue.sprint === 'string' ? issue.sprint : '')
  );
  const [employees, setEmployees] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [childTitle, setChildTitle] = useState('');
  const [childIssues, setChildIssues] = useState([]);
  const [attachments, setAttachments] = useState(issue.attachments || []);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [comments, setComments] = useState(issue.comments || []);
  const [newComment, setNewComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Status and Priority options
  const statusOptions = ['Todo', 'In Progress', 'In Review', 'Done'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    // Fetch employees for assignee dropdown
    const fetchEmployees = async () => {
      try {
        const response = await getEmployees();
        // Check if the response has an 'employees' array or if the response itself is the array
        const employeesData = Array.isArray(response.employees) ? response.employees : 
                             Array.isArray(response) ? response : [];
        setEmployees(employeesData);
        
        // If we have an assignee but it's not set in the state yet, set it
        if (issue.assignee && !editAssignee) {
          if (Array.isArray(issue.assignee) && issue.assignee.length > 0) {
            setEditAssignee(issue.assignee[0]?._id || '');
          } else if (typeof issue.assignee === 'object' && issue.assignee !== null) {
            setEditAssignee(issue.assignee._id || '');
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    // Fetch sprints for the project
    const fetchSprints = async () => {
      try {
        const projectId = issue.project?._id || issue.project;
        if (!projectId) return;
        
        const sprintsData = await getSprints(projectId);
        setSprints(sprintsData || []);
        
        // If we have a sprint ID but no sprint object, try to find it in the fetched sprints
        if (issue.sprint && typeof issue.sprint === 'string' && sprintsData) {
          const foundSprint = sprintsData.find(s => s._id === issue.sprint);
          if (foundSprint) {
            // Update the issue's sprint reference to include the full sprint data
            issue.sprint = foundSprint;
          }
        }
      } catch (error) {
        console.error('Error fetching sprints:', error);
      }
    };

    // Fetch child issues (sub-tasks)
    const fetchChildIssues = async () => {
      try {
        const tasks = await getTasks(issue.project?._id || issue.project);
        setChildIssues(tasks.filter(t => t.parentTask === issue._id));
      } catch (err) {
        console.error('Error fetching child issues:', err);
      }
    };

    fetchEmployees();
    fetchSprints();
    fetchChildIssues();
    setAttachments(issue.attachments || []);
    setComments(issue.comments || []);
  }, [issue]);

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAttachmentFile(file);
    setError('');
    
    try {
      // Show uploading state
      const response = await uploadAttachmentToTask(issue._id, file);
      
      // Update the attachments list with the new attachment
      setAttachments(prev => [...(prev || []), response.attachment]);
      
      // Refresh the task to get the latest data
      const tasks = await getTasks(issue.project?._id || issue.project);
      const updatedTask = tasks.find(t => t._id === issue._id);
      
      if (updatedTask) {
        setAttachments(updatedTask.attachments || []);
        if (onUpdate) {
          onUpdate(updatedTask);
        }
      }
      
      // Reset file input
      e.target.value = null;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload attachment. Please try again.');
    } finally {
      setAttachmentFile(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const commentText = newComment.trim();
    if (!commentText) return;
    
    setNewComment('');
    setError('');
    
    // Create a temporary comment for optimistic UI update
    const tempComment = {
      _id: `temp-${Date.now()}`,
      message: commentText,
      user: user ? { _id: user._id, name: user.name } : { _id: 'unknown', name: 'You' },
      createdAt: new Date().toISOString()
    };
    
    // Optimistically update the UI
    setComments(prev => [...(prev || []), tempComment]);
    
    try {
      // Send the comment to the server with the correct format
      await addCommentToTask(issue._id, { message: commentText });
      
      // Refresh the task to get the latest data
      const tasks = await getTasks(issue.project?._id || issue.project);
      const updatedTask = tasks.find(t => t._id === issue._id);
      
      if (updatedTask) {
        setComments(updatedTask.comments || []);
        if (onUpdate) {
          onUpdate(updatedTask);
        }
      }
    } catch (err) {
      console.error('Add comment error:', err);
      setError(err.response?.data?.message || 'Failed to add comment. Please try again.');
      
      // Revert optimistic update on error
      setComments(prev => prev.filter(c => c._id !== tempComment._id));
      
      // Restore the comment text if there was an error
      setNewComment(commentText);
    }
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    if (!childTitle.trim()) return;
    try {
      await createTask({
        title: childTitle,
        project: issue.project,
        parentTask: issue._id,
        status: 'Todo',
        priority: 'Medium',
        reporter: issue.reporter?._id || issue.reporter,
      });
      setChildTitle('');
      // Refresh child issues
      const tasks = await getTasks(issue.project?._id || issue.project);
      setChildIssues(tasks.filter(t => t.parentTask === issue._id));
    } catch (err) {
      setError('Failed to create child issue');
      console.error('Create child error:', err);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const updateData = {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        assignee: editAssignee ? [editAssignee] : [],
        plannedDateStart: issue.plannedDateStart || new Date(),
        plannedDateEnd: issue.plannedDateEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      const updatedTask = await updateTask(issue._id, updateData);
      
      if (onUpdate) {
        onUpdate(updatedTask);
      }
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Failed to update issue');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {issue.key || 'ISSUE'}-{issue.number || '1'}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[editStatus] || 'bg-gray-100'}`}>
                {editStatus}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[editPriority] || 'bg-gray-100'}`}>
                {editPriority} Priority
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-2"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Title */}
            <div className="mb-6">
              <input
                type="text"
                className="w-full text-2xl font-semibold text-gray-900 border-0 focus:ring-2 focus:ring-blue-500 rounded-md p-2 -ml-2"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Issue title"
              />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'comments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Comments ({comments?.length || 0})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' ? (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description..."
                  />
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                    <label className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                      <FiPaperclip className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Add Attachment
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleAttachmentUpload}
                        disabled={!!attachmentFile}
                      />
                    </label>
                  </div>
                  
                  {attachments?.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={file._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded">
                              <FiPaperclip className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.originalName || file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={`${file.url || `${API_BASE_URL}${file.path}`}`}
                            download
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <FiDownload className="h-5 w-5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FiPaperclip className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by uploading a file.
                      </p>
                    </div>
                  )}
                </div>

                {/* Child Issues */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Sub-tasks</h4>
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiPlus className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Add Sub-task
                    </button>
                  </div>
                  <div className="space-y-2">
                    {childIssues.length > 0 ? (
                      childIssues.map((child) => (
                        <div key={child._id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={child.status === 'Done'}
                            onChange={() => {}}
                          />
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {child.title}
                          </span>
                          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {child.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No sub-tasks yet. Add one to break down this issue.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Comments Tab */
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {comments?.length > 0 ? (
                    comments.map((comment) => {
                      const isCurrentUser = (comment.user?._id || comment.user) === user?._id;
                      const commentDate = new Date(comment.createdAt || Date.now());
                      const formattedDate = commentDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={comment._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-3xl rounded-lg p-4 ${isCurrentUser ? 'bg-blue-50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                                  {comment.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="ml-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {isCurrentUser ? 'You' : comment.user?.name || 'User'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formattedDate}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-blue-600">
                                        {comment.createdAt ? '✓ Sent' : 'Sending...'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-800 text-sm whitespace-pre-wrap">
                              {comment.content || comment.message || comment.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No comments</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding a comment.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <form onSubmit={handleAddComment} className="flex items-start space-x-3">
                    <div className="flex-1">
                      <label htmlFor="comment" className="sr-only">
                        Add a comment
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMessageSquare className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="comment"
                          id="comment"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend className="-ml-1 mr-2 h-4 w-4" />
                      Comment
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  id="assignee"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reporter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reporter
                </label>
                <div className="mt-1 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-2">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm text-gray-900">
                    {user?.name || 'You'}
                  </span>
                </div>
              </div>

              {/* Sprint */}
              {sprints.length > 0 && (
                <div>
                  <label htmlFor="sprint" className="block text-sm font-medium text-gray-700 mb-1">
                    Sprint
                  </label>
                  <select
                    id="sprint"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={editSprint}
                    onChange={(e) => setEditSprint(e.target.value)}
                  >
                    <option value="">Backlog</option>
                    {sprints.map((sprint) => (
                      <option key={sprint._id} value={sprint._id}>
                        {sprint.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Created At */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500">
                  <FiClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>Created {new Date(issue.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Update Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    updating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {updating ? 'Updating...' : 'Update Issue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuePopup;
