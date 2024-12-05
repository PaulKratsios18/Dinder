import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './RestaurantSwiper.css';
import Results from '../results/Results';
import Header from '../../components/Header';

const getCuisineEmoji = (cuisine) => {
    const emojiMap = {
        'italian': '🍝',
        'chinese': '🥢',
        'japanese': '🍱',
        'mexican': '🌮',
        'indian': '🍛',
        'american': '🍔',
        'thai': '🍜',
        'vietnamese': '🍜',
        'korean': '🍖',
        'mediterranean': '🥙',
        'greek': '🥙',
        'french': '🥖',
        'spanish': '🥘',
        'bbq': '🍖',
        'seafood': '🦐',
        'pizza': '🍕',
        'burger': '🍔',
        'sushi': '🍣',
        'vegetarian': '🥗',
        'vegan': '🥬',
        'breakfast': '🍳',
        'cafe': '☕',
        'dessert': '🍰',
        'bakery': '🥨',
        'bar': '🍺',
        'pub': '🍺',
        'steak': '🥩'
    };

    return emojiMap[cuisine.toLowerCase()] || '🍽️';
};

const RestaurantSwiper = () => {
    const { sessionId } = useParams();
    
    // State management for restaurant swiping
    const [restaurants, setRestaurants] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [socket, setSocket] = useState(null);
    const [matchFound, setMatchFound] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [topRestaurants, setTopRestaurants] = useState([]);
    
    // UI state management
    const [showDetailsMap, setShowDetailsMap] = useState({});
    
    // Drag interaction state
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Add new state for animation
    const [isNewCard, setIsNewCard] = useState(false);

    // Add showHoursMap state
    const [showHoursMap, setShowHoursMap] = useState({});

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
        });

        // Listen for match found
        newSocket.on('matchFound', (data) => {
            console.log('Match found received:', data);
            // The backend is already sending us complete restaurant data
            setMatchFound(data);
            setShowResults(false); // Ensure we show the match view, not the top 3 results
        });

        newSocket.on('showResults', (data) => {
            console.log('Results received:', data);
            setShowResults(true);
            setTopRestaurants(data.topRestaurants || []);
        });

        // Listen for all voting complete
        newSocket.on('votingComplete', (data) => {
            console.log('All voting complete:', data);
            setShowResults(true);
            setTopRestaurants(data.topRestaurants || []);
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
            newSocket.off('votingComplete');
            newSocket.close();
        };
    }, [sessionId]);

    // Reset details view when changing restaurants
    useEffect(() => {
        if (restaurants[currentIndex]) {
            setShowDetailsMap(prev => ({
                ...prev,
                [restaurants[currentIndex]._id]: false
            }));
        }
    }, [currentIndex, restaurants]);

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

        // After the swipe animation completes, show the new card animation
        setTimeout(() => {
            setIsNewCard(true);
            setCurrentIndex(prev => prev + 1);
            setDragOffset(0);
            // Reset the new card state after animation completes
            setTimeout(() => setIsNewCard(false), 300);
        }, 300);
    };

    // Add toggleHours function (replace the existing one)
    const toggleHours = (restaurantId) => {
        setShowHoursMap(prev => ({
            ...prev,
            [restaurantId]: !prev[restaurantId]
        }));
    };

    const toggleDetails = (restaurantId) => {
        setShowDetailsMap(prev => ({
            ...prev,
            [restaurantId]: !prev[restaurantId]
        }));
    };

    const handleDragStart = (e) => {
        if (e.target.closest('.details-button') || e.target.closest('.hours-toggle')) return;
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
            // Swipe threshold met - complete the swipe
            const direction = dragOffset > 0 ? 1 : -1;
            const swipeDistance = window.innerWidth * 1.5;
            setDragOffset(direction * swipeDistance);
            
            // After the swipe animation completes, handle the vote
            setTimeout(() => {
                const vote = direction > 0;
                handleVote(vote);
            }, 300);
        } else {
            // Threshold not met - return to center
            setDragOffset(0);
        }
    };

    const handleVoteWithAnimation = (vote) => {
        if (!restaurants || !restaurants[currentIndex]) {
            console.log('No restaurant found at index:', currentIndex);
            return;
        }
        
        const restaurant = restaurants[currentIndex];
        if (!restaurant || !restaurant._id) {
            console.log('Invalid restaurant data:', restaurant);
            return;
        }
        
        const direction = vote ? 1 : -1;
        const swipeDistance = window.innerWidth * 1.5;
        setDragOffset(direction * swipeDistance);
        
        const userId = localStorage.getItem('userId');
        
        socket.emit('vote', {
            sessionId,
            userId,
            restaurantId: restaurant._id,
            vote
        });

        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setDragOffset(0);
            setIsNewCard(true);
            setTimeout(() => setIsNewCard(false), 300);
        }, 300);
    };

    // Add this effect to handle completion
    useEffect(() => {
        if (currentIndex >= restaurants.length) {
            console.log('User completed all restaurants');
        }
    }, [currentIndex, restaurants.length]);

    // First, check if we have a match
    if (matchFound) {
        return <Results topRestaurants={[matchFound]} isAbsoluteMatch={true} />;
    }

    // Second, check if all voting is complete (either with results or no matches)
    if (showResults) {
        return <Results topRestaurants={topRestaurants} />;
    }

    // Last, check if current user is waiting for others
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
                <div className="swipe-instructions">
                    Swipe <span className="like">right</span> or press <span className="like">✓</span> to indicate you like this restaurant,<br />
                    and swipe <span className="dislike">left</span> or press <span className="dislike">✗</span> to indicate you don't.
                </div>
                {/* Add swipe indicators */}
                <div 
                    className="swipe-overlay swipe-left"
                    style={{ 
                        opacity: dragOffset < 0 ? Math.min(Math.abs(dragOffset) / 100, 1) : 0 
                    }}
                >
                    <div className="swipe-icon">✗</div>
                </div>
                <div 
                    className="swipe-overlay swipe-right"
                    style={{ 
                        opacity: dragOffset > 0 ? Math.min(dragOffset / 100, 1) : 0 
                    }}
                >
                    <div className="swipe-icon">✓</div>
                </div>

                {/* Existing restaurant card */}
                <div 
                    className={`restaurant-card ${isNewCard ? 'new-card' : ''}`}
                    style={{ 
                        transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
                        transition: 'transform 0.3s ease-out'
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
                    <div className={`restaurant-basic-info ${showDetailsMap[currentRestaurant._id] ? 'hide' : ''}`}>
                        <div className="restaurant-info-left">
                            <h2>{currentRestaurant.name}</h2>
                            <div className="quick-info">
                                <div className="top-row">
                                    <span>⭐ {currentRestaurant.rating}</span>
                                    <span>{getCuisineEmoji(currentRestaurant.cuisine)} {currentRestaurant.cuisine}</span>
                                    <span>💵 {currentRestaurant.price}</span>
                                </div>
                                <div className="bottom-row">
                                    <span>🕒 {currentRestaurant.openStatus}</span>
                                    <span>🚶 {currentRestaurant.distance} miles</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="details-button" onClick={() => toggleDetails(currentRestaurant._id)}>
                        {showDetailsMap[currentRestaurant._id] ? 'Less Info ▼' : 'More Info ▲'}
                    </button>

                    <div className={`restaurant-details ${showDetailsMap[currentRestaurant._id] ? 'show' : ''}`}>
                        <h2>{currentRestaurant.name}</h2>
                        <div className="info-section">
                            <div className="info-tag">⭐ {currentRestaurant.rating}</div>
                            <div className="info-tag">💵 {currentRestaurant.price}</div>
                            <div className="info-tag">{getCuisineEmoji(currentRestaurant.cuisine)} {currentRestaurant.cuisine}</div>
                            <div className="info-tag">🚶 {currentRestaurant.distance} miles</div>
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
                                <button 
                                    className="info-tag hours-toggle" 
                                    onClick={() => toggleHours(currentRestaurant._id)}
                                    type="button"
                                >
                                    🕒 Hours {showHoursMap[currentRestaurant._id] ? '▼' : '▶'}
                                </button>
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
