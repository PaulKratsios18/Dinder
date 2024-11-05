import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LobbyJoin.css';

function LobbyJoin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [userName] = useState('');
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:5000');

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      
      // Join the session once connection is established
      if (roomCode && userName) {
        wsRef.current.send(JSON.stringify({
          type: 'joinSession',
          code: roomCode,
          name: userName
        }));
      }
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'participantJoined':
          setParticipants(message.participants);
          break;
        case 'sessionStarted':
          // Navigate to preferences page when host starts the session
          navigate('/preferences-join', { 
            state: { 
              roomCode,
              userName 
            }
          });
          break;
        case 'error':
          setError(message.message);
          // You might want to show this error in the UI
          break;
        default:
          console.log('Unhandled message type:', message.type);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Implement reconnection logic
      setTimeout(() => {
        if (wsRef.current.readyState === WebSocket.CLOSED) {
          console.log('Attempting to reconnect...');
          // You might want to show a reconnecting message in the UI
        }
      }, 5000);
    };

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomCode, userName, navigate]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  // Handle connection status display
  const connectionStatus = isConnected ? (
    <div className="connection-status connected">Connected to session</div>
  ) : (
    <div className="connection-status disconnected">
      Connecting to session...
    </div>
  );

  return (
    <section className="lobby-section">
      <div className="join-instructions">
        <h1>Tell your friends to go to <span className="highlight">dindersdd.cs.rpi.edu/join</span> on their phone, tablet, or computer to join.</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {connectionStatus}

      <div className="lobby-content">
        <div className="left-panel">
          <h2>ROOM CODE</h2>
          <div className="room-code-display">
            {roomCode}
          </div>
          
          <button 
            className="lobby-button" 
            onClick={copyInviteLink}
            disabled={!isConnected}
          >
            <span className="icon">📋</span>
            <h2>Invite link</h2>
          </button>
          <button 
            className="lobby-button" 
            onClick={copyGroupCode}
            disabled={!isConnected}
          >
            <span className="icon">📋</span>
            <h2>Copy group code</h2>
          </button>
        </div>

        <div className="members-panel">
          <h4>Members:</h4>
          <ul className="participants-list">
            {participants.map((participant, index) => (
              <li key={index} className={participant.isHost ? 'host' : ''}>
                {participant.name} {participant.isHost && '(Host)'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bottom-buttons" style={{ textAlign: 'right' }}>
        <h1>Waiting for host to start the session...</h1>
      </div>
    </section>
  );
}

export default LobbyJoin;