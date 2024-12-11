/**
 * Formats restaurant data for template rendering
 * @param {Object} restaurantData - Raw restaurant data
 * @returns {Object} Formatted restaurant object with default values
 */
function formatRestaurantForTemplate(restaurantData) {
    return {
        name: restaurantData.Name || 'Unknown Restaurant',
        rating: restaurantData.Rating || 'No rating',
        price: restaurantData.Price || 'Price not available',
        distance: restaurantData.distance || 'Distance unknown',
        cuisine: restaurantData.Cuisine || 'Cuisine unknown',
        address: restaurantData.Address || 'Address unknown',
        score: restaurantData.score || 0,
        maxScore: restaurantData.maxScore || 0,
        photo: restaurantData.Photos && restaurantData.Photos.length > 0 
            ? restaurantData.Photos[0] 
            : 'default-restaurant.jpg',
        openStatus: restaurantData.openStatus || 'Status unknown',
        wheelchairAccessible: restaurantData.WheelchairAccessible || 'Unknown',
        reviewCount: restaurantData.ReviewCount || 0
    };
}

/**
 * Consolidates multiple user preferences into a single array
 * @param {Array} preferencesArray - Array of user preferences
 * @returns {Array} Consolidated preferences grouped by user
 */
function consolidatePreferences(preferencesArray) {
    // Use Map to store unique user preferences
    const userMap = new Map();
    
    // Process each preference
    for (const pref of preferencesArray) {
        if (!userMap.has(pref.Name)) {
            // Create new entry for user
            userMap.set(pref.Name, {
                Name: pref.Name,
                Cuisines: [pref.Cuisine],
                Price: pref.Price,
                Rating: pref.Rating,
                Distance: pref.Distance,
                Location: pref.Location
            });
        } else {
            // Add additional cuisines to existing user
            const userPref = userMap.get(pref.Name);
            userPref.Cuisines.push(pref.Cuisine);
        }
    }
    
    // Convert Map to array and return
    return Array.from(userMap.values());
}

module.exports = {
    formatRestaurantForTemplate,
    consolidatePreferences
}; 