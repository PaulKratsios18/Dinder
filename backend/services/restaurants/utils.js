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

function consolidatePreferences(preferencesArray) {
    const userMap = new Map();
    
    for (const pref of preferencesArray) {
        if (!userMap.has(pref.Name)) {
            userMap.set(pref.Name, {
                Name: pref.Name,
                Cuisines: [pref.Cuisine],
                Price: pref.Price,
                Rating: pref.Rating,
                Distance: pref.Distance,
                Location: pref.Location
            });
        } else {
            const userPref = userMap.get(pref.Name);
            userPref.Cuisines.push(pref.Cuisine);
        }
    }
    
    return Array.from(userMap.values());
}

module.exports = {
    formatRestaurantForTemplate,
    consolidatePreferences
}; 