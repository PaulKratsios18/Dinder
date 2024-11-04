import React, { useState, useEffect } from 'react';
import './LobbyHost.css';
import { useNavigate, useLocation } from 'react-router-dom';

function GroupLobbyHost() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || '');

  // Only generate room code if one doesn't exist
  useEffect(() => {
    if (!roomCode) {
      const generateRoomCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
          code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
      };
      
      setRoomCode(generateRoomCode());
    }
  }, [roomCode]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const handleSelectPreferences = () => {
    console.log('Navigating to host preferences...');
    navigate('/preferences-host', { 
      state: { 
        roomCode 
      }
    });
  };

  return (
    <section className="lobby-section">
      <div className="join-instructions">
        <h1>Tell your friends to go to <span className="highlight">dindersdd.cs.rpi.edu/join</span> on their phone, tablet, or computer to join.</h1>
      </div>

      <div className="lobby-content">
        <div className="left-panel">
          <h2>ROOM CODE</h2>
          <div className="room-code-display">
            {roomCode}
          </div>
          
          <button className="lobby-button" onClick={copyInviteLink}>
            <span className="icon">📋</span>
            <h2>Invite link</h2>
          </button>
          <button className="lobby-button" onClick={copyGroupCode}>
            <span className="icon">📋</span>
            <h2>Copy group code</h2>
          </button>
        </div>

        <div className="members-panel">
          <h4>Members:</h4>
        </div>
      </div>

      <div className="bottom-buttons">
        <button 
          className="preferences-button" 
          onClick={handleSelectPreferences}
          type="button"
        >
          Select Preferences
        </button>
        <button className="start-button">Start Session</button>
      </div>
    </section>
  );
}

export default GroupLobbyHost;