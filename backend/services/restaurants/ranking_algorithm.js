const haversine = require('haversine');
require('dotenv').config();

async function calculateDistance(startLocation, restaurant) {
    if (!startLocation || !restaurant.Location) {
        console.error('Invalid start location or restaurant location');
        return -1;
    }

    try {
        if (typeof startLocation === 'object' && startLocation.lat && startLocation.lng) {
            startLocation = `${startLocation.lat},${startLocation.lng}`;
        }

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

function getPriceLevel(priceString) {
    if (!priceString) return 1;
    
    // Handle different price formats
    if (typeof priceString === 'number') return priceString;
    if (priceString.includes('💰')) {
        return priceString.split('💰').length - 1;
    }
    if (priceString.includes('$')) {
        return priceString.split('$').length - 1;
    }
    
    // Try to extract number from string like "💰 ($11-30)"
    const match = priceString.match(/\$(\d+)-(\d+)/);
    if (match) {
        const avgPrice = (parseInt(match[1]) + parseInt(match[2])) / 2;
        if (avgPrice <= 15) return 1;
        if (avgPrice <= 30) return 2;
        if (avgPrice <= 60) return 3;
        return 4;
    }
    
    return 1; // default price level
}

async function rankingAlgorithm(restaurants, preferencesArray, location) {
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

    for (const restaurant of restaurants) {
        let totalScore = 0;
        let distance = await calculateDistance(location, restaurant);

        // Score for each user separately
        for (const preferences of preferencesArray) {
            let userScore = 0;

            // Price score
            if (restaurant.Price && preferences.price) {
                const priceLevel = getPriceLevel(restaurant.Price);
                const preferredPrice = Array.isArray(preferences.price) 
                    ? preferences.price[0] 
                    : preferences.price;
                userScore += WEIGHTS.price * (1 - Math.abs(priceLevel - preferredPrice) / 4);
            }

            // Distance score
            if (distance >= 0) {
                const maxDistance = preferences.distance || 5000;
                userScore += WEIGHTS.distance * (1 - Math.min(distance / maxDistance, 1));
            }

            // Cuisine score
            if (restaurant.Cuisine && preferences.cuisines) {
                const restaurantCuisines = restaurant.Cuisine.toLowerCase().split(',').map(c => c.trim());
                const preferredCuisines = preferences.cuisines.map(c => c.toLowerCase());
                const matchingCuisines = restaurantCuisines.filter(c => preferredCuisines.includes(c));
                userScore += WEIGHTS.cuisine * (matchingCuisines.length / preferredCuisines.length);
            }

            // Rating score
            if (restaurant.Rating) {
                const ratingMatch = restaurant.Rating.match(/(\d+(\.\d+)?)/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
                const minRating = Array.isArray(preferences.rating) 
                    ? preferences.rating[0] 
                    : preferences.rating || 3;
                userScore += WEIGHTS.rating * Math.max(0, (rating - minRating) / 2);
            }

            totalScore += userScore;
        }

        // Ensure valid score
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