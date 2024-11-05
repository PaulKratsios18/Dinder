const haversine = require('haversine');
const axios = require('axios');
require('dotenv').config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getGpsFromAddress(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await axios.get(url);

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function calculateDistance(location, endAddress) {
    if (!endAddress) {
        return -1;
    }

    try {
        const [lat1, lon1] = location.split(',').map(Number);
        const location2 = await getGpsFromAddress(endAddress);

        if (!location2) {
            return -1;
        }

        const start = { latitude: lat1, longitude: lon1 };
        const end = { latitude: location2.lat, longitude: location2.lng };

        const distance = haversine(start, end, { unit: 'mile' });
        return distance;
    } catch (error) {
        return -1;
    }
}

async function rankingAlgorithm(restaurants, preferencesArray, location) {
    const restaurantScores = [];
    const WEIGHTS = {
        price: 4,    // Most important
        distance: 3, // Second most important
        cuisine: 2,  // Third most important
        rating: 1    // Least important
    };

    for (const restaurant of restaurants) {
        let totalScore = 0;
        let distance = -1;

        // Calculate distance once for each restaurant
        distance = await calculateDistance(location, restaurant.Address);

        // Score for each user separately
        for (const preferences of preferencesArray) {
            let userScore = 0;  // Track each user's score separately

            // Rating Score (0 or 1 point)
            if (restaurant.Rating) {
                const ratingMatch = restaurant.Rating.match(/(\d+\.?\d*)/);
                if (ratingMatch) {
                    const rating = parseFloat(ratingMatch[1]);
                    if (!isNaN(rating) && rating >= preferences.Rating) {
                        userScore += WEIGHTS.rating;
                    }
                }
            }

            // Price Score (0 or 4 points)
            if (restaurant.Price && restaurant.Price !== 'N/A') {
                const priceLevel = (restaurant.Price.match(/💰/g) || []).length;
                if (priceLevel > 0 && 
                    priceLevel >= preferences.Price[0] && 
                    priceLevel <= preferences.Price[1]) {
                    userScore += WEIGHTS.price;
                }
            }

            // Distance Score (0 or 3 points)
            if (distance !== -1) {
                const maxDistanceMiles = preferences.Distance * 0.000621371;
                if (distance <= maxDistanceMiles) {
                    userScore += WEIGHTS.distance;
                }
            }

            // Cuisine Score (0 or 2 points)
            if (restaurant.Cuisine && preferences.Cuisines) {
                const restaurantCuisines = restaurant.Cuisine.toLowerCase();
                if (preferences.Cuisines.some(cuisine => 
                    restaurantCuisines.includes(cuisine.toLowerCase()))) {
                    userScore += WEIGHTS.cuisine;
                }
            }

            // Add this user's score to the total
            totalScore += userScore;
        }

        // Print score breakdown
        // console.log('\n=== Score Breakdown for', restaurant.Name, '===');
        // console.log('Total Score:', totalScore, `/${preferencesArray.length * 10}`);
        // console.log('Price:', restaurant.Price || 'N/A');
        // console.log('Rating:', restaurant.Rating || 'N/A');
        // console.log('Distance:', distance !== -1 ? `${distance.toFixed(1)} miles` : 'Unknown');
        // console.log('Cuisines:', restaurant.Cuisine || 'N/A');
        // console.log('----------------------------------------');

        // Push restaurant with its score and all original properties
        restaurantScores.push({
            ...restaurant,  // Spread all original restaurant properties
            score: totalScore,  // Add the score
            maxScore: preferencesArray.length * 10,  // Add the max possible score
            distance: distance !== -1 ? `${distance.toFixed(1)} miles` : 'Unknown'
        });
    }

    // Sort restaurants by score (highest to lowest)
    return restaurantScores.sort((a, b) => b.score - a.score);
}

module.exports = { rankingAlgorithm }; 