import React from 'react';
import './MainSection.css';

function GroupLobbyHost() {
  return (
    <section className="lobby-section">
      <div className="join-instructions">
        <p>Tell your friends to go to <span className="highlight">dindersdd.cs.rpi.edu/join</span> on their phone, tablet, or computer to join.</p>
      </div>

      <div className="lobby-content">
        <div className="left-panel">
          <h2>ROOM CODE</h2>
          <div className="room-code">GPMI</div>
          
          <button className="lobby-button">
            <span className="icon">📋</span> Invite link
          </button>
          <button className="lobby-button">
            <span className="icon">📋</span> Copy Group Code
          </button>
        </div>

        <div className="members-panel">
          <h2>Members (5):</h2>
          <ol>
            <li>Host</li>
          </ol>
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