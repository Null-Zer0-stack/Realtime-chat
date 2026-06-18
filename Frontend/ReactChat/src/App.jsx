import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './Components/Landing';
import Login from './Components/Login';
import Signup from './Components/SignUp';
import Chat from './Components/Chat'; 

function App() {
  // Check if token exists in localStorage on initial load
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Protect the Chat route
  const ProtectedRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn} />} />
        
        {/* Protected Chat Route */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
             <Chat setIsLoggedIn={setIsLoggedIn} /> 
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;