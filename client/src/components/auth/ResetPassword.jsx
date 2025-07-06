import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/api';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      alert('No reset token found in the URL. Please use the link from your email.');
      navigate('/forgot-password'); // Redirect back to forgot password if no token
    }
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }

    if (!token) {
      alert("Reset token is missing. Please ensure you are using the link from your email.");
      return;
    }

    try {
      const response = await resetPassword(token, newPassword);
      console.log('Password reset successful:', response);
      alert('Password has been reset successfully!');
      navigate('/signin'); // Redirect to sign-in page after successful reset
    } catch (error) {
      console.error('Password reset failed:', error);
      alert(`Password reset failed: ${error.message || 'An error occurred.'}`);
    }

    setNewPassword('');
    setConfirmNewPassword('');
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="newPassword" className="block text-gray-700 text-sm font-semibold mb-2">New Password</label>
          <input
            type="password"
            id="newPassword"
            className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmNewPassword" className="block text-gray-700 text-sm font-semibold mb-2">Confirm New Password</label>
          <input
            type="password"
            id="confirmNewPassword"
            className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm your new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300"
        >
          Set New Password
        </button>
      </form>
    </>
  );
};

export default ResetPassword; 