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

    if (matchFound) {
        return (
            <div className="match-overlay">
                <h2>It's a Match! 🎉</h2>
                <h3>{matchFound.restaurantName}</h3>
                <p>{matchFound.address}</p>
                <p>Rating: {matchFound.rating}</p>
                <img src={matchFound.photo} alt={matchFound.restaurantName} />
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
            <div className="restaurant-card">
                <img 
                    src={currentRestaurant.photo} 
                    alt={currentRestaurant.name} 
                    className="restaurant-image"
                />
                <div className="restaurant-info">
                    <h2>{currentRestaurant.name}</h2>
                    <p><strong>Rating:</strong> {currentRestaurant.rating} ⭐</p>
                    <p><strong>Price:</strong> {currentRestaurant.price}</p>
                    <p><strong>Cuisine:</strong> {currentRestaurant.cuisine}</p>
                    <p><strong>Address:</strong> {currentRestaurant.address}</p>
                    {currentRestaurant.openStatus !== 'Unknown' && (
                        <p><strong>Hours:</strong> {currentRestaurant.openStatus}</p>
                    )}
                    {currentRestaurant.wheelchairAccessible !== 'Unknown' && (
                        <p><strong>Accessibility:</strong> {currentRestaurant.wheelchairAccessible === 'Yes' ? '♿ Accessible' : 'Not wheelchair accessible'}</p>
                    )}
                    <p><strong>Distance:</strong> {currentRestaurant.distance} km</p>
                </div>
            </div>

            <div className="vote-buttons">
                <button onClick={() => handleVote(false)} className="vote-no">✗</button>
                <button onClick={() => handleVote(true)} className="vote-yes">✓</button>
            </div>
        </div>
    );
};

export default RestaurantSwiper;
