import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signIn } from '../../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignIn = ({ onSuccess, onForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    
    // Basic validation
    if (!email || !password) {
      const validationError = 'Please enter both email and password';
      setError(validationError);
      toast.warn(validationError);
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const emailError = 'Please enter a valid email address';
      setError(emailError);
      toast.warn(emailError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Call the signIn API
      const response = await signIn(email, password);
      console.log('Sign-in response:', response);
      
      // 2. Call login from AuthContext to handle the response
      const loginResult = await login(response);
      console.log('Login result:', loginResult);
      
      if (loginResult.success) {
        // 3. Show success message
        setIsSuccess(true);
        toast.success('🎉 Sign in successful! Redirecting...', { autoClose: 2000 });
        
        // 4. Call the onSuccess callback with the user data
        if (onSuccess) {
          onSuccess(loginResult);
        }
      } else {
        throw new Error(loginResult.error || 'Login failed');
      }
      
    } catch (error) {
      console.error('Sign-in failed:', error);
      // Handle different error formats
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        if (error.response.status === 400) {
          errorMessage = ' Invalid email or password. Please try again.';
        } else if (error.response.status === 401) {
          errorMessage = ' Unauthorized. Please check your credentials.';
        } else if (error.response.status === 403) {
          errorMessage = ' Access denied. Your account may be deactivated.';
        } else if (error.response.status === 500) {
          errorMessage = ' Server error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = `${error.response.data.message}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = ' Connection error. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
        errorMessage = `${error.message || 'An unexpected error occurred during sign in.'}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Sign In</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
          <input
            type="password"
            id="password"
            className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:underline"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </>
  );
};

export default SignIn;