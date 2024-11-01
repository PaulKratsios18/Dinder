import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PreferencesHostPage.css';

const LocationSearch = ({ onLocationSelect, selectedLocation }) => {
  const [searchInput, setSearchInput] = useState(selectedLocation?.address || '');
  const searchBoxRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const handlePlaceSelect = useCallback((map) => {
    const place = autocompleteRef.current.getPlace();
    
    if (place.geometry) {
      const locationData = {
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name
      };
      
      map.setCenter(place.geometry.location);
      map.setZoom(15);

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      markerRef.current = new window.google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name
      });
      
      setSearchInput(place.formatted_address);
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }
    }
  }, [onLocationSelect]);

  useEffect(() => {
    const initializeSearchBox = () => {
      if (!window.google || !searchBoxRef.current || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: selectedLocation 
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : { lat: 37.0902, lng: -95.7129 },
        zoom: selectedLocation ? 15 : 4
      });

      if (selectedLocation) {
        markerRef.current = new window.google.maps.Marker({
          map,
          position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          title: selectedLocation.name
        });
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchBoxRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'us' }
        }
      );

      autocompleteRef.current.addListener('place_changed', () => handlePlaceSelect(map));
    };

    initializeSearchBox();
  }, [handlePlaceSelect, selectedLocation]);

  return (
    <div className="location-search">
      <div className="location-content">
        <div className="search-container">
          <input
            ref={searchBoxRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter a location"
            className="location-search-input"
          />
        </div>
        <div ref={mapRef} className="location-map"></div>
        {selectedLocation && (
          <div className="selected-location">
            <h4>Selected Location:</h4>
            <p>{selectedLocation.name}</p>
            <p>{selectedLocation.address}</p>
          </div>
        )}
      </div>
    </div>
  );
};

function PreferencesHostPage() {
  const [activeTab, setActiveTab] = useState('cuisine');
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');

  const tabs = ['Cuisine', 'Price', 'Rating', 'Distance', 'Location'];

  const [cuisineNoPreference, setCuisineNoPreference] = useState(false);
  const [priceNoPreference, setPriceNoPreference] = useState(false);
  const [ratingNoPreference, setRatingNoPreference] = useState(false);
  const [distanceNoPreference, setDistanceNoPreference] = useState(false);

  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [pricePreferences, setPricePreferences] = useState([]);
  const [ratingPreferences, setRatingPreferences] = useState([]);
  const [distancePreferences, setDistancePreferences] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [locationPreference, setLocationPreference] = useState(null);

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
    if (!locationPreference) {
      errors.push('Location');
    }

    return errors;
  };

  const handleSavePreferences = () => {
    const errors = validatePreferences();
    if (errors.length > 0) {
      setErrorMessage(`Please fill out the following: ${errors.join(', ')}`);
      return;
    }
    
    setErrorMessage('');
    console.log('Preferences saved!');
  };

  const renderTabContent = () => {
    switch (activeTab.toLowerCase()) {
      case 'cuisine':
        return (
          <div className="tab-content">
            <h3>Select Cuisine Preferences</h3>
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
                          src="/full-star.png"
                          alt="full star"
                          className="star-image"
                        />
                      ))}
                      {hasHalfStar && (
                        <img 
                          src="/half-star.png"
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
      case 'location':
        return (
          <div className="tab-content">
            <h3>Select Your Location</h3>
            <div className="location-options">
              <LocationSearch 
                onLocationSelect={(location) => {
                  setLocationPreference(location);
                  console.log('Selected location:', location);
                }} 
                selectedLocation={locationPreference}
              />
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
            className="room-code-input"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (value.length <= 4) {
                setRoomCode(value);
              }
            }}
            maxLength={4}
          />
        </div>
        <div className="input-group">
          <label>Name</label>
          <input
            type="text"
            className="name-input"
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
        <button className="save-button" onClick={handleSavePreferences}>
          Save Preferences
        </button>
      </div>
    </section>
  );
}

export default PreferencesHostPage;