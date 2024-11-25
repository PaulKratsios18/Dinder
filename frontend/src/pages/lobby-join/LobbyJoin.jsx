import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './LobbyJoin.css';

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
    // Connect to WebSocket
    const socket = io('http://localhost:5000');
    setSocket(socket);

    // Join session room with the correct userId from navigation state
    socket.emit('joinSession', { 
      roomCode, 
      userName,
      userId: location.state?.userId,  // Use the userId passed from PreferencesJoin
      isHost: false 
    });

    // Listen for participants updates
    socket.on('participantsUpdate', (updatedParticipants) => {
      console.log('Received participants update:', updatedParticipants);
      const filteredParticipants = updatedParticipants.filter(p => p.name !== 'Host');
      const prevCount = participants.length;
      const newCount = updatedParticipants.length;
      
      // Show notification when someone joins
      if (newCount > prevCount) {
        const newParticipant = updatedParticipants[updatedParticipants.length - 1];
        setNotification(`${newParticipant.name} joined the session`);
      }
      // Show notification when someone leaves
      else if (newCount < prevCount) {
        setNotification('A participant left the session');
      }
      
      setParticipants(updatedParticipants);
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    });

    // Listen for navigation event
    socket.on('navigateToRestaurants', ({ sessionId }) => {
        navigate(`/sessions/${sessionId}/restaurants`);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leaveSession', { roomCode });
      socket.close();
    };
  }, [roomCode, userName, location.state?.userId, navigate]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1500);
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

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