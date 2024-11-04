const fs = require('fs');

function aggregatePreferences(preferences) {
    // Start with base location (assuming all users share the same location)
    const location = '42.7284,-73.6918'; // Troy, NY coordinates

    // Find the maximum distance among all users
    const distance = Math.max(...preferences.map(pref => pref.Distance));

    // Find the inclusive range of price preferences
    const minPrice = Math.min(...preferences.map(pref => pref.Price[0]));
    const maxPrice = Math.max(...preferences.map(pref => pref.Price[1]));

    // Find the minimum rating (to be inclusive of all preferences)
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

function main() {
    try {
        // Read preferences from JSON file
        const preferences = JSON.parse(fs.readFileSync('exampleInputGoogleAPI.json', 'utf8'));
        console.log('Loaded preferences:', preferences);

        // Aggregate preferences
        const aggregatedOptions = aggregatePreferences(preferences);
        console.log('Aggregated options:', aggregatedOptions);

        // Write aggregated preferences to a new JSON file
        fs.writeFileSync('aggregated_preferences.json', JSON.stringify(aggregatedOptions, null, 2));
        
        console.log('Aggregated preferences saved to aggregated_preferences.json');
    } catch (error) {
        console.error('Error in preference aggregation:', error);
    }
}

// Run if this file is being run directly
if (require.main === module) {
    main();
}

module.exports = {
    aggregatePreferences
}; 