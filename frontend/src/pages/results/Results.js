import React, { useState } from 'react';
import './Results.css';
import Header from '../../components/Header';

const Results = ({ topRestaurants }) => {
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
                <h1>Top Restaurant Matches</h1>
                <div className="results-container">
                    {/* Map through and display each matched restaurant */}
                    {topRestaurants.map((restaurant, index) => (
                        <div key={restaurant._id} className="restaurant-card">
                            {/* Ranking and voting information */}
                            <div className="rank-badge">{index + 1}</div>
                            <div className="vote-count-badge">
                                {restaurant.positiveVotes}/{restaurant.totalParticipants} votes
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
                                <h2>{restaurant.name}</h2>
                                <div className="quick-info">
                                    <span>{restaurant.rating} ⭐</span>
                                    <span>{restaurant.price}</span>
                                    <span>{restaurant.openStatus}</span>
                                </div>
                            </div>

                            {/* Detailed restaurant information */}
                            <button className="details-button" onClick={() => toggleDetails(restaurant._id)}>
                                {showDetailsMap[restaurant._id] ? 'Less Info ▼' : 'More Info ▲'}
                            </button>
                            <div className={`restaurant-details ${showDetailsMap[restaurant._id] ? 'show' : ''}`}>
                                <h2>{restaurant.name}</h2>
                                <div className="info-section">
                                    <div className="info-tag">
                                        <span>⭐</span> {restaurant.rating}
                                    </div>
                                    <div className="info-tag">{restaurant.price}</div>
                                    <div className="info-tag">{restaurant.cuisine}</div>
                                    <div className="info-tag">🚶 {restaurant.distance} km</div>
                                    <div className="info-tag">🕒 {restaurant.openStatus}</div>
                                </div>
                                <div className="address-section">
                                    <div className="info-tag">📍 {restaurant.address}</div>
                                    {restaurant.wheelchairAccessible === 'Yes' && (
                                        <div className="info-tag">♿ Accessible</div>
                                    )}
                                </div>
                                {restaurant.openingHours?.length > 0 && (
                                    <div className="hours-section">
                                        <div className="info-tag hours-toggle" onClick={() => toggleHours(restaurant._id)}>
                                            <span>🕒</span> Hours {showHoursMap[restaurant._id] ? '▼' : '▶'}
                                        </div>
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
                </div>
            </div>
        </>
    );
};

export default Results;
