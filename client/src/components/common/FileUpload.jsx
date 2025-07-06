import React, { useState, useCallback } from 'react';
import { FiUpload, FiX, FiFile, FiCheck, FiAlertCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';

const FileUpload = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif',
  multiple = false,
  maxSizeMB = 10,
  label = 'Upload Files',
  description = 'Drag & drop files here or click to browse',
  disabled = false,
  className = '',
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    // Check file type
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a document, image, or PDF.');
      return false;
    }

    // Check file size (in bytes)
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }

    return true;
  };

  const handleFileChange = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    
    const files = e.target.files || (e.dataTransfer ? e.dataTransfer.files : []);
    
    if (!files || files.length === 0) {
      setError('No files selected');
      return;
    }

    if (!multiple && files.length > 1) {
      setError('Multiple files not allowed');
      return;
    }

    const validFiles = Array.from(files).filter(validateFile);
    
    if (validFiles.length === 0) {
      if (!error) setError('No valid files selected');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress (in a real app, this would be an actual upload)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setIsUploading(false);
            
            // Set preview for single image uploads
            if (validFiles.length === 1 && validFiles[0].type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result);
              reader.readAsDataURL(validFiles[0]);
            }
            
            // Call the onFileSelect callback with the valid files
            onFileSelect(multiple ? validFiles : validFiles[0]);
            
            // Reset progress after a short delay
            setTimeout(() => setUploadProgress(0), 1000);
          }
          return newProgress;
        });
      }, 100);
      
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Error processing files. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [multiple, onFileSelect, maxSizeMB]);

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'file-text';
    if (type.includes('word')) return 'file-text';
    if (type.includes('excel') || type.includes('sheet')) return 'file-text';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'file-text';
    return 'file';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError('');
    setUploadProgress(0);
    // Reset the file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
    
    // Notify parent that file was removed
    onFileSelect(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          relative overflow-hidden
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => {
          handleDrag(e);
          handleFileChange(e);
          setDragActive(false);
        }}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : preview ? (
          <div className="relative group">
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-48 mx-auto rounded-md shadow-sm"
              />
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                aria-label="Remove file"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">Click to change file</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-500">
              <FiUpload className="w-6 h-6" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {label}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {`Supports: PDF, DOC, XLS, PPT, JPG, PNG, GIF (Max ${maxSizeMB}MB)`}
            </p>
          </div>
        )}
        
        {/* Progress bar for upload */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <FiAlertCircle className="flex-shrink-0 mr-1.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {!multiple && preview && (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <FiCheck className="flex-shrink-0 mr-1.5 h-4 w-4" />
          <span>File selected</span>
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxSizeMB: PropTypes.number,
  label: PropTypes.string,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default FileUpload;
