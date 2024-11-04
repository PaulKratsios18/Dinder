import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LobbyJoin.css';

function LobbyJoin() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const location = useLocation();
  const roomCode = location.state?.roomCode;

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
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

      <div className="bottom-buttons" style={{ textAlign: 'right' }}>
        <h1>Waiting for host to start the session...</h1>
      </div>
    </section>
  );
}

export default LobbyJoin; 