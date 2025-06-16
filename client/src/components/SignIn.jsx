import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../services/api';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await signIn(email, password);
      console.log('Sign-in successful:', response);
      alert('Sign-in successful!');

      // Assuming your backend sends back a user object with a 'role'
      if (response.user && response.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (response.user && response.user.role === 'employee') {
        navigate('/employee-dashboard');
      } else {
        // Default redirect if role is not specified or recognized
        navigate('/employee-dashboard');
      }
    } catch (error) {
      console.error('Sign-in failed:', error);
      alert(`Sign-in failed: ${error.message || 'Invalid credentials.'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300"
          >
            Sign In
          </button>
          <p className="text-center text-sm mt-4">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">Forgot Password?</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn; 