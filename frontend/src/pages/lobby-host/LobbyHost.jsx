import React, { useState, useEffect } from 'react';
import './LobbyHost.css';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

function LobbyHost() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || '');
  const [participants, setParticipants] = useState([]);
  const [hostName] = useState('');
  const [hostId] = useState(() => {
    return localStorage.getItem('userId') || (() => {
      const id = `host_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', id);
      return id;
    })();
  });
  const [socket, setSocket] = useState(null);
  const [preferencesSet, setPreferencesSet] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isStartLoading, setIsStartLoading] = useState(false);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/preferences-join?code=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1500); // Reset after 1.5 seconds
  };

  const copyGroupCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500); // Reset after 1.5 seconds
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

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join session room
    newSocket.emit('joinSession', { 
      roomCode, 
      userName: 'Host',
      userId: hostId,
      isHost: true 
    });

    // Listen for participants updates
    newSocket.on('participantsUpdate', (updatedParticipants) => {
      console.log('Received participants update:', updatedParticipants);
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
      
      // Update participants list
      const filteredParticipants = updatedParticipants.filter(p => p.name !== 'Host');
      setParticipants(filteredParticipants);
    });

    // Cleanup on unmount
    return () => {
        newSocket.emit('leaveSession', { roomCode });
        newSocket.close();
    };
  }, [roomCode, hostId]);

  // Add a separate useEffect to handle notification timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    console.log('Current hostId:', hostId);
    console.log('Current participants:', participants);
    participants.forEach(p => console.log('Full participant object:', JSON.stringify(p, null, 2)));
  }, [participants, hostId]);

  const handleSelectPreferences = () => {
    setPreferencesSet(true);
    navigate('/preferences-host', { 
      state: { roomCode, hostId }
    });
  };

  const handleStartSession = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/sessions/${roomCode}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            // Emit session started event to all users
            socket.emit('sessionStarted', { sessionId: roomCode });
            // Navigate host to restaurant page
            navigate(`/sessions/${roomCode}/restaurants`);
        } else {
            throw new Error(data.message || 'Failed to start session');
        }
    } catch (error) {
        console.error('Error starting session:', error);
    }
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
            onClick={copyInviteLink} 
            className={`lobby-button ${copiedInvite ? 'copied' : ''}`}
          >
            <span className="icon">📋</span>
            <h2>{copiedInvite ? 'Copied!' : 'Copy invite link'}</h2>
          </button>
          <button 
            onClick={copyGroupCode} 
            className={`lobby-button ${copiedCode ? 'copied' : ''}`}
          >
            <span className="icon">📋</span>
            <h2>{copiedCode ? 'Copied!' : 'Copy group code'}</h2>
          </button>
        </div>

        {notification && (
          <div className="notification">
            {notification}
          </div>
        )}

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

      <div className="bottom-buttons">
        <button 
          className="preferences-button" 
          onClick={handleSelectPreferences}
          disabled={participants.some(participant => participant.user_id === hostId) || isPreferencesLoading}
        >
          <div className="button-content">
            {isPreferencesLoading && <div className="loading-spinner" />}
            Select Preferences
          </div>
        </button>
        <button 
          className="start-button" 
          onClick={handleStartSession}
          disabled={participants.length === 0 || isStartLoading}
        >
          <div className="button-content">
            {isStartLoading && <div className="loading-spinner" />}
            Start Session
          </div>
        </button>
      </div>
    </section>
  );
}

export default LobbyHost;