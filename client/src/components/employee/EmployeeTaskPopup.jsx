import React, { useState, useEffect } from 'react';
import { X, Paperclip, MessageSquare, Check, X as XIcon } from 'lucide-react';
import { 
  updateTaskStatus, 
  addCommentToTask, 
  uploadAttachmentToTask, 
  downloadAttachment 
} from '../../services/api';

const EmployeeTaskPopup = ({ task, onClose, onUpdate }) => {
  const [comment, setComment] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localTask, setLocalTask] = useState(task);

  // Update local task when prop changes
  useEffect(() => {
    console.log('Task data updated:', task);
    if (task?.comments) {
      console.log('Comments data:', task.comments);
      task.comments.forEach((comment, i) => {
        console.log(`Comment ${i}:`, comment);
        // Log all properties of the comment object
        console.log('Comment properties:', Object.keys(comment));
        // Log the comment text from all possible fields
        console.log('Comment text from possible fields:', {
          message: comment.message,  // This is the correct field name from the backend
          text: comment.text,
          content: comment.content,
          comment: comment.comment,
          _doc: comment._doc,
          $__: comment.$__,
          isNew: comment.isNew,
          $locals: comment.$locals,
          $op: comment.$op
        });
      });
    }
    setLocalTask(task);
  }, [task]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError('');
      
      // Send the comment with the correct field name that matches the backend
      const commentData = { message: comment };
      console.log('Sending comment data:', commentData);
      
      const updatedTask = await addCommentToTask(localTask._id, commentData);
      
      // Log the response for debugging
      console.log('Updated task after adding comment:', updatedTask);
      
      // Update local state
      setLocalTask(updatedTask);
      setComment('');
      setSuccess('Comment added successfully');
      
      // Notify parent component
      if (onUpdate) onUpdate(updatedTask);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding comment:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setError('');
    
    try {
      // Upload the file
      const updatedTask = await uploadAttachmentToTask(localTask._id, file);
      
      // Update local state
      setLocalTask(updatedTask);
      setFile(null);
      setSuccess('File uploaded successfully');
      
      // Notify parent component
      if (onUpdate) onUpdate(updatedTask);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      // Clear file input
      if (e.target && e.target.form) {
        e.target.form.reset();
      }
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      await downloadAttachment(localTask._id, attachmentId, filename);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      // Update task status
      const updatedTask = await updateTaskStatus(localTask._id, newStatus, `Status changed to ${newStatus}`);
      
      // Update local state
      setLocalTask(updatedTask);
      setSuccess('Status updated successfully');
      
      // Notify parent component
      if (onUpdate) onUpdate(updatedTask);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!localTask) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{localTask.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Task Details */}
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-gray-900">
              {localTask.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-gray-900 capitalize">{localTask.status || 'Not started'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <p className="mt-1 text-gray-900 capitalize">{localTask.priority || 'Medium'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <p className="mt-1 text-gray-900">{formatDate(localTask.dueDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-gray-900">{formatDate(localTask.createdAt)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('comments')}
                className={`${activeTab === 'comments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comments
                  {localTask.comments?.length > 0 && activeTab !== 'comments' && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {localTask.comments.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`${activeTab === 'attachments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <div className="flex items-center">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attachments
                  {localTask.attachments?.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {localTask.attachments.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'comments' ? (
              <div>
                {/* Comments List */}
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {localTask.comments?.length > 0 ? (
                    localTask.comments.map((comment, index) => {
                      // Log the comment data for debugging
                      console.log('Raw comment data:', comment);
                      
                      // Try to get the comment text from the message field (matches backend model)
                      const commentText = comment.message || comment.text || comment.content || 
                        (comment.comment && (comment.comment.message || comment.comment.text || comment.comment.content)) ||
                        'No comment text found';
                      
                      // Get the user name from various possible locations
                      const userName = comment.user?.name || 
                        (comment.userId && comment.userId.name) || 
                        'Unknown User';
                      
                      // Get the timestamp from various possible fields
                      const timestamp = comment.createdAt || comment.date || new Date();
                      
                      // Log the extracted values for debugging
                      console.log('Extracted values:', { commentText, userName, timestamp });
                      
                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {userName}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {new Date(timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-1">
                            {commentText ? (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {commentText}
                              </p>
                            ) : (
                              <p className="text-sm text-red-500">
                                No comment text found. Available fields: {Object.keys(comment).join(', ')}
                                {comment.comment ? `, Nested comment fields: ${Object.keys(comment.comment).join(', ')}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mt-4">
                  <div className="mt-1">
                    <textarea
                      rows={3}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!comment.trim() || isSubmitting}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${!comment.trim() || isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                {/* Attachments List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {localTask.attachments?.length > 0 ? (
                    localTask.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 truncate max-w-xs">
                            {attachment.filename}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(attachment._id, attachment.filename)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Download
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No attachments yet</p>
                  )}
                </div>

                {/* Upload Attachment Form */}
                <form onSubmit={handleFileUpload} className="mt-4">
                  <div className="flex items-center">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      disabled={isUploading}
                    />
                    <button
                      type="submit"
                      disabled={!file || isUploading}
                      className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${!file || isUploading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          {error && (
            <div className="text-sm text-red-600 flex items-center">
              <XIcon className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              {success}
            </div>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTaskPopup;
