const axios = require('axios');
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

async function getRestaurants(location, radius = 5000, cuisines = ['restaurant']) {
    try {
        console.log('getRestaurants called with:', {
            location: location,
            radius: radius,
            cuisines: cuisines
        });

        // Use location object directly
        const lat = location.lat;
        const lng = location.lng;
        
        // First API call - Nearby Search
        const keywordQuery = cuisines.join('|');
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=${keywordQuery}&key=${apiKey}`;
        
        console.log('Making Places Nearby Search API request');
        const searchResponse = await axios.get(searchUrl);
        
        if (!searchResponse.data.results) {
            console.log('No results from Nearby Search');
            return [];
        }

        console.log(`Found ${searchResponse.data.results.length} initial results`);

        // Second API call - Get Details for each place
        const detailedPlaces = await Promise.all(
            searchResponse.data.results.map(async (place) => {
                try {
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,price_level,formatted_address,photos,business_status,wheelchair_accessible_entrance,opening_hours&key=${apiKey}`;
                    
                    console.log(`Fetching details for ${place.name}`);
                    const detailsResponse = await axios.get(detailsUrl);
                    const details = detailsResponse.data.result;

                    return {
                        Name: details.name || place.name,
                        Rating: details.rating?.toString() || place.rating?.toString() || 'No rating',
                        Price: details.price_level ? '$'.repeat(details.price_level) : '$',
                        Cuisine: cuisines[0],
                        Address: details.formatted_address || place.vicinity || 'Address unknown',
                        Photos: details.photos ? 
                            details.photos.map(photo => 
                                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
                            ) : 
                            ['default-restaurant.jpg'],
                        OpenStatus: details.business_status || place.business_status || 'Unknown',
                        WheelchairAccessible: details.wheelchair_accessible_entrance ? 'Yes' : 'Unknown',
                        Location: {
                            lat: place.geometry.location.lat,
                            lng: place.geometry.location.lng
                        },
                        PlaceId: place.place_id,
                        OpeningHours: details.opening_hours?.weekday_text || []
                    };
                } catch (error) {
                    console.error(`Error fetching details for ${place.name}:`, error.message);
                    // Return basic place info if details fetch fails
                    return {
                        Name: place.name,
                        Rating: place.rating?.toString() || 'No rating',
                        Price: place.price_level ? '$'.repeat(place.price_level) : '$',
                        Cuisine: cuisines[0],
                        Address: place.vicinity || 'Address unknown',
                        Photos: ['default-restaurant.jpg'],
                        OpenStatus: place.business_status || 'Unknown',
                        WheelchairAccessible: 'Unknown',
                        Location: {
                            lat: place.geometry.location.lat,
                            lng: place.geometry.location.lng
                        },
                        PlaceId: place.place_id
                    };
                }
            })
        );

        console.log(`Successfully fetched details for ${detailedPlaces.length} restaurants`);
        return detailedPlaces;

    } catch (error) {
        console.error('Error fetching restaurants:', error);
        return [];
    }
}

module.exports = { getRestaurants }; 