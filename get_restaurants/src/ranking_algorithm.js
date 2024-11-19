const haversine = require('haversine');
require('dotenv').config();

async function calculateDistance(startLocation, restaurant) {
    if (!restaurant.Location) {
        return -1;
    }

    try {
        const [lat1, lon1] = startLocation.split(',').map(Number);
        const start = { latitude: lat1, longitude: lon1 };
        const end = { 
            latitude: restaurant.Location.lat, 
            longitude: restaurant.Location.lng 
        };

        const distance = haversine(start, end, { unit: 'mile' });
        return distance;
    } catch (error) {
        return -1;
    }
}

async function rankingAlgorithm(restaurants, preferencesArray, location) {
    const restaurantScores = [];
    const WEIGHTS = {
        price: 4,
        distance: 3,
        cuisine: 2,
        rating: 1
    };

    for (const restaurant of restaurants) {
        let totalScore = 0;
        let distance = -1;

        // Calculate distance using stored coordinates
        distance = await calculateDistance(location, restaurant);

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