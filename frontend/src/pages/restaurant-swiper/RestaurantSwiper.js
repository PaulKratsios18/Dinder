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

    useEffect(() => {
        // Fetch restaurants
        const fetchRestaurants = async () => {
            const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}/ranked-restaurants`);
            const data = await response.json();
            if (data.success) {
                setRestaurants(data.restaurants);
            }
        };

        // Setup socket connection
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('joinRoom', { 
            sessionId, 
            userId: localStorage.getItem('userId') 
        });

        newSocket.on('voteUpdate', ({ restaurantId, votes }) => {
            setVotes(prev => ({
                ...prev,
                [restaurantId]: votes
            }));
        });

        fetchRestaurants();

        return () => newSocket.close();
    }, [sessionId]);

    const handleVote = async (vote) => {
        if (currentIndex >= restaurants.length) return;

        const restaurant = restaurants[currentIndex];
        
        socket.emit('submitVote', {
            sessionId,
            userId: localStorage.getItem('userId'),
            restaurantId: restaurant.id,
            vote
        });

        setCurrentIndex(prev => prev + 1);
    };

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
                        👍 {votes[currentRestaurant.id]?.yes || 0}
                        👎 {votes[currentRestaurant.id]?.no || 0}
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
