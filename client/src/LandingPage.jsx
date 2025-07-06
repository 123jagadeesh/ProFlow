import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import proflowLogo from './assets/proflow-logo.png';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="relative bg-white rounded-xl shadow-2xl p-0 md:p-4 w-full max-w-md max-h-[95vh] overflow-y-auto animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 bg-blue-100 hover:bg-blue-200 text-blue-600 text-xl font-bold rounded-full w-9 h-9 flex items-center justify-center focus:outline-none shadow-sm transition-colors"
        aria-label="Close"
      >
        &times;
      </button>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const LandingPage = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      const dashboardPath = user.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLoginSuccess = (response) => {
    // The response contains both token and user data
    const { user: userData } = response;
    setShowSignIn(false);
    
    // Use a small timeout to ensure state updates are processed
    setTimeout(() => {
      const dashboardPath = userData?.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
      navigate(dashboardPath, { replace: true });
    }, 100);
  };

  const handleSignUpSuccess = (userData) => {
    setShowSignUp(false);
    const dashboardPath = userData?.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
    navigate(dashboardPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fb]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fb]">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-4 bg-white/90 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src={proflowLogo} alt="ProFlow Logo" className="h-10 w-10" />
          <span className="text-2xl font-extrabold text-blue-600 tracking-tight">ProFlow</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSignIn(true)} 
            className="text-blue-700 font-semibold hover:underline"
          >
            Sign In
          </button>
          <button 
            onClick={() => setShowSignUp(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow transition-all duration-300"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between w-full py-16 px-4 md:px-16 bg-[#f6f8fb]">
        {/* Left: Headline and CTA */}
        <div className="flex-1 flex flex-col items-start justify-center md:pr-12 max-w-2xl w-full mx-auto md:mx-0">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight drop-shadow-sm">ProFlow: Your Modern Workspace</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-xl">
            The all-in-one platform for project management, real-time team collaboration, meetings & 1:1 chat, and creating your own virtual office.
          </p>
          <div className="flex gap-4 mb-4">
            <button onClick={() => setShowSignUp(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
              Get Started
            </button>
            <button onClick={() => setShowSignIn(true)} className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
              Sign In
            </button>
          </div>
        </div>
        {/* Right: Illustration */}
        <div className="flex-1 flex items-center justify-center mb-10 md:mb-0 w-full">
          {/* Placeholder SVG illustration */}
          <svg width="320" height="220" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="60" width="260" height="120" rx="20" fill="#e0e7ef" />
            <rect x="60" y="90" width="80" height="20" rx="6" fill="#a5b4fc" />
            <rect x="60" y="120" width="140" height="16" rx="5" fill="#c7d2fe" />
            <rect x="60" y="145" width="100" height="12" rx="4" fill="#dbeafe" />
            <circle cx="220" cy="110" r="24" fill="#818cf8" />
            <rect x="200" y="140" width="60" height="18" rx="6" fill="#fbbf24" />
            <ellipse cx="160" cy="200" rx="120" ry="12" fill="#e0e7ef" />
            <rect x="120" y="40" width="80" height="12" rx="6" fill="#818cf8" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 md:px-16 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {/* Project Management */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 w-full">
            <span className="text-blue-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            </span>
            <h3 className="text-lg font-bold text-blue-700 mb-2">Project Management</h3>
            <p className="text-gray-600">Organize tasks, set deadlines, track progress, and manage your team with powerful, intuitive tools.</p>
          </div>
          {/* Real-time Collaboration */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 w-full">
            <span className="text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V6a4 4 0 00-8 0v4m8 0a4 4 0 01-8 0" /></svg>
            </span>
            <h3 className="text-lg font-bold text-indigo-700 mb-2">Real-time Collaboration</h3>
            <p className="text-gray-600">Chat, share files, and collaborate instantly with your team, wherever you are.</p>
          </div>
          {/* Meetings & 1:1 Chat */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 w-full">
            <span className="text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </span>
            <h3 className="text-lg font-bold text-green-700 mb-2">Meetings & 1:1 Chat</h3>
            <p className="text-gray-600">Host video meetings, schedule calls, and chat 1:1—just like Zoom, but built into your workspace.</p>
          </div>
          {/* Virtual Office */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 w-full">
            <span className="text-purple-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" /></svg>
            </span>
            <h3 className="text-lg font-bold text-purple-700 mb-2">Virtual Office</h3>
            <p className="text-gray-600">Create a virtual workspace for your team—like GoBrunch—where you can meet, collaborate, and work together in real time.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-white/80 text-center text-gray-500 text-sm shadow-inner">
        &copy; {new Date().getFullYear()} ProFlow. All rights reserved.
      </footer>

      {/* Auth Modals */}
      {showSignIn && (
        <Modal onClose={() => setShowSignIn(false)}>
          <SignIn 
            onSuccess={handleLoginSuccess}
            onForgotPassword={() => {
              setShowSignIn(false);
              setShowForgot(true);
            }}
          />
        </Modal>
      )}

      {showSignUp && (
        <Modal onClose={() => setShowSignUp(false)}>
          <SignUp 
            onSuccess={handleSignUpSuccess}
            onSignInClick={() => {
              setShowSignUp(false);
              setShowSignIn(true);
            }}
          />
        </Modal>
      )}

      {showForgot && (
        <Modal onClose={() => setShowForgot(false)}>
          <ForgotPassword 
            onSuccess={() => {
              setShowForgot(false);
              setShowSignIn(true);
            }}
            onSignInClick={() => {
              setShowForgot(false);
              setShowSignIn(true);
            }}
          />
        </Modal>
      )}

      {showReset && (
        <Modal onClose={() => setShowReset(false)}>
          <ResetPassword 
            onSuccess={() => {
              setShowReset(false);
              setShowSignIn(true);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default LandingPage;