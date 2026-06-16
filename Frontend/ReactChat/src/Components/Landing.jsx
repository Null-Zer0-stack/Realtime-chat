import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-wrapper">
      <div className="landing-content">
        <h1 className="landing-title">React Chat</h1>
        <p className="landing-subtitle">
          A simple real-time chat powered by React and .Net Core.
        </p>
        <div className="landing-buttons">

          <Link to="/login" className="btn btn-primary">Log In</Link>

          <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
          
        </div>
      </div>
    </div>
  );
};

export default Landing;