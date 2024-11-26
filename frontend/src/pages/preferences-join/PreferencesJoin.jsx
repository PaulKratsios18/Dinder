import React, { useState, useEffect } from 'react';
import './PreferencesJoin.css';
import { useNavigate } from 'react-router-dom';
import fullStar from '../../assets/full-star.png';
import halfStar from '../../assets/half-star.png';

// Render preferences join page
function JoinPreferences() {
  // Initialize navigation
  const navigate = useNavigate();

  // Initialize state variables
  const [activeTab, setActiveTab] = useState('cuisine');
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');

  // Initialize tabs
  const tabs = [
    { name: 'Cuisine', emoji: '🍽️' },
    { name: 'Price', emoji: '💰' },
    { name: 'Rating', emoji: '⭐' },
    { name: 'Distance', emoji: '📍' }
  ];

  // Initialize no preference state variables
  const [cuisineNoPreference, setCuisineNoPreference] = useState(false);
  const [priceNoPreference, setPriceNoPreference] = useState(false);
  const [ratingNoPreference, setRatingNoPreference] = useState(false);
  const [distanceNoPreference, setDistanceNoPreference] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [locationPreference, setLocationPreference] = useState('');

  // Initialize preferences state variables
  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [pricePreferences, setPricePreferences] = useState([]);
  const [ratingPreferences, setRatingPreferences] = useState([]);
  const [distancePreferences, setDistancePreferences] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get room code from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, []);

  // Validate preferences
  const validatePreferences = () => {
    const errors = [];
    
    if (!roomCode.trim()) {
      errors.push('Room Code');
    }
    if (!name.trim()) {
      errors.push('Name');
    }
    if (!cuisineNoPreference && cuisinePreferences.length === 0) {
      errors.push('Cuisine preferences');
    }
    if (!priceNoPreference && pricePreferences.length === 0) {
      errors.push('Price preferences');
    }
    if (!ratingNoPreference && ratingPreferences.length === 0) {
      errors.push('Rating preferences');
    }
    if (!distanceNoPreference && distancePreferences === null) {
      errors.push('Distance preferences');
    }

    return errors;
  };

  // Handle save preferences
  const handleSavePreferences = async () => {
    const errors = validatePreferences();
    if (errors.length > 0) {
        setErrorMessage(`Please fill out the following: ${errors.join(', ')}`);
        return;
    }
    
    try {
      // First, check the session status and participant count
      const checkResponse = await fetch(`http://localhost:5000/api/sessions/${roomCode}/participants`);
      const sessionData = await checkResponse.json();

      // Check if response is ok
      if (!checkResponse.ok) {
        if (sessionData.error === 'Session not found') {
            setErrorMessage('Invalid room code. Please check and try again.');
            return;
          }
          throw new Error(sessionData.error || `HTTP error! status: ${checkResponse.status}`);
        }

        // Check session status
        if (sessionData.status === 'active') {
            setErrorMessage('Error: Session has already begun.');
            return;
        } else if (sessionData.status === 'completed') {
            setErrorMessage('Error: Session has ended.');
            return;
        }

        // Check if session is full (10 participants max)
        if (sessionData.participants.length >= 10) {
          setErrorMessage('This session is full (maximum 10 participants). Please join another session.');
          return;
        }

        // If not full, proceed with saving preferences
        const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', userId);

        // Save preferences
        const response = await fetch('http://localhost:5000/api/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                roomCode,
                name,
                userId,
                preferences: {
                    cuisine: cuisineNoPreference ? [] : cuisinePreferences,
                    cuisineNoPreference,
                    price: priceNoPreference ? [] : pricePreferences,
                    priceNoPreference,
                    rating: ratingNoPreference ? [] : ratingPreferences,
                    ratingNoPreference,
                    distance: distanceNoPreference ? null : distancePreferences,
                    distanceNoPreference,
                    location: locationPreference
                }
            })
        });

      // Get data
      const data = await response.json();

      // Check if response is ok
      if (!response.ok) {
        // Handle specific error cases
        if (data.error === 'Session not found') {
          setErrorMessage('Invalid room code. Please check and try again.');
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Log success
      console.log('Success:', data);
      
      // Navigate to lobby join
      navigate('/lobby-join', { 
        state: { 
          roomCode: roomCode,
          userName: name,
          userId: userId 
        } 
      });
      
    } catch (error) {
      console.error('Error details:', error);
      if (error.message === 'Session not found') {
        setErrorMessage('Invalid room code. Please check and try again.');
      } else {
        setErrorMessage('Failed to save preferences. Please try again.');
      }
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab.toLowerCase()) {
      // Render cuisine tab
      case 'cuisine':
        return (
          <div className="tab-content">
            <h3>Select Cuisine Preferences</h3>
            <p className="tab-description">
              Choose your preferred cuisines or select "No Preference" to see all options.
            </p>
            <div className="cuisine-options">
              <label className="no-preference">
                <input 
                  type="checkbox" 
                  checked={cuisineNoPreference}
                  onChange={(e) => setCuisineNoPreference(e.target.checked)}
                /> 
                No Preference
              </label>
              {['American', 'Barbecue', 'Chinese', 'French', 'Hamburger', 'Indian', 'Italian', 
                'Japanese', 'Mexican', 'Pizza', 'Seafood', 'Steak', 'Sushi', 'Thai'].map(cuisine => (
                <label key={cuisine}>
                  <input 
                    type="checkbox" 
                    disabled={cuisineNoPreference}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCuisinePreferences([...cuisinePreferences, cuisine]);
                      } else {
                        setCuisinePreferences(cuisinePreferences.filter(item => item !== cuisine));
                      }
                    }}
                    checked={cuisinePreferences.includes(cuisine)}
                  /> 
                  {cuisine}
                </label>
              ))}
            </div>
            <button 
              className="reset-button"
              onClick={() => {
                setCuisinePreferences([]);
                setCuisineNoPreference(false);
              }}
            >
              Reset
            </button>
          </div>
        );
      // Render price tab
      case 'price':
        return (
          <div className="tab-content">
            <h3>Select Price Preferences</h3>
            <p className="tab-description">
              Choose your preferred price ranges or select "No Preference" to see all options.
            </p>
            <div className="price-options">
              <label className="no-preference">
                <input 
                  type="checkbox" 
                  checked={priceNoPreference}
                  onChange={(e) => setPriceNoPreference(e.target.checked)}
                /> 
                No Preference
              </label>
              {['$', '$$', '$$$', '$$$$'].map((price, index) => {
                const priceArray = ['$', '$$', '$$$', '$$$$'];
                const isSelected = pricePreferences.includes(price);
                const minSelectedIndex = Math.min(...pricePreferences.map(p => priceArray.indexOf(p)));
                const maxSelectedIndex = Math.max(...pricePreferences.map(p => priceArray.indexOf(p)));
                const isInRange = index > minSelectedIndex && index < maxSelectedIndex;
                const isEndpoint = pricePreferences.includes(price);

                return (
                  <label key={price}>
                    <input 
                      type="checkbox" 
                      disabled={priceNoPreference || (isInRange && !isEndpoint)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Add this price to preferences
                          setPricePreferences(prev => {
                            const newPrefs = [...prev, price];
                            // If we have two or more selections, fill in the range
                            if (newPrefs.length >= 2) {
                              const min = Math.min(...newPrefs.map(p => priceArray.indexOf(p)));
                              const max = Math.max(...newPrefs.map(p => priceArray.indexOf(p)));
                              return priceArray.filter((_, i) => i >= min && i <= max);
                            }
                            return newPrefs;
                          });
                        } else {
                          // Only allow removal if it's an endpoint
                          if (isEndpoint) {
                            setPricePreferences(prev => prev.filter(p => p !== price));
                          }
                        }
                      }}
                      checked={isSelected || isInRange}
                    /> 
                    {price}
                  </label>
                );
              })}
            </div>
            <button 
              className="reset-button"
              onClick={() => {
                setPricePreferences([]);
                setPriceNoPreference(false);
              }}
            >
              Reset
            </button>
          </div>
        );
      // Render rating tab
      case 'rating':
        return (
          <div className="tab-content">
            <h3>Select Rating Preferences</h3>
            <p className="tab-description">
              Choose your minimum acceptable ratings or select "No Preference" to see all options.
            </p>
            <div className="rating-options">
              <label className="no-preference">
                <input 
                  type="checkbox" 
                  checked={ratingNoPreference}
                  onChange={(e) => {
                    setRatingNoPreference(e.target.checked);
                    if (e.target.checked) {
                      setRatingPreferences([]);
                    }
                  }}
                /> 
                No Preference
              </label>
              {['2.0', '2.5', '3.0', '3.5', '4.0', '4.5'].map(rating => (
                <label key={rating} className="rating-option">
                  <input 
                    type="radio"
                    name="rating"
                    disabled={ratingNoPreference}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRatingPreferences([rating]);
                        setRatingNoPreference(false);
                      }
                    }}
                    checked={ratingPreferences.includes(rating)}
                  /> 
                  {rating}+ stars
                  <div className="star-display">
                    {[...Array(Math.floor(Number(rating)))].map((_, index) => (
                      <img 
                        key={`full-${index}`}
                        src={fullStar}
                        alt="full star"
                        className="star-image"
                      />
                    ))}
                    {rating % 1 !== 0 && (
                      <img 
                        src={halfStar}
                        alt="half star"
                        className="star-image"
                      />
                    )}
                  </div>
                </label>
              ))}
            </div>
            <button 
              className="reset-button"
              onClick={() => {
                setRatingPreferences([]);
                setRatingNoPreference(false);
              }}
            >
              Reset
            </button>
          </div>
        );
      // Render distance tab
      case 'distance':
        return (
          <div className="tab-content">
            <h3>Select Distance Preference</h3>
            <p className="tab-description">
              Choose the maximum distance you're willing to travel or select "No Preference" for any distance.
            </p>
            <label className="no-preference">
              <input 
                type="checkbox" 
                checked={distanceNoPreference}
                onChange={(e) => {
                  setDistanceNoPreference(e.target.checked);
                  if (e.target.checked) {
                    setDistancePreferences(null);
                  }
                }}
              /> 
              No Preference
            </label>
            <div className="distance-slider">
              <input 
                type="range"
                min="1"
                max="20"
                step="1"
                disabled={distanceNoPreference}
                value={distancePreferences || 1}
                onChange={(e) => setDistancePreferences(Number(e.target.value))}
              />
              <div className="distance-value">
                {distancePreferences ? `${distancePreferences} ${distancePreferences === 1 ? 'mile' : 'miles'}` : 'Select distance'}
              </div>
            </div>
            <button 
              className="reset-button"
              onClick={() => {
                setDistancePreferences(null);
                setDistanceNoPreference(false);
              }}
            >
              Reset
            </button>
          </div>
        );
      // Default render
      default:
        return <div>Select your preferences</div>;
    }
  };

  // Check if tab is complete
  const isTabComplete = (tabName) => {
    switch (tabName) {
      case 'cuisine':
        return cuisineNoPreference || cuisinePreferences.length > 0;
      case 'price':
        return priceNoPreference || pricePreferences.length > 0;
      case 'rating':
        return ratingNoPreference || ratingPreferences.length > 0;
      case 'distance':
        return distanceNoPreference || distancePreferences !== null;
      default:
        return false;
    }
  };

  // Render preferences join page
  return (
    <section className="main-section">
      <div className="input-section">
        <div className="input-group">
          <label>Room Code</label>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <div className="preferences-container">
        <div className="preferences-table">
          <div className="tabs-section">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                className={`tab-button ${activeTab === tab.name.toLowerCase() ? 'active' : ''} ${isTabComplete(tab.name.toLowerCase()) ? 'completed' : ''}`}
                onClick={() => setActiveTab(tab.name.toLowerCase())}
              >
                <div className="tab-left">
                  <span className="tab-emoji">{tab.emoji}</span>
                  <span>{tab.name}</span>
                </div>
                <div className="tab-indicator"></div>
              </button>
            ))}
          </div>
          <div className="content-section">
            {renderTabContent()}
          </div>
        </div>
      </div>
      <div className="save-section">
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <button 
          className="save-button" 
          onClick={handleSavePreferences}
          type="button"
        >
          Save Preferences
        </button>
      </div>
    </section>
  );
}

export default JoinPreferences;