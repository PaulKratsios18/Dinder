import React, { useState, useEffect } from 'react';
import './LobbyHost.css';
import { useNavigate, useLocation } from 'react-router-dom';

function LobbyHost() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || '');
  const [participants, setParticipants] = useState([]);
  const [hostName] = useState('');
  const [hostId] = useState(() => `host_${Math.random().toString(36).substr(2, 9)}`);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Group code copied to clipboard!');
  };

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
      
      const newCode = generateRoomCode();
      setRoomCode(newCode);

      fetch('http://localhost:5000/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: newCode,
          hostName: hostName,
          host_id: hostId
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Session created:', data);
        if (data.session?.participants) {
          setParticipants(data.session.participants);
        }
      })
      .catch(error => console.error('Error creating session:', error));
    }
  }, [roomCode, hostName, hostId]);

  const handleSelectPreferences = () => {
    navigate('/preferences-host', { 
      state: { roomCode, hostId }
    });
  };

  return (
    <section className="lobby-section">
      <div className="join-instructions">
        <h1>Tell your friends to go to <span className="highlight">dindersdd.cs.rpi.edu/join</span></h1>
      </div>

      <div className="lobby-content">
        <div className="left-panel">
          <h2>ROOM CODE</h2>
          <div className="room-code-display">
            {roomCode}
          </div>
          <button onClick={copyInviteLink} className="lobby-button">
            <span className="icon">📋</span>
            <h2>Invite link</h2>
          </button>
          <button onClick={copyGroupCode} className="lobby-button">
            <span className="icon">📋</span>
            <h2>Copy group code</h2>
          </button>
        </div>

        <div className="members-panel">
          <h4>Members:</h4>
          <div className="participants-list">
            {participants.map((participant, index) => (
              <div key={index} className="participant-item">
                {participant.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-buttons">
        <button className="preferences-button" onClick={handleSelectPreferences}>
          Select Preferences
        </button>
        <button className="start-button">
          Start Session
        </button>
      </div>
    </section>
  );
}

export default LobbyHost;