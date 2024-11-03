// src/pages/GetStarted.jsx

import React from 'react';
import './startMenu.css';

const Starter = () => {
  return (
    <div className="get-started-container">
      <h1 className="greeting">Hi there!</h1>
      <span>{<br/>}{<br/>}{<br/>}</span>
      <h2 className="intro-text">
        Say goodbye to indecision, find the perfect spot in seconds.
        Start your own session or join an existing group below:
      </h2>
      
      <div className="session-buttons">
        <button className="start-session-btn">
          Start a group session <span className="arrow">→</span>
        </button>
        
        <div className="divider">
            <h3>or</h3>
        </div>
        
        <button className="join-session-btn">
          Join a group session <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default Starter;