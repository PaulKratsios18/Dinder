/**
 * Aggregates preferences from multiple users into a single set of criteria
 * @param {Array} preferences - Array of user preferences
 * @returns {Object} Aggregated preferences object
 */
function aggregatePreferences(preferences) {
    // Use location from the first preference as the reference point
    const location = preferences[0].Location;

    // Validate location data structure
    if (!location || typeof location !== 'object') {
        throw new Error('Invalid location data');
    }

    // Find the maximum acceptable distance among all users
    // This ensures we include restaurants within reach of all users
    const distance = Math.max(...preferences.map(pref => pref.Distance));

    // Find the inclusive range of price preferences
    // This creates a price range that satisfies all users' constraints
    const minPrice = Math.min(...preferences.map(pref => pref.Price[0]));
    const maxPrice = Math.max(...preferences.map(pref => pref.Price[1]));

    // Find the minimum acceptable rating across all users
    // This ensures we meet everyone's quality standards
    const rating = Math.min(...preferences.map(pref => pref.Rating));

    // Collect all unique cuisines that users are interested in
    const cuisines = [...new Set(preferences.map(pref => pref.Cuisine))];
    
    return {
        location,
        distance,
        price: [minPrice, maxPrice],
        rating,
        cuisines
    };
}

module.exports = { aggregatePreferences }; 