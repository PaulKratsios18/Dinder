// src/starting_menu_components/startMenu.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SessionSelection.css';

const Starter = () => {
  const navigate = useNavigate();

  const handleJoinSessionClick = () => {
    navigate('/preferences-join');
  };

  const handleGroupLobbyHostClick = () => {
    navigate('/lobby-host');
  };

  return (
    <div className="get-started-container">
      <h1 className="greeting">Hi there!</h1>
      <h2 className="intro-text">
        Say goodbye to indecision, find the perfect spot in seconds.
        Start your own session or join an existing group below:
      </h2>
      
      <div className="session-buttons">
        <button className="start-session-btn" onClick={handleGroupLobbyHostClick}>
          Start a group session <span className="arrow">→</span>
        </button>
        
        <div className="divider">
            <h3>or</h3>
        </div>
        
        <button className="join-session-btn" onClick={handleJoinSessionClick}>
          Join a group session <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default Starter;