import React from 'react';
import PropTypes from 'prop-types';
import { FiDownload, FiTrash2, FiFile, FiImage, FiFileText } from 'react-icons/fi';
import { format } from 'date-fns';

const AttachmentList = ({
  attachments = [],
  onDownload,
  onDelete,
  canDelete = false,
  className = '',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center p-3 border rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-md"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="mt-1 h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className={`text-center py-6 text-gray-500 ${className}`}>
        <FiFileText className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading a new file.
        </p>
      </div>
    );
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <FiImage className="w-5 h-5 text-blue-500" />;
    if (mimeType === 'application/pdf') return <FiFileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word')) return <FiFileText className="w-5 h-5 text-blue-600" />;
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FiFileText className="w-5 h-5 text-green-600" />;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return <FiFileText className="w-5 h-5 text-orange-500" />;
    return <FiFile className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return '';
    }
  };

  return (
    <ul className={`divide-y divide-gray-200 ${className}`}>
      {attachments.map((attachment) => (
        <li key={attachment._id || attachment.storedFilename} className="py-3">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-50">
                {getFileIcon(attachment.mimeType || '')}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.filename}
              </p>
              <div className="flex items-center text-xs text-gray-500 space-x-2">
                <span>{formatFileSize(attachment.size)}</span>
                <span>•</span>
                <span>{formatDate(attachment.uploadedAt)}</span>
                {attachment.uploadedBy?.name && (
                  <>
                    <span>•</span>
                    <span>Uploaded by {attachment.uploadedBy.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onDownload && onDownload(attachment)}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                title="Download"
              >
                <FiDownload className="w-5 h-5" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(attachment)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      filename: PropTypes.string.isRequired,
      storedFilename: PropTypes.string,
      url: PropTypes.string,
      mimeType: PropTypes.string,
      size: PropTypes.number,
      uploadedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      uploadedBy: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
      }),
    })
  ),
  onDownload: PropTypes.func,
  onDelete: PropTypes.func,
  canDelete: PropTypes.bool,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default AttachmentList;
