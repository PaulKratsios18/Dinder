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
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Join the session room
        newSocket.emit('joinRoom', { 
            sessionId, 
            userId: localStorage.getItem('userId') 
        });

        // Listen for vote updates
        newSocket.on('voteUpdate', (data) => {
            console.log('Vote update received:', data);
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
        if (matchFound) {
            console.log('Match already found, no more voting allowed');
            return;
        }

        if (currentIndex >= restaurants.length) {
            console.log('No more restaurants to vote on');
            return;
        }

        const restaurant = restaurants[currentIndex];
        
        socket.emit('submitVote', {
            sessionId,
            userId: localStorage.getItem('userId'),
            restaurantId: restaurant.id,
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
                        👍 {votes[currentRestaurant.id]?.yes || 0} / {votes[currentRestaurant.id]?.totalParticipants || '?'}
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
