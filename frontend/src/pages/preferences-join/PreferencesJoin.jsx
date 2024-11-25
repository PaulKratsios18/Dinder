import React, { useState, useEffect } from 'react';
import './PreferencesJoin.css';
import { useNavigate } from 'react-router-dom';
import fullStar from '../../assets/full-star.png';
import halfStar from '../../assets/half-star.png';

function JoinPreferences() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cuisine');
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');

  const tabs = [
    { name: 'Cuisine', emoji: '🍽️', tooltip: 'Select your favorite types of food' },
    { name: 'Price', emoji: '💰', tooltip: 'Choose your comfortable price range' },
    { name: 'Rating', emoji: '⭐', tooltip: 'Set minimum restaurant rating' },
    { name: 'Distance', emoji: '📍', tooltip: 'How far you\'re willing to travel' }
  ];

  const [cuisineNoPreference, setCuisineNoPreference] = useState(false);
  const [priceNoPreference, setPriceNoPreference] = useState(false);
  const [ratingNoPreference, setRatingNoPreference] = useState(false);
  const [distanceNoPreference, setDistanceNoPreference] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [locationPreference, setLocationPreference] = useState('');

  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [pricePreferences, setPricePreferences] = useState([]);
  const [ratingPreferences, setRatingPreferences] = useState([]);
  const [distancePreferences, setDistancePreferences] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  

  useEffect(() => {
    // Get room code from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, []);

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

  const handleSavePreferences = async () => {
    const errors = validatePreferences();
    if (errors.length > 0) {
        setErrorMessage(`Please fill out the following: ${errors.join(', ')}`);
        return;
    }
    
    try {
        // First, check the current number of participants in the session
        const checkResponse = await fetch(`http://localhost:5000/api/sessions/${roomCode}/participants`);
        const sessionData = await checkResponse.json();

        if (!checkResponse.ok) {
          if (sessionData.error === 'Session not found') {
            setErrorMessage('Invalid room code. Please check and try again.');
            return;
          }
          throw new Error(sessionData.error || `HTTP error! status: ${checkResponse.status}`);
        }

        // Check if session is full (10 participants max)
        if (sessionData.participants.length >= 10) {
          setErrorMessage('This session is full (maximum 10 participants). Please join another session.');
          return;
        }

        // If not full, proceed with saving preferences
        const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', userId);

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

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === 'Session not found') {
          setErrorMessage('Invalid room code. Please check and try again.');
          return;
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Success:', data);
      
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

  const renderTabContent = () => {
    switch (activeTab.toLowerCase()) {
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
      case 'price':
        return (
          <div className="tab-content">
            <h3>Select Price Preferences</h3>
            <p className="tab-description">
              Choose your price range by selecting the minimum and maximum prices you're comfortable with.
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
              {['$', '$$', '$$$', '$$$$'].map((price, index) => (
                <label key={price}>
                  <input 
                    type="checkbox" 
                    disabled={priceNoPreference}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Find the lowest and highest checked prices
                        const currentChecked = [...pricePreferences, price];
                        const indices = currentChecked.map(p => ['$', '$$', '$$$', '$$$$'].indexOf(p));
                        const minIndex = Math.min(...indices);
                        const maxIndex = Math.max(...indices);
                        
                        // Add all prices between min and max to preferences
                        const newPreferences = ['$', '$$', '$$$', '$$$$']
                          .filter((_, i) => i >= minIndex && i <= maxIndex);
                        setPricePreferences(newPreferences);
                      } else {
                        // Remove this price and update range if needed
                        const remainingPrices = pricePreferences.filter(p => p !== price);
                        if (remainingPrices.length > 0) {
                          const indices = remainingPrices.map(p => ['$', '$$', '$$$', '$$$$'].indexOf(p));
                          const minIndex = Math.min(...indices);
                          const maxIndex = Math.max(...indices);
                          setPricePreferences(['$', '$$', '$$$', '$$$$']
                            .filter((_, i) => i >= minIndex && i <= maxIndex));
                        } else {
                          setPricePreferences([]);
                        }
                      }
                    }}
                    checked={pricePreferences.includes(price)}
                  /> 
                  {price}
                </label>
              ))}
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
      case 'rating':
        return (
          <div className="tab-content">
            <h3>Select Rating Preferences</h3>
            <p className="tab-description">
              Choose the minimum star rating you'd like to see, or select "No Preference" to see all options.
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
              {[2.0, 2.5, 3.0, 3.5, 4.0, 4.5].map((rating) => {
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 !== 0;
                
                return (
                  <label key={rating} className="rating-option">
                    <input 
                      type="radio"
                      name="rating"
                      disabled={ratingNoPreference}
                      onChange={() => setRatingPreferences([rating])}
                      checked={ratingPreferences.includes(rating)}
                    />
                    <span>{rating}+ stars</span>
                    <div className="star-display">
                      {[...Array(fullStars)].map((_, index) => (
                        <img 
                          key={`full-${index}`}
                          src={fullStar}
                          alt="full star"
                          className="star-image"
                        />
                      ))}
                      {hasHalfStar && (
                        <img 
                          src={halfStar}
                          alt="half star"
                          className="star-image"
                        />
                      )}
                    </div>
                  </label>
                );
              })}
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
      case 'distance':
        return (
          <div className="tab-content">
            <h3>Select Distance Preference</h3>
            <p className="tab-description">
              Drag the slider to set your maximum travel distance, or select "No Preference" for any distance.
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
                max="25"
                step="1"
                disabled={distanceNoPreference}
                value={distancePreferences || 5}
                onChange={(e) => setDistancePreferences(parseInt(e.target.value))}
              />
              <div className="distance-value">
                {distanceNoPreference ? 'Any Distance' : `${distancePreferences || 5} miles`}
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
      default:
        return <div>Select your preferences</div>;
    }
  };

  const isTabCompleted = (tabName) => {
    switch (tabName.toLowerCase()) {
      case 'cuisine':
        return cuisineNoPreference || cuisinePreferences.length > 0;
      case 'price':
        return priceNoPreference || pricePreferences.length > 0;
      case 'rating':
        return ratingNoPreference || ratingPreferences.length > 0;
      case 'distance':
        return distanceNoPreference || distancePreferences !== null;
      case 'location':
        return locationPreference !== null;
      default:
        return false;
    }
  };

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
                className={`tab-button ${activeTab === tab.name.toLowerCase() ? 'active' : ''} 
                            ${isTabCompleted(tab.name) ? 'completed' : ''}`}
                onClick={() => setActiveTab(tab.name.toLowerCase())}
                data-emoji={tab.emoji}
                title={tab.tooltip}
              >
                {tab.name}
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