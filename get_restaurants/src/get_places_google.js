const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables');
}

async function getRestaurants(location, radius = 1000, cuisines = ['restaurant']) {
    try {
        const allRestaurants = new Map();
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        
        const keywordQuery = cuisines.join('|');
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=${keywordQuery}&key=${apiKey}`;
        
        const searchResponse = await axios.get(searchUrl);
        if (!searchResponse.data.results) return [];

        const batchSize = 10;
        const places = searchResponse.data.results;
        
        for (let i = 0; i < places.length; i += batchSize) {
            const batch = places.slice(i, i + batchSize);
            const detailsPromises = batch.map(place => {
                const fields = [
                    'name',
                    'formatted_address',
                    'rating',
                    'price_level',
                    'photos',
                    'types',
                    'business_status',
                    'user_ratings_total',
                    'wheelchair_accessible_entrance',
                    'current_opening_hours',
                ].join(',');
                
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=${fields}&key=${apiKey}`;
                return axios.get(detailsUrl);
            });

            const responses = await Promise.all(detailsPromises);
            
            responses.forEach((response, index) => {
                const details = response.data.result;
                const place = batch[index];
                
                if (!details) return;

                const restaurantData = formatRestaurantData(details, place, apiKey);
                
                allRestaurants.set(place.place_id, restaurantData);
            });
        }

        return Array.from(allRestaurants.values());

    } catch (error) {
        console.error('Error fetching restaurants:', error.message);
        throw error;
    }
}

function formatRestaurantData(details, place, apiKey) {
    const priceRanges = {
        0: '💰 ($0-10)',
        1: '💰 ($11-30)',
        2: '💰💰 ($31-60)',
        3: '💰💰💰 ($61-100)',
        4: '💰💰💰💰 ($100+)'
    };
    const price = details.price_level !== undefined ? priceRanges[details.price_level] : 'N/A';

    const { openStatus, nextChange } = formatOpeningHours(details.current_opening_hours);

    const photoUrls = details.photos && details.photos.length > 0 ? 
        [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${details.photos[0].photo_reference}&key=${apiKey}`] 
        : [];

    const cuisineType = formatCuisineTypes(details.types);

    return {
        Name: details.name,
        Photos: photoUrls,
        Rating: `${details.rating || 'N/A'} (${details.user_ratings_total || 0} reviews)`,
        Price: price,
        Cuisine: cuisineType,
        Address: details.formatted_address,
        Location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
        },
        OpenStatus: `${openStatus}${nextChange}`,
        WheelchairAccessible: details.wheelchair_accessible_entrance ? '♿ Yes' : '♿ No',
    };
}

module.exports = { getRestaurants }; 