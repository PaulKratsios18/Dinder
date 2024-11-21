const haversine = require('haversine');
require('dotenv').config();

async function calculateDistance(startLocation, endLocation) {
    try {
        console.log('Calculating distance between:', {
            start: startLocation,
            end: endLocation
        });

        // Extract coordinates, handling different location object structures
        const start = {
            lat: startLocation.lat || startLocation.latitude,
            lng: startLocation.lng || startLocation.longitude
        };
        
        const end = {
            lat: endLocation.Location?.lat || endLocation.lat,
            lng: endLocation.Location?.lng || endLocation.lng
        };

        if (!start.lat || !start.lng || !end.lat || !end.lng) {
            console.error('Invalid coordinates:', { start, end });
            return -1;
        }

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = toRad(end.lat - start.lat);
        const dLon = toRad(end.lng - start.lng);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        console.log(`Calculated distance: ${distance.toFixed(2)} km`);
        return distance;
    } catch (error) {
        console.error('Error in calculateDistance:', error);
        return -1; // Return -1 for invalid distances
    }
}

// Helper function to convert degrees to radians
function toRad(degrees) {
    return degrees * (Math.PI / 180);
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
            if (restaurant.Price && preferences.preferences.price) {
                const priceLevel = getPriceLevel(restaurant.Price);
                const preferredPrice = Array.isArray(preferences.preferences.price) 
                    ? preferences.preferences.price[0] 
                    : preferences.preferences.price;
                userScore += WEIGHTS.price * (1 - Math.abs(priceLevel - preferredPrice) / 4);
            }

            // Distance score
            if (distance >= 0) {
                const maxDistance = preferences.preferences.distance || 5000;
                userScore += WEIGHTS.distance * (1 - Math.min(distance / maxDistance, 1));
            }

            // Cuisine score
            if (restaurant.Cuisine && preferences.preferences.cuisines) {
                const restaurantCuisines = restaurant.Cuisine.toLowerCase().split(',').map(c => c.trim());
                const preferredCuisines = preferences.preferences.cuisines.map(c => c.toLowerCase());
                const matchingCuisines = restaurantCuisines.filter(c => preferredCuisines.includes(c));
                userScore += WEIGHTS.cuisine * (matchingCuisines.length / preferredCuisines.length);
            }

            // Rating score
            if (restaurant.Rating) {
                const ratingMatch = restaurant.Rating.match(/(\d+(\.\d+)?)/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
                const minRating = Array.isArray(preferences.preferences.rating) 
                    ? preferences.preferences.rating[0] 
                    : preferences.preferences.rating || 3;
                userScore += WEIGHTS.rating * Math.max(0, (rating - minRating) / 2);
            }

            totalScore += userScore;
        }

        // Ensure valid score
        const averageScore = totalScore / (preferencesArray.length || 1);
        const finalScore = isNaN(averageScore) ? 0 : parseFloat(averageScore.toFixed(2));
        
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