import React, { useState } from 'react';
import { forgotPassword } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await forgotPassword(email);
      console.log('Forgot password request successful:', response);
      alert('If your email is registered, a password reset link has been sent to your email address.');
      setEmail(''); // Clear the email input
    } catch (error) {
      console.error('Forgot password request failed:', error);
      alert(`Forgot password failed: ${error.message || 'An error occurred. Please try again later.'}`);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300"
        >
          Reset Password
        </button>
      </form>
    </>
  );
};

export default ForgotPassword; 