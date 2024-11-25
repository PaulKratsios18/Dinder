import React from 'react';
import './Results.css';

const Results = ({ topRestaurants }) => {
    const formatPrice = (price) => {
        if (!price) return 'Price not available';
        return price; // Just return the '$' symbols directly
    };
    const formatWheelchair = (accessible) => accessible === 'Yes' ? '♿ Accessible' : 'Not wheelchair accessible';

    return (
        <div className="results-page">
            <h1>Top Restaurant Matches</h1>
            <div className="results-container">
                {topRestaurants.map((restaurant, index) => (
                    <div key={restaurant._id} className="result-card">
                        <div className="rank-badge">{index + 1}</div>
                        <img 
                            src={restaurant.photo} 
                            alt={restaurant.name} 
                            className="restaurant-image"
                        />
                        <div className="restaurant-details">
                            <h2>{restaurant.name}</h2>
                            <div className="vote-info">
                                <span className="vote-count">
                                    👍 {restaurant.positiveVotes} / {restaurant.totalParticipants} votes
                                </span>
                            </div>
                            <div className="restaurant-info">
                                <p><strong>Rating:</strong> {restaurant.rating} ⭐</p>
                                <p><strong>Price:</strong> {formatPrice(restaurant.price)}</p>
                                <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                                <p><strong>Address:</strong> {restaurant.address}</p>
                                {restaurant.openStatus !== 'Unknown' && (
                                    <p><strong>Hours:</strong> {restaurant.openStatus}</p>
                                )}
                                {restaurant.wheelchairAccessible !== 'Unknown' && (
                                    <p><strong>Accessibility:</strong> {formatWheelchair(restaurant.wheelchairAccessible)}</p>
                                )}
                                <p><strong>Distance:</strong> {restaurant.distance} km</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Results;
