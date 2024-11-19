import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import './RestaurantSwiper.css';

const RestaurantSwiper = ({ sessionCode, userName }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [socket, setSocket] = useState(null);
  const [votingStarted, setVotingStarted] = useState(false);
  const [votes, setVotes] = useState({});

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join the session room
    newSocket.emit('joinSession', { roomCode: sessionCode, userName });

    // Listen for voting to start
    newSocket.on('votingStarted', ({ restaurants }) => {
      setRestaurants(restaurants);
      setVotingStarted(true);
    });

    // Listen for vote updates
    newSocket.on('voteUpdate', ({ restaurantId, votes }) => {
      setVotes(prev => ({
        ...prev,
        [restaurantId]: votes
      }));
    });

    return () => {
      newSocket.close();
    };
  }, [sessionCode, userName]);

  const handleSwipe = async (direction) => {
    if (!votingStarted || currentIndex >= restaurants.length) return;

    setDirection(direction);
    const restaurant = restaurants[currentIndex];
    
    // Emit vote to server
    socket.emit('submitVote', {
      roomCode: sessionCode,
      restaurantId: restaurant.id,
      vote: direction === 'right'
    });

    // Move to next restaurant
    setCurrentIndex(prev => prev + 1);
  };

  if (!votingStarted) {
    return <div className="swiper-loading">Waiting for session to start...</div>;
  }

  if (currentIndex >= restaurants.length) {
    return <div className="swiper-complete">Voting Complete!</div>;
  }

  return (
    <div className="swiper-container">
      <div className="votes-display">
        Current votes for this restaurant:
        {votes[restaurants[currentIndex]?.id] && (
          <div>
            👍 {votes[restaurants[currentIndex].id].yes || 0}
            👎 {votes[restaurants[currentIndex].id].no || 0}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          className="restaurant-card"
          initial={{ x: 0, opacity: 1 }}
          exit={{
            x: direction === 'left' ? -300 : 300,
            opacity: 0,
            transition: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.x < -100) handleSwipe('left');
            if (offset.x > 100) handleSwipe('right');
          }}
        >
          <img 
            src={restaurants[currentIndex].photo} 
            alt={restaurants[currentIndex].name}
            className="restaurant-image"
          />
          <div className="restaurant-info">
            <h2>{restaurants[currentIndex].name}</h2>
            <p className="rating">Rating: {restaurants[currentIndex].rating}</p>
            <p className="price">Price: {restaurants[currentIndex].price}</p>
            <p className="cuisine">Cuisine: {restaurants[currentIndex].cuisine}</p>
            <p className="distance">Distance: {restaurants[currentIndex].distance}</p>
            <p className="status">{restaurants[currentIndex].openStatus}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="swipe-buttons">
        <button onClick={() => handleSwipe('left')} className="swipe-button left">
          ✗
        </button>
        <button onClick={() => handleSwipe('right')} className="swipe-button right">
          ♥
        </button>
      </div>
    </div>
  );
};

export default RestaurantSwiper;
