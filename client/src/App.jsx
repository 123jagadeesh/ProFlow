import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SignUp from './components/SignUp'
import SignIn from './components/SignIn'
import AdminDashboard from './components/AdminDashboard'
import EmployeeDashboard from './components/EmployeeDashboard'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import AddEmployee from './components/AddEmployee'
import CreateProject from './components/CreateProject'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import Todo from './components/Todo'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
            <header className="text-center mb-12">
              <h1 className="text-6xl font-extrabold text-blue-800 mb-4 tracking-tight">
                ProFlow
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your ultimate project management tool for seamless team collaboration and streamlined workflows.
              </p>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto px-4">
              <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Efficient Project Management</h3>
                <p className="text-gray-700">Organize tasks, set deadlines, and track progress with intuitive tools designed for success.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Real-time Collaboration</h3>
                <p className="text-gray-700">Communicate, share files, and collaborate seamlessly with your team in real-time.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl font-bold text-blue-700 mb-2">Visualize & Track Progress</h3>
                <p className="text-gray-700">Gain insights with powerful visualization tools and monitor project progress at a glance.</p>
              </div>
            </section>

            <div className="flex space-x-6">
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                Sign Up
              </Link>
              <Link to="/signin" className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                Sign In
              </Link>
            </div>
          </div>
        } />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/todo" element={<Todo />} />
      </Routes>
    </Router>
  )
}

export default App
