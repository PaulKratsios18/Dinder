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

  const tabs = ['Cuisine', 'Price', 'Rating', 'Distance'];

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
              Choose your preferred type(s) of cuisine. Select multiple options or check "No Preference" to consider all cuisines.
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
          </div>
        );
      case 'price':
        return (
          <div className="tab-content">
            <h3>Select Price Preferences</h3>
            <p className="tab-description">
              Select your budget range. $ = Inexpensive, $$ = Moderate, $$$ = Expensive, $$$$ = Very Expensive. Choose multiple options or select "No Preference".
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
              {['$', '$$', '$$$', '$$$$'].map(price => (
                <label key={price}>
                  <input 
                    type="checkbox" 
                    disabled={priceNoPreference}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPricePreferences([...pricePreferences, price]);
                      } else {
                        setPricePreferences(pricePreferences.filter(item => item !== price));
                      }
                    }}
                    checked={pricePreferences.includes(price)}
                  /> 
                  {price}
                </label>
              ))}
            </div>
          </div>
        );
      case 'rating':
        return (
          <div className="tab-content">
            <h3>Select Rating Preferences</h3>
            <p className="tab-description">
              Choose minimum acceptable ratings for restaurants. Select multiple ratings or check "No Preference" to consider all ratings.
            </p>
            <div className="rating-options">
              <label className="no-preference">
                <input 
                  type="checkbox" 
                  checked={ratingNoPreference}
                  onChange={(e) => setRatingNoPreference(e.target.checked)}
                /> 
                No Preference
              </label>
              {[2.0, 2.5, 3.0, 3.5, 4.0, 4.5].map((rating) => {
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 !== 0;
                
                return (
                  <label key={rating} className="rating-option">
                    <input 
                      type="checkbox"
                      disabled={ratingNoPreference}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRatingPreferences([...ratingPreferences, rating]);
                        } else {
                          setRatingPreferences(ratingPreferences.filter(item => item !== rating));
                        }
                      }}
                      checked={ratingPreferences.includes(rating)}
                    />
                    <span>{rating}</span>
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
          </div>
        );
      case 'distance':
        return (
          <div className="tab-content">
            <h3>Select Distance Preferences</h3>
            <p className="tab-description">
              Choose the maximum distance you're willing to travel. Select one option or check "No Preference" for any distance.
            </p>
            <div className="distance-options">
              <label className="no-preference">
                <input 
                  type="checkbox" 
                  checked={distanceNoPreference}
                  onChange={(e) => setDistanceNoPreference(e.target.checked)}
                /> 
                No Preference
              </label>
              {[1, 2, 3, 4, 5, 10, 15, 20].map((miles) => (
                <label key={miles}>
                  <input 
                    type="radio"
                    name="distance"
                    disabled={distanceNoPreference}
                    onChange={() => setDistancePreferences(miles)}
                    checked={distancePreferences === miles}
                  />
                  {`${miles} ${miles === 1 ? 'mile' : 'miles'}`}
                </label>
              ))}
            </div>
          </div>
        );
      default:
        return <div>Select your preferences</div>;
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
                key={tab}
                className={`tab-button ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.toLowerCase())}
              >
                {tab}
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