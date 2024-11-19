function aggregatePreferences(preferences) {
    // Use location from the first preference
    const location = preferences[0].Location;

    // Find the maximum distance among all users
    const distance = Math.max(...preferences.map(pref => pref.Distance));

    // Find the inclusive range of price preferences
    const minPrice = Math.min(...preferences.map(pref => pref.Price[0]));
    const maxPrice = Math.max(...preferences.map(pref => pref.Price[1]));

    // Find the minimum rating across all users
    const rating = Math.min(...preferences.map(pref => pref.Rating));

    // Collect all unique cuisines
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