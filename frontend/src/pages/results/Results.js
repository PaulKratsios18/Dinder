import React, { useState } from 'react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import './Results.css';
import Header from '../../components/Header';

// Add this function at the top of the file, before the Results component
const getCuisineEmoji = (cuisine) => {
    const emojiMap = {
        'Italian': '🍝',
        'Chinese': '🥢',
        'Japanese': '🍱',
        'Mexican': '🌮',
        'Indian': '🍛',
        'American': '🍔',
        'Thai': '🍜',
        'Vietnamese': '🍜',
        'Korean': '🍖',
        'Mediterranean': '🥙',
        'Greek': '🥙',
        'French': '🥖',
        'Spanish': '🥘',
        'BBQ': '🍖',
        'Seafood': '🦐',
        'Pizza': '🍕',
        'Burger': '🍔',
        'Sushi': '🍣',
        'Vegetarian': '🥗',
        'Vegan': '🥬',
        'Breakfast': '🍳',
        'Cafe': '☕',
        'Dessert': '🍰',
        'Bakery': '🥨',
        'Bar': '🍺',
        'Pub': '🍺'
    };

    return emojiMap[cuisine] || '🍽️';
};

const Results = ({ topRestaurants, isAbsoluteMatch = false }) => {
    const { width, height } = useWindowSize();
    
    // State for managing UI interactions
    const [showDetailsMap, setShowDetailsMap] = useState({});
    const [showHoursMap, setShowHoursMap] = useState({});

    // Toggle detailed view for a restaurant
    const toggleDetails = (restaurantId) => {
        setShowDetailsMap(prev => ({
            ...prev,
            [restaurantId]: !prev[restaurantId]
        }));
    };

    // Toggle opening hours view for a restaurant
    const toggleHours = (restaurantId) => {
        setShowHoursMap(prev => ({
            ...prev,
            [restaurantId]: !prev[restaurantId]
        }));
    };

    // Display message when no matches are found
    if (topRestaurants.length === 0) {
        return (
            <>
                <Header />
                <div className="results-page">
                    <div className="no-matches">
                        <h2>No Matches Found</h2>
                        <p>No restaurants received more than 50% of the group's votes.</p>
                        <p>Please try again with new preferences.</p>
                    </div>
                </div>
            </>
        );
    }

    // Render results page with matched restaurants
    return (
        <>
            <Header />
            <div className="results-page">
                <h1>
                    {isAbsoluteMatch 
                        ? "Perfect Match Found! 🎉" 
                        : "Top Restaurant Matches"}
                </h1>
                <div className="results-container">
                    {/* Map through and display each matched restaurant */}
                    {topRestaurants.map((restaurant, index) => (
                        <div key={restaurant._id} className="restaurant-card">
                            {/* Ranking and voting information */}
                            {!isAbsoluteMatch && <div className="rank-badge">{index + 1}</div>}
                            <div className="vote-count-badge">
                                {isAbsoluteMatch 
                                    ? "All participants voted yes!"
                                    : `${restaurant.positiveVotes}/${restaurant.totalParticipants} votes`
                                }
                            </div>

                            {/* Restaurant image with fallback */}
                            <img 
                                src={restaurant.photo || '/assets/default-restaurant.jpg'} 
                                alt={restaurant.name} 
                                className="restaurant-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/default-restaurant.jpg';
                                }}
                            />

                            {/* Basic restaurant information */}
                            <div className={`restaurant-basic-info ${showDetailsMap[restaurant._id] ? 'hide' : ''}`}>
                                <div className="restaurant-info-left">
                                    <h2>{restaurant.name}</h2>
                                    <div className="quick-info">
                                        <div className="top-row">
                                            <span>⭐ {restaurant.rating}</span>
                                            <span>{getCuisineEmoji(restaurant.cuisine)} {restaurant.cuisine}</span>
                                            <span>💵 {restaurant.price}</span>
                                        </div>
                                        <div className="bottom-row">
                                            <span>🕒 {restaurant.openStatus}</span>
                                            <span>🚶 {restaurant.distance} km</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Button moved outside */}
                            <button className="details-button" onClick={() => toggleDetails(restaurant._id)}>
                                {showDetailsMap[restaurant._id] ? 'Less Info ▼' : 'More Info ▲'}
                            </button>

                            {/* Detailed restaurant information */}
                            <div className={`restaurant-details ${showDetailsMap[restaurant._id] ? 'show' : ''}`}>
                                <h2>{restaurant.name}</h2>
                                <div className="info-section">
                                    <div className="info-tag">
                                        ⭐ {restaurant.rating}
                                    </div>
                                    <div className="info-tag">
                                        💵 {restaurant.price}
                                    </div>
                                    <div className="info-tag">
                                        {getCuisineEmoji(restaurant.cuisine)} {restaurant.cuisine}
                                    </div>
                                    <div className="info-tag">
                                        🚶 {restaurant.distance} km
                                    </div>
                                    <div className="info-tag">
                                        🕒 {restaurant.openStatus}
                                    </div>
                                </div>
                                <div className="address-section">
                                    <div className="info-tag">📍 {restaurant.address}</div>
                                    {restaurant.wheelchairAccessible === 'Yes' && (
                                        <div className="info-tag">♿ Accessible</div>
                                    )}
                                </div>
                                {restaurant.openingHours?.length > 0 && (
                                    <div className="hours-section">
                                        <button 
                                            className="info-tag hours-toggle" 
                                            onClick={() => toggleHours(restaurant._id)}
                                            type="button"
                                        >
                                            🕒 Hours {showHoursMap[restaurant._id] ? '▼' : '▶'}
                                        </button>
                                        <div className={`opening-hours ${showHoursMap[restaurant._id] ? 'show' : ''}`}>
                                            {restaurant.openingHours.map((day, index) => (
                                                <div key={index} className="day-hours">{day}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isAbsoluteMatch && width > 0 && height > 0 && (
                        <Confetti width={width} height={height} />
                    )}
                </div>
            </div>
        </>
    );
};

export default Results;
