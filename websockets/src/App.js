import React, { useState, useEffect } from 'react';

const cuisineOptions = [
  "American", "Chinese", "French", "Indian", "Italian", 
  "Japanese", "Korean", "Mexican", "Thai", "Vietnamese"
];

const PreferenceForm = ({ onSubmit, initialMode }) => {
  const [preferences, setPreferences] = useState({
    Name: '',
    Price: [1, 5],
    Distance: 5000,
    Cuisine: 'American',
    Rating: 4
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  return (
    <div className="form-container">
      <h2>{initialMode ? 'Create Session' : 'Join Session'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={preferences.Name}
            onChange={(e) => setPreferences({...preferences, Name: e.target.value})}
            required
          />
        </div>

        <div>
          <label>Price Range:</label>
          <div>
            <select 
              value={preferences.Price[0]}
              onChange={(e) => setPreferences({...preferences, Price: [parseInt(e.target.value), preferences.Price[1]]})}
            >
              {[1,2,3,4,5].map(num => (
                <option key={num} value={num}>{"$".repeat(num)}</option>
              ))}
            </select>
            <span>to</span>
            <select 
              value={preferences.Price[1]}
              onChange={(e) => setPreferences({...preferences, Price: [preferences.Price[0], parseInt(e.target.value)]})}
            >
              {[1,2,3,4,5].map(num => (
                <option key={num} value={num}>{"$".repeat(num)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label>Maximum Distance (meters):</label>
          <input
            type="number"
            value={preferences.Distance}
            onChange={(e) => setPreferences({...preferences, Distance: parseInt(e.target.value)})}
            min="1000"
            max="50000"
            step="500"
          />
        </div>

        <div>
          <label>Preferred Cuisine:</label>
          <select
            value={preferences.Cuisine}
            onChange={(e) => setPreferences({...preferences, Cuisine: e.target.value})}
          >
            {cuisineOptions.map(cuisine => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Minimum Rating:</label>
          <input
            type="range"
            value={preferences.Rating}
            onChange={(e) => setPreferences({...preferences, Rating: parseInt(e.target.value)})}
            min="1"
            max="5"
            step="0.5"
          />
          <div>{preferences.Rating} Stars</div>
        </div>

        <button type="submit">
          {initialMode ? 'Create Session' : 'Join Session'}
        </button>
      </form>
    </div>
  );
};

const SessionLobby = ({ sessionCode, participants = [] }) => {
  return (
    <div className="lobby-container">
      <h2>Session Lobby</h2>
      <div>
        <strong>Session Code:</strong> {sessionCode}
      </div>
      <div>
        <strong>Participants:</strong>
        <ul>
          {Array.isArray(participants) && participants.map((participant, index) => (
            <li key={index}>{participant?.Name || 'Anonymous'}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const App = () => {
  const [ws, setWs] = useState(null);
  const [currentView, setCurrentView] = useState('initial');
  const [sessionCode, setSessionCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    let reconnectTimeout;
    
    const connectWebSocket = () => {
      const websocket = new WebSocket('ws://localhost:8080');
      
      websocket.onopen = () => {
        console.log('Connected to WebSocket server');
      };

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket connection closed. Attempting to reconnect...');
        // Attempt to reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      setWs(websocket);
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const handleServerMessage = (message) => {
    switch (message.type) {
      case 'sessionCreated':
        setSessionCode(message.code);
        setCurrentView('lobby');
        break;
      case 'sessionFound':
        setCurrentView('joinForm');
        break;
      case 'sessionNotFound':
        alert('Session not found');
        break;
      case 'participantListUpdate':
        if (Array.isArray(message.participants)) {
          setParticipants(message.participants);
        }
        break;
      case 'activeSessionsUpdate':
        // Handle active sessions update if needed
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  const handleCreateSubmit = (preferences) => {
    ws.send(JSON.stringify({
      type: 'createSession',
      preferences
    }));
  };

  const handleJoinSubmit = (preferences) => {
    ws.send(JSON.stringify({
      type: 'addParticipant',
      code: sessionCode,
      preferences
    }));
    setCurrentView('lobby');
  };

  const initiateJoinSession = (code) => {
    setSessionCode(code);
    ws.send(JSON.stringify({
      type: 'joinSession',
      code
    }));
  };

  return (
    <div className="container">
      <h1>Dinder</h1>

      {currentView === 'initial' && (
        <div className="button-container">
          <button onClick={() => setCurrentView('createForm')}>
            Create Session
          </button>
          <div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter session code"
            />
            <button onClick={() => initiateJoinSession(joinCode)}>
              Join Session
            </button>
          </div>
        </div>
      )}

      {currentView === 'createForm' && (
        <PreferenceForm onSubmit={handleCreateSubmit} initialMode={true} />
      )}

      {currentView === 'joinForm' && (
        <PreferenceForm onSubmit={handleJoinSubmit} initialMode={false} />
      )}

      {currentView === 'lobby' && (
        <SessionLobby sessionCode={sessionCode} participants={participants} />
      )}
    </div>
  );
};

export default App;