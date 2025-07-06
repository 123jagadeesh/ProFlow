import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import FileUpload from '../common/FileUpload';
import AttachmentList from './AttachmentList';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const AttachmentManager = ({
  projectId,
  canUpload = true,
  canDelete = false,
  className = '',
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch attachments for the project
  const fetchAttachments = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/attachments`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAttachments(response.data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      toast.error('Failed to load attachments');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user.token]);

  // Load attachments on component mount and when projectId changes
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!projectId) return;
    
    const formData = new FormData();
    formData.append('attachment', file);
    
    setIsUploading(true);
    try {
      await axios.post(
        `/api/projects/${projectId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      
      toast.success('File uploaded successfully');
      fetchAttachments(); // Refresh the attachments list
      setShowUpload(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload file';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file download
  const handleDownload = async (attachment) => {
    try {
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = `/api/projects/${projectId}/attachments/${attachment.storedFilename}`;
      link.setAttribute('download', attachment.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Optional: Track the download in your analytics
      await axios.get(
        `/api/projects/${projectId}/attachments/${attachment.storedFilename}/track-download`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  // Handle file deletion
  const handleDelete = async (attachment) => {
    if (!window.confirm(`Are you sure you want to delete ${attachment.filename}?`)) {
      return;
    }
    
    try {
      await axios.delete(
        `/api/projects/${projectId}/attachments/${attachment.storedFilename}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      toast.success('File deleted successfully');
      fetchAttachments(); // Refresh the attachments list
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
        {canUpload && !showUpload && (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            <FiPlus className="mr-1.5 h-4 w-4" />
            Add File
          </button>
        )}
      </div>
      
      {showUpload && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <FileUpload
            onFileSelect={handleFileUpload}
            multiple={false}
            label="Upload a file"
            description="Drag & drop a file here or click to browse"
            disabled={isUploading}
            className="mb-2"
          />
          <div className="flex justify-end space-x-3 mt-2">
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-4">
        <AttachmentList
          attachments={attachments}
          onDownload={handleDownload}
          onDelete={canDelete ? handleDelete : null}
          canDelete={canDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

AttachmentManager.propTypes = {
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  canUpload: PropTypes.bool,
  canDelete: PropTypes.bool,
  className: PropTypes.string,
};

export default AttachmentManager;
