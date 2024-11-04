import React, { useState, useEffect, useRef } from 'react';
import './LobbyHost.css';
import { useNavigate, useLocation } from 'react-router-dom';

function GroupLobbyHost() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode, setRoomCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:5000');

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      // Create a new session when component mounts
      wsRef.current.send(JSON.stringify({
        type: 'createSession',
        hostName: 'Host' // You might want to get this from a form or context
      }));
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'sessionCreated':
          setRoomCode(message.code);
          break;
        case 'participantJoined':
          setParticipants(message.participants);
          break;
        case 'error':
          console.error('WebSocket error:', message.message);
          // Handle error (maybe show a toast notification)
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
      // Implement reconnection logic if needed
    };

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
          <ul>
            {participants.map((participant, index) => (
              <li key={index}>
                {participant.name} {participant.isHost ? '(Host)' : ''}
              </li>
            ))}
          </ul>
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