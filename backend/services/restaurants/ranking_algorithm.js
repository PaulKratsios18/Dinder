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

async function rankingAlgorithm(restaurants, preferencesArray, userLocation) {
    const WEIGHTS = {
        distance: 0.3,
        rating: 0.3,
        price: 0.2,
        cuisine: 0.2
    };

    const restaurantScores = [];

    for (const restaurant of restaurants) {
        let totalScore = 0;
        const calculatedDistance = await calculateDistance(userLocation, restaurant.Location);
        
        for (const preferences of preferencesArray) {
            let userScore = 0;

            // Distance score (0-1)
            const maxDistance = preferences.preferences.distance || 5; // 5 miles default
            const distanceScore = calculatedDistance >= 0 ? Math.max(0, 1 - (calculatedDistance / maxDistance)) : 0;
            userScore += WEIGHTS.distance * distanceScore;

            // Rating score (0-1)
            if (restaurant.Rating) {
                const rating = parseFloat(restaurant.Rating);
                const minRating = preferences.preferences.rating?.[0] || 3;
                const ratingScore = Math.max(0, (rating - minRating) / (5 - minRating));
                userScore += WEIGHTS.rating * ratingScore;
            }

            // Price score (0-1)
            if (restaurant.Price) {
                const priceLevel = restaurant.Price.length; // Number of $ signs
                const maxPreferredPrice = preferences.preferences.price?.[0]?.length || 2;
                const priceScore = priceLevel <= maxPreferredPrice ? 1 : 0;
                userScore += WEIGHTS.price * priceScore;
            }

            // Cuisine score (0-1)
            if (restaurant.Cuisine && preferences.preferences.cuisine) {
                const restaurantCuisines = restaurant.Cuisine.toLowerCase().split(',').map(c => c.trim());
                const preferredCuisines = preferences.preferences.cuisine.map(c => c.toLowerCase());
                const cuisineMatch = restaurantCuisines.some(c => preferredCuisines.includes(c));
                userScore += WEIGHTS.cuisine * (cuisineMatch ? 1 : 0);
            }

            totalScore += userScore;
        }

        const finalScore = totalScore / (preferencesArray.length || 1);
        
        restaurantScores.push({
            ...restaurant,
            score: parseFloat(finalScore.toFixed(2)),
            distance: typeof calculatedDistance === 'number' ? calculatedDistance.toFixed(1) : 'Unknown'
        });

        console.log(`Scored restaurant: ${restaurant.Name}`);
        console.log(`- Distance: ${calculatedDistance.toFixed(1)} km`);
        console.log(`- Rating: ${restaurant.Rating}`);
        console.log(`- Price: ${restaurant.Price}`);
        console.log(`- Final Score: ${finalScore.toFixed(2)}`);
    }

    return restaurantScores.sort((a, b) => b.score - a.score);
}

module.exports = { rankingAlgorithm }; 