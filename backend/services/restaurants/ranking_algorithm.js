const haversine = require('haversine');
require('dotenv').config();

/**
 * Calculates the distance between two points using the Haversine formula
 * @param {string|Object} startLocation - Starting location coordinates
 * @param {Object} restaurant - Restaurant object containing location data
 * @returns {number} Distance in miles, or -1 if calculation fails
 */
async function calculateDistance(startLocation, restaurant) {
    if (!startLocation || !restaurant.Location) {
        console.error('Invalid start location or restaurant location');
        return -1;
    }

    try {
        // Convert object format to string format if needed
        if (typeof startLocation === 'object' && startLocation.lat && startLocation.lng) {
            startLocation = `${startLocation.lat},${startLocation.lng}`;
        }

        // Parse coordinates and calculate distance
        const [lat1, lon1] = startLocation.split(',').map(Number);
        const start = { latitude: lat1, longitude: lon1 };
        const end = { 
            latitude: restaurant.Location.lat, 
            longitude: restaurant.Location.lng 
        };

        const distance = haversine(start, end, { unit: 'mile' });
        console.log(`Calculated distance from ${startLocation} to ${restaurant.Name}: ${distance} miles`);
        return distance;
    } catch (error) {
        console.error('Error calculating distance:', error.message);
        return -1;
    }
}

/**
 * Converts various price level formats to a standardized 1-4 scale
 * @param {string|number} priceString - Price level indicator
 * @returns {number} Standardized price level (1-4)
 */
function getPriceLevel(priceString) {
    if (!priceString) return 1;
    
    // Handle numeric input
    if (typeof priceString === 'number') return priceString;
    
    // Handle emoji format
    if (priceString.includes('💰')) {
        return priceString.split('💰').length - 1;
    }
    
    // Handle dollar sign format
    if (priceString.includes('$')) {
        return priceString.split('$').length - 1;
    }
    
    // Handle price range format (e.g., "$11-30")
    const match = priceString.match(/\$(\d+)-(\d+)/);
    if (match) {
        const avgPrice = (parseInt(match[1]) + parseInt(match[2])) / 2;
        if (avgPrice <= 15) return 1;
        if (avgPrice <= 30) return 2;
        if (avgPrice <= 60) return 3;
        return 4;
    }
    
    return 1;
}

/**
 * Ranks restaurants based on user preferences
 * @param {Array} restaurants - Array of restaurant objects
 * @param {Array} preferencesArray - Array of user preferences
 * @param {string|Object} location - Reference location
 * @returns {Array} Ranked restaurants with scores
 */
async function rankingAlgorithm(restaurants, preferencesArray, location) {
    // Input validation
    if (!restaurants || !preferencesArray || !location) {
        console.error('Missing required parameters for ranking algorithm');
        return restaurants;
    }

    console.log('Starting ranking algorithm with:', {
        restaurantsCount: restaurants.length,
        preferencesCount: preferencesArray.length,
        location
    });

    const restaurantScores = [];
    const WEIGHTS = {
        price: 4,
        distance: 3,
        cuisine: 2,
        rating: 1
    };

    // Calculate scores for each restaurant
    for (const restaurant of restaurants) {
        let totalScore = 0;
        let distance = await calculateDistance(location, restaurant);

        // Score for each user's preferences
        for (const preferences of preferencesArray) {
            let userScore = 0;

            // Calculate price score
            if (restaurant.Price && preferences.price) {
                const priceLevel = getPriceLevel(restaurant.Price);
                const preferredPrice = Array.isArray(preferences.price) 
                    ? preferences.price[0] 
                    : preferences.price;

                if (preferredPrice === 'no preference' || priceLevel <= preferredPrice) {
                    userScore += WEIGHTS.price;
                } else {
                    userScore += WEIGHTS.price * (1 - Math.abs(priceLevel - preferredPrice) / 4);
                }
            }

            // Calculate distance score
            if (distance >= 0) {
                const maxDistance = preferences.distance === 'no preference' ? Infinity : preferences.distance || 5000;
                userScore += WEIGHTS.distance * (1 - Math.min(distance / maxDistance, 1));
            }

            // Calculate cuisine score
            if (restaurant.Cuisine && preferences.cuisines) {
                const restaurantCuisines = restaurant.Cuisine.toLowerCase().split(',').map(c => c.trim());
                const preferredCuisines = preferences.cuisines.includes('no preference') 
                    ? restaurantCuisines 
                    : preferences.cuisines.map(c => c.toLowerCase());
                const matchingCuisines = restaurantCuisines.filter(c => preferredCuisines.includes(c));
                userScore += WEIGHTS.cuisine * (matchingCuisines.length / preferredCuisines.length);
            }

            // Calculate rating score
            if (restaurant.Rating) {
                const ratingMatch = restaurant.Rating.match(/(\d+(\.\d+)?)/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
                const minRating = Array.isArray(preferences.rating) 
                    ? preferences.rating[0] 
                    : preferences.rating || 3;
                if (minRating === 'no preference') {
                    userScore += WEIGHTS.rating;
                } else {
                    userScore += WEIGHTS.rating * Math.max(0, (rating - minRating) / 2);
                }
            }

            totalScore += userScore;
        }

        // Calculate and validate final score
        const averageScore = totalScore / (preferencesArray.length || 1);
        const finalScore = isNaN(averageScore) ? 0 : parseFloat(averageScore.toFixed(2));
        
        console.log(`Final score for ${restaurant.Name}: ${finalScore}`);
        
        restaurantScores.push({
            ...restaurant,
            score: finalScore,
            distance: typeof distance === 'number' ? distance.toFixed(1) : 'Unknown'
        });
    }

    // Sort by score descending
    restaurantScores.sort((a, b) => b.score - a.score);
    
    console.log(`Ranked ${restaurantScores.length} restaurants`);
    return restaurantScores;
}

module.exports = { rankingAlgorithm }; 