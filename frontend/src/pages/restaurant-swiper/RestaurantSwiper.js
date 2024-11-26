import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './RestaurantSwiper.css';
import Results from '../results/Results';
import Header from '../../components/Header';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

const RestaurantSwiper = () => {
    // Get window dimensions for confetti effect
    const { width, height } = useWindowSize();
    const { sessionId } = useParams();
    
    // State management for restaurant swiping
    const [restaurants, setRestaurants] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [votes, setVotes] = useState({});
    const [socket, setSocket] = useState(null);
    const [matchFound, setMatchFound] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [topRestaurants, setTopRestaurants] = useState([]);
    
    // UI state management
    const [showHours, setShowHours] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showHoursMap, setShowHoursMap] = useState({});
    
    // Drag interaction state
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Initialize socket connection and fetch restaurants
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
            setTopRestaurants(data.topRestaurants || []);
            setCurrentIndex(1000);
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

    // Reset details view when changing restaurants
    useEffect(() => {
        setShowDetails(false);
    }, [currentIndex]);

    // Handle voting logic
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
        
        socket.emit('vote', {
            sessionId,
            userId,
            restaurantId: restaurant._id,
            vote
        });

        setCurrentIndex(prev => prev + 1);
    };

    const toggleHours = (restaurantId) => {
        setShowHoursMap(prev => ({
            ...prev,
            [restaurantId]: !prev[restaurantId]
        }));
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

    // First, check for perfect match
    if (matchFound) {
        return (
            <>
                <Header />
                <div className="restaurant-swiper">
                    <div className="match-title">It's a Match! 🎉</div>
                    <div className="restaurant-card">
                        <img 
                            src={matchFound.photo || '/assets/default-restaurant.jpg'} 
                            alt={matchFound.name} 
                            className="restaurant-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/default-restaurant.jpg';
                            }}
                        />
                        <div className={`restaurant-basic-info ${showDetails ? 'hide' : ''}`}>
                            <h2>{matchFound.name}</h2>
                            <div className="quick-info">
                                <span>{matchFound.rating} ⭐</span>
                                <span>{matchFound.price}</span>
                                <span>{matchFound.openStatus}</span>
                            </div>
                        </div>
                        <button className="details-button" onClick={toggleDetails}>
                            {showDetails ? 'Less Info ▼' : 'More Info ▲'}
                        </button>
                        <div className={`restaurant-details ${showDetails ? 'show' : ''}`}>
                            <h2>{matchFound.name}</h2>
                            <div className="info-section">
                                <div className="info-tag">
                                    <span>⭐</span> {matchFound.rating}
                                </div>
                                <div className="info-tag">{matchFound.price}</div>
                                <div className="info-tag">{matchFound.cuisine}</div>
                                <div className="info-tag">🚶 {matchFound.distance} km</div>
                                <div className="info-tag">🕒 {matchFound.openStatus}</div>
                            </div>
                            <div className="address-section">
                                <div className="info-tag">📍 {matchFound.address}</div>
                                {matchFound.wheelchairAccessible === 'Yes' && (
                                    <div className="info-tag">♿ Accessible</div>
                                )}
                            </div>
                            {matchFound.openingHours?.length > 0 && (
                                <div className="hours-section">
                                    <div className="info-tag hours-toggle" onClick={() => toggleHours(matchFound._id)}>
                                        <span>🕒</span> Hours {showHoursMap[matchFound._id] ? '▼' : '▶'}
                                    </div>
                                    <div className={`opening-hours ${showHoursMap[matchFound._id] ? 'show' : ''}`}>
                                        {matchFound.openingHours.map((day, index) => (
                                            <div key={index} className="day-hours">{day}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {width > 0 && height > 0 && <Confetti width={width} height={height} />}
                </div>
            </>
        );
    }

    // Second, check if we should show results
    if (showResults) {
        if (topRestaurants.length === 0) {
            return (
                <>
                    <Header />
                    <div className="restaurant-swiper">
                        <div className="no-matches">
                            <h2>No Matches Found</h2>
                            <p>No restaurants received more than 50% of the group's votes.</p>
                            <p>Please try again with new preferences.</p>
                        </div>
                    </div>
                </>
            );
        }
        return <Results topRestaurants={topRestaurants} />;
    }

    // Last, check if we're still waiting for others
    if (currentIndex >= restaurants.length) {
        return (
            <>
                <Header />
                <div className="restaurant-swiper">
                    <div className="voting-complete">
                        <h2>Voting Complete!</h2>
                        <p>Waiting for other participants to finish voting...</p>
                    </div>
                </div>
            </>
        );
    }

    const currentRestaurant = restaurants[currentIndex];
    if (!currentRestaurant) return <div>Loading...</div>;

    return (
        <>
            <Header />
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
                    <div className={`restaurant-basic-info ${showDetails ? 'hide' : ''}`}>
                        <h2>{currentRestaurant.name}</h2>
                        <div className="quick-info">
                            <span>{currentRestaurant.rating} ⭐</span>
                            <span>{currentRestaurant.price}</span>
                            <span>{currentRestaurant.openStatus}</span>
                        </div>
                    </div>
                    <button className="details-button" onClick={toggleDetails}>
                        {showDetails ? 'Less Info ' : 'More Info ▲'}
                    </button>
                    <div className={`restaurant-details ${showDetails ? 'show' : ''}`}>
                        <h2>{currentRestaurant.name}</h2>
                        <div className="info-section">
                            <div className="info-tag">
                                <span>⭐</span> {currentRestaurant.rating}
                            </div>
                            <div className="info-tag">{currentRestaurant.price}</div>
                            <div className="info-tag">{currentRestaurant.cuisine}</div>
                            <div className="info-tag">🚶 {currentRestaurant.distance} km</div>
                            <div className="info-tag">🕒 {currentRestaurant.openStatus}</div>
                        </div>
                        <div className="address-section">
                            <div className="info-tag">📍 {currentRestaurant.address}</div>
                            {currentRestaurant.wheelchairAccessible === 'Yes' && (
                                <div className="info-tag">♿ Accessible</div>
                            )}
                        </div>
                        {currentRestaurant.openingHours?.length > 0 && (
                            <div className="hours-section">
                                <div className="info-tag hours-toggle" onClick={() => toggleHours(currentRestaurant._id)}>
                                    <span>🕒</span> Hours {showHoursMap[currentRestaurant._id] ? '▼' : '▶'}
                                </div>
                                <div className={`opening-hours ${showHoursMap[currentRestaurant._id] ? 'show' : ''}`}>
                                    {currentRestaurant.openingHours.map((day, index) => (
                                        <div key={index} className="day-hours">{day}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="vote-buttons">
                    <button onClick={() => handleVoteWithAnimation(false)} className="vote-no">✗</button>
                    <button onClick={() => handleVoteWithAnimation(true)} className="vote-yes">✓</button>
                </div>
            </div>
        </>
    );
};

export default RestaurantSwiper;
