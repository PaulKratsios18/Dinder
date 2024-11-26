import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './RestaurantSwiper.css';
import Results from '../results/Results';

const RestaurantSwiper = () => {
    const { sessionId } = useParams();
    const [restaurants, setRestaurants] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [votes, setVotes] = useState({});
    const [socket, setSocket] = useState(null);
    const [matchFound, setMatchFound] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [topRestaurants, setTopRestaurants] = useState([]);
    const [showHours, setShowHours] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        // Note: When testing multiple users, use different browsers or incognito mode
        // as localStorage is shared within the same browser
        
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Get the userId from localStorage that was set during join/host
        const userId = localStorage.getItem('userId');
        console.log('RestaurantSwiper connecting with userId:', userId);

        // Store userId in socket for this connection
        newSocket.auth = { userId };
        
        newSocket.emit('joinSession', { 
            roomCode: sessionId,
            userId: userId
        });

        // Debug logging
        newSocket.on('connect', () => {
            console.log('Connected with userId:', userId);
        });

        // Add debug logging for vote updates
        newSocket.on('voteUpdate', (data) => {
            console.log('Vote update received for user:', userId, data);
            setVotes(prev => ({
                ...prev,
                [data.restaurantId]: data.votes
            }));
        });

        // Listen for match found
        newSocket.on('matchFound', (data) => {
            console.log('Match found received:', data);
            setMatchFound(data);
            // Stop further voting by setting currentIndex to a high number
            setCurrentIndex(1000);
        });

        newSocket.on('showResults', (data) => {
            console.log('Results received:', data);
            setShowResults(true);
            setTopRestaurants(data.topRestaurants);
        });

        const fetchRestaurants = async () => {
            const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/ranked-restaurants`);
            const data = await response.json();
            if (data.success) {
                setRestaurants(data.restaurants);
            }
        };

        fetchRestaurants();

        return () => {
            newSocket.off('matchFound');
            newSocket.off('voteUpdate');
            newSocket.off('showResults');
            newSocket.close();
        };
    }, [sessionId]);

    useEffect(() => {
        setShowDetails(false);
    }, [currentIndex]);

    const handleVote = async (vote) => {
        if (matchFound || currentIndex >= restaurants.length) return;

        const restaurant = restaurants[currentIndex];
        const userId = localStorage.getItem('userId');
        
        console.log('Submitting vote:', {
            userId,
            restaurantId: restaurant._id,
            vote,
            sessionId
        });
        
        socket.emit('submitVote', {
            sessionId,
            userId,
            restaurantId: restaurant._id,
            vote
        });

        setCurrentIndex(prev => prev + 1);
    };

    const toggleHours = (e) => {
        e.stopPropagation(); // Prevent triggering other click events
        setShowHours(!showHours);
    };

    const toggleDetails = (e) => {
        e.stopPropagation();
        setShowDetails(!showDetails);
    };

    const handleDragStart = (e) => {
        setIsDragging(true);
        setDragStart(e.type === 'mousedown' ? e.clientX : e.touches[0].clientX);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const offset = currentX - dragStart;
        setDragOffset(offset);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        if (Math.abs(dragOffset) > 100) {
            // Swipe threshold met
            const vote = dragOffset > 0;
            handleVote(vote);
        }
        setDragOffset(0);
    };

    const animateSwipe = (direction) => {
        setDragOffset(direction * window.innerWidth);
        setTimeout(() => {
            setDragOffset(0);
        }, 300);
    };

    const handleVoteWithAnimation = (vote) => {
        animateSwipe(vote ? 1 : -1);
        handleVote(vote);
    };

    if (matchFound) {
        return (
            <div className="match-overlay">
                <h2>It's a Match! 🎉</h2>
                <h3>{matchFound.name}</h3>
                <img src={matchFound.photo} alt={matchFound.name} />
                <div className="match-details">
                    <p><strong>Rating:</strong> {matchFound.rating} ⭐</p>
                    <p><strong>Price:</strong> {matchFound.price}</p>
                    <p><strong>Cuisine:</strong> {matchFound.cuisine}</p>
                    <p><strong>Address:</strong> {matchFound.address}</p>
                    <p><strong>Current Status:</strong> {matchFound.openStatus}</p>
                    {matchFound.openingHours && matchFound.openingHours.length > 0 && (
                        <div className="hours-section">
                            <strong>Hours:</strong>
                            <div className="opening-hours">
                                {matchFound.openingHours.map((day, index) => (
                                    <div key={index} className="day-hours">{day}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    {matchFound.wheelchairAccessible !== 'Unknown' && (
                        <p><strong>Accessibility:</strong> 
                            {matchFound.wheelchairAccessible === 'Yes' ? '♿ Accessible' : 'Not wheelchair accessible'}
                        </p>
                    )}
                    <p><strong>Distance:</strong> {matchFound.distance} km</p>
                </div>
            </div>
        );
    }

    if (showResults) {
        return <Results topRestaurants={topRestaurants} />;
    }

    if (currentIndex >= restaurants.length) {
        return (
            <div className="voting-complete">
                <h2>Voting Complete!</h2>
                <p>Waiting for other participants to finish voting...</p>
            </div>
        );
    }

    const currentRestaurant = restaurants[currentIndex];
    if (!currentRestaurant) return <div>Loading...</div>;

    return (
        <div className="restaurant-swiper">
            <div 
                className="restaurant-card"
                style={{
                    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease'
                }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                <img 
                    src={currentRestaurant.photo || '/assets/default-restaurant.jpg'} 
                    alt={currentRestaurant.name} 
                    className="restaurant-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/default-restaurant.jpg';
                    }}
                />
                <div className="restaurant-basic-info">
                    <h2>{currentRestaurant.name}</h2>
                    <div className="quick-info">
                        <span>{currentRestaurant.rating} ⭐</span>
                        <span>{currentRestaurant.price}</span>
                        <span>{currentRestaurant.openStatus}</span>
                    </div>
                </div>

                <div className={`restaurant-details ${showDetails ? 'show' : ''}`}>
                    <p><strong>Cuisine:</strong> {currentRestaurant.cuisine}</p>
                    <p><strong>Address:</strong> {currentRestaurant.address}</p>
                    {currentRestaurant.openingHours?.length > 0 && (
                        <div className="hours-section">
                            <div className="hours-header" onClick={toggleHours}>
                                <strong>Hours</strong>
                                <span className={`hours-caret ${showHours ? 'up' : 'down'}`}>
                                    {showHours ? '▲' : '▼'}
                                </span>
                            </div>
                            {showHours && (
                                <div className="opening-hours">
                                    {currentRestaurant.openingHours.map((day, index) => (
                                        <div key={index} className="day-hours">{day}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {currentRestaurant.wheelchairAccessible !== 'Unknown' && (
                        <p><strong>Accessibility:</strong> 
                            {currentRestaurant.wheelchairAccessible === 'Yes' ? '♿ Accessible' : 'Not wheelchair accessible'}
                        </p>
                    )}
                    <p><strong>Distance:</strong> {currentRestaurant.distance} km</p>
                </div>
            </div>

            <div className="vote-buttons">
                <button onClick={() => handleVoteWithAnimation(false)} className="vote-no">✗</button>
                <button onClick={() => handleVoteWithAnimation(true)} className="vote-yes">✓</button>
            </div>
            
            <button className="details-button" onClick={toggleDetails}>
                {showDetails ? 'Less Info ▲' : 'More Info ▼'}
            </button>
        </div>
    );
};

export default RestaurantSwiper;
