import React from 'react';
import './groupLobbyHost.css';

function GroupLobbyHost() {
  return (
    <section className="lobby-section">
      <div className="join-instructions">
        <h1>Tell your friends to go to <span className="highlight">dindersdd.cs.rpi.edu/join</span> on their phone, tablet, or computer to join.</h1>
      </div>

      <div className="lobby-content">
        <div className="left-panel">
          <h2>ROOM CODE</h2>
          <input
            className="room-code-input"
            type="text"
            placeholder="Enter 4 digit code, e.g. ABCD"
          />
          
          <button className="lobby-button">
            <span className="icon">📋</span>
            <h2>Invite link</h2>
          </button>
          <button className="lobby-button">
            <span className="icon">📋</span>
            <h2>Copy group code</h2>
          </button>
        </div>

        <div className="members-panel">
          <h4>Members:</h4>
          
        </div>
      </div>

      <div className="bottom-buttons">
        <button className="preferences-button">Select Preferences</button>
        <button className="start-button">Start Session</button>
      </div>
    </section>
  );
}

export default GroupLobbyHost;