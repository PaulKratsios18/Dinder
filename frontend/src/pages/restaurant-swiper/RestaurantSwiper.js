import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './RestaurantSwiper.css';

const RestaurantSwiper = () => {
    const { sessionId } = useParams();
    const [restaurants, setRestaurants] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [votes, setVotes] = useState({});
    const [socket, setSocket] = useState(null);
    const [matchFound, setMatchFound] = useState(null);

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

    if (currentIndex >= restaurants.length) {
        return <div className="voting-complete">Voting Complete!</div>;
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
                    <p>Rating: {currentRestaurant.rating}</p>
                    <p>Price: {currentRestaurant.price}</p>
                    <p>Cuisine: {currentRestaurant.cuisine}</p>
                    <p>Distance: {currentRestaurant.distance}</p>
                    
                    <div className="vote-count">
                        👍 {votes[currentRestaurant._id]?.yes || 0} / {votes[currentRestaurant._id]?.total || '?'}
                    </div>
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
