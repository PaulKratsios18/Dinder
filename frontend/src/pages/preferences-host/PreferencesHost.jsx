import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PreferencesHost.css';
import fullStar from '../../assets/full-star.png';
import halfStar from '../../assets/half-star.png';

// Location search component
const LocationSearch = ({ onLocationSelect, selectedLocation, distancePreference }) => {
  // State variables
  const [searchInput, setSearchInput] = useState(selectedLocation?.address || '');
  const searchBoxRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Define updateCircle first
  const updateCircle = useCallback((map, center, radius) => {
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    if (center && radius) {
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#023047",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#023047",
        fillOpacity: 0.15,
        map,
        center,
        radius: radius * 1609.34
      });

      // Calculate appropriate zoom level based on circle radius
      const radiusInMeters = radius * 1609.34;
      const bounds = circleRef.current.getBounds();
      map.fitBounds(bounds);

      // Zoom out slightly to show area beyond circle
      const currentZoom = map.getZoom();
      if (currentZoom) {
        map.setZoom(currentZoom - 0.5);
      }
    }
  }, []);

  // Then define createMarker
  const createMarker = useCallback((map, position, title) => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      map,
      position,
      title,
    });
  }, []);

  // Finally define handlePlaceSelect
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

      createMarker(map, place.geometry.location, place.name);
      updateCircle(map, place.geometry.location, distancePreference);
      
      setSearchInput(place.formatted_address);
      onLocationSelect?.(locationData);
    }
  }, [onLocationSelect, createMarker, updateCircle, distancePreference]);

  // Initialize search box
  useEffect(() => {
    // Initialize search box
    const initializeSearchBox = () => {
      console.log('Initializing map...');
      console.log('Google object available:', !!window.google);
      console.log('Map ref available:', !!mapRef.current);
      console.log('API Key available:', !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

      if (!window.google || !searchBoxRef.current || !mapRef.current) return;

      // Initialize map
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: selectedLocation 
            ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
            : { lat: 42.7298, lng: -73.6789 },
          zoom: selectedLocation ? 15 : 13,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          mapTypeId: 'roadmap'
        });

        console.log('Map created successfully');

        if (selectedLocation) {
          createMarker(
            map, 
            { lat: selectedLocation.lat, lng: selectedLocation.lng },
            selectedLocation.name
          );
          updateCircle(
            map,
            { lat: selectedLocation.lat, lng: selectedLocation.lng },
            distancePreference
          );
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          searchBoxRef.current,
          {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'us' }
          }
        );

        autocompleteRef.current.addListener('place_changed', () => handlePlaceSelect(map));
        console.log('Autocomplete initialized');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Initialize search box after 2 seconds
    const timer = setTimeout(() => {
      initializeSearchBox();
    }, 100);

    return () => clearTimeout(timer);
  }, [handlePlaceSelect, selectedLocation, createMarker, updateCircle, distancePreference]);

  // Render location search
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

// Render preferences host page
function HostPreferences() {
  // Initialize navigation and location
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, hostId } = location.state || {};
  const [activeTab, setActiveTab] = useState('cuisine');
  const [name, setName] = useState('');

  // Initialize tabs
  const tabs = [
    { name: 'Cuisine', emoji: '🍽️' },
    { name: 'Price', emoji: '💰' },
    { name: 'Rating', emoji: '⭐' },
    { name: 'Distance', emoji: '📍' },
    { name: 'Location', emoji: '🗺️' }
  ];

  // Initialize preferences
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

  // Add this with other state declarations at the top
  const [customCuisine, setCustomCuisine] = useState('');

  // Validate preferences
  const validatePreferences = () => {
    const errors = [];
    
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

  // Handle save preferences
  const handleSavePreferences = async () => {
    const errors = validatePreferences();
    if (errors.length > 0) {
      setErrorMessage(`Please fill out the following: ${errors.join(', ')}`);
      return;
    }
    
    try {
      // Get user ID
      const userId = localStorage.getItem('userId');

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
          host_id: userId,
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

      console.log('Response:', response);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get data
      const data = await response.json();
      console.log('Success:', data);
      
      // Navigate to group lobby host
      console.log('About to navigate to group lobby host');
      navigate('/lobby-host', { state: { roomCode, hostId } });
      console.log('Navigation completed');
      
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage(error.message || 'Failed to save preferences. Please try again.');
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
              {[...['American', 'Bakery', 'Bar', 'Bbq', 'Breakfast', 'Burger', 'Cafe', 'Chinese', 
                'Dessert', 'Diner','French', 'Greek', 'Indian', 'Italian', 'Japanese', 'Korean', 
                'Mediterranean', 'Mexican', 'Pizza', 'Pub', 'Seafood', 'Spanish', 'Steak', 
                'Sushi', 'Thai', 'Vegan', 'Vegetarian', 'Vietnamese'], ...cuisinePreferences]
                .filter((cuisine, index, self) => self.indexOf(cuisine) === index) // Remove duplicates
                .sort() // Sort alphabetically
                .map(cuisine => (
                  <label key={cuisine}>
                    <input 
                      type="checkbox" 
                      disabled={cuisineNoPreference}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCuisinePreferences(prev => [...prev, cuisine].sort());
                        } else {
                          setCuisinePreferences(prev => prev.filter(item => item !== cuisine));
                        }
                      }}
                      checked={cuisinePreferences.includes(cuisine)}
                    /> 
                    {cuisine}
                  </label>
                ))}
            </div>
            <div className="custom-cuisine-input">
              <input
                type="text"
                placeholder="Add custom cuisine"
                value={customCuisine}
                onChange={(e) => setCustomCuisine(e.target.value)}
                disabled={cuisineNoPreference}
              />
              <button
                className="add-cuisine-button"
                onClick={() => {
                  if (customCuisine.trim()) {
                    const formattedCuisine = customCuisine.trim()
                      .toLowerCase()
                      .replace(/\b\w/g, letter => letter.toUpperCase());
                    setCuisinePreferences([...cuisinePreferences, formattedCuisine]);
                    setCustomCuisine('');
                  }
                }}
                disabled={cuisineNoPreference}
              >
                Add
              </button>
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
              Choose your minimum acceptable rating or select "No Preference" to see all options.
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
                min="0.25"
                max="20"
                step={distancePreferences && distancePreferences >= 5 ? "1" : "0.25"}
                disabled={distanceNoPreference}
                value={distancePreferences || 0.25}
                onChange={(e) => setDistancePreferences(Number(e.target.value))}
                list="distance-markers"
              />
              <div className="distance-markers">
                <span style={{ left: '0%' }}>¼</span>
                <span style={{ left: '50%' }}>10</span>
                <span style={{ left: '100%' }}>20</span>
              </div>
              <div className="distance-value">
                {distancePreferences ? 
                  `${distancePreferences} ${distancePreferences === 1 ? 'mile' : 'miles'}` : 
                  'Select distance'}
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
      // Render location tab
      case 'location':
        return (
          <div className="tab-content">
            <h3>Select Your Location</h3>
            <p className="tab-description">
              Enter your starting location to help us find restaurants within your preferred distance.
            </p>
            <div className="location-options">
              <LocationSearch 
                onLocationSelect={(location) => {
                  setLocationPreference(location);
                  console.log('Selected location:', location);
                }} 
                selectedLocation={locationPreference}
                distancePreference={distancePreferences}
              />
            </div>
            <button 
              className="reset-button"
              onClick={() => {
                setLocationPreference(null);
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
      case 'location':
        return locationPreference !== null;
      default:
        return false;
    }
  };

  // Render preferences host page
  return (
    <section className="main-section">
      <div className="input-section">
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
        <button className="save-button" onClick={handleSavePreferences}>
          Save Preferences
        </button>
      </div>
    </section>
  );
}

export default HostPreferences; 
