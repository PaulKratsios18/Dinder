import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './LobbyJoin.css';

// Render the lobby join page
function LobbyJoin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const roomCode = location.state?.roomCode;
  const userName = location.state?.userName;
  const [socket, setSocket] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    console.log('Join component mounting with:', { roomCode, userName });
    
    // Connect to WebSocket
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    setSocket(socket);

    // Join session room with the correct userId from navigation state
    const joinData = { 
      roomCode, 
      userName,
      userId: location.state?.userId,
      isHost: false 
    };
    console.log('Emitting join session with:', joinData);
    socket.emit('joinSession', joinData);

    socket.on('participantsUpdate', (updatedParticipants) => {
      console.log('Join received raw participants:', updatedParticipants);
      const filteredParticipants = updatedParticipants.filter(p => p.name);
      console.log('Join filtered participants:', filteredParticipants);
      setParticipants(filteredParticipants);
    });

    // Listen for navigation event
    socket.on('navigateToRestaurants', ({ sessionId }) => {
        console.log('Received navigate event, going to restaurants page');
        navigate(`/sessions/${sessionId}/restaurants`);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leaveSession', { roomCode });
      socket.close();
    };
  }, [roomCode, userName, location.state?.userId, navigate]);

  // Copy invite link to clipboard
  const copyInviteLink = () => {
    const link = `${window.location.origin}/preferences-join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1500);
  };

  // Copy group code to clipboard
  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Render the lobby join page
  return (
    <section className="lobby-section">
      {/* <div className="join-instructions">
        <h1>Tell your friends to go to <span className="highlight">dindersdd.cs.rpi.edu/join</span></h1>
      </div> */}

      <div className="lobby-content">
        <div className="left-panel">
          <h2>ROOM CODE</h2>
          <div className="room-code-display">
            {roomCode}
          </div>
          
          <button 
            className={`lobby-button ${copiedInvite ? 'copied' : ''}`}
            onClick={copyInviteLink}
          >
            <span className="icon">📋</span>
            <h2>{copiedInvite ? 'Copied!' : 'Copy invite link'}</h2>
          </button>
          <button 
            className={`lobby-button ${copiedCode ? 'copied' : ''}`}
            onClick={copyGroupCode}
          >
            <span className="icon">📋</span>
            <h2>{copiedCode ? 'Copied!' : 'Copy group code'}</h2>
          </button>
        </div>

        <div className="members-panel">
          <h4>Members: ({participants.length})</h4>
          <div className="participants-list">
            {participants && participants.length > 0 ? (
              participants.map((participant, index) => (
                <div key={index} className="participant-item">
                  {participant.name} {participant.isHost ? '(Host)' : ''}
                </div>
              ))
            ) : (
              <div className="participant-item">Waiting for participants...</div>
            )}
          </div>
        </div>
      </div>

      <div className="waiting-message">
        Waiting for host to start the session
      </div>

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </section>
  );
}

export default LobbyJoin;