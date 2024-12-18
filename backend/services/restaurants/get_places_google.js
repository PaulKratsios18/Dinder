const axios = require('axios');
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Fetches restaurant data from Google Places API
 * @param {Object} location - Location coordinates {lat, lng}
 * @param {number} radius - Search radius in meters (default: 5000)
 * @param {string[]} cuisines - Array of cuisine types (default: ['restaurant'])
 * @returns {Promise<Array>} Array of restaurant objects
 */
async function getRestaurants(location, radius = 5000, cuisines = ['restaurant']) {
    try {
        // Log input parameters for debugging
        console.log('getRestaurants called with:', {
            location: location,
            radius: radius,
            cuisines: cuisines
        });

        // Extract coordinates from location object
        const lat = location.lat;
        const lng = location.lng;
        
        // Construct and log the Google Places API URL
        const keywordQuery = cuisines.join('|');
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=${keywordQuery}&key=${apiKey}`;
        console.log('Constructed Places Nearby Search URL:', searchUrl);
        
        // Make initial API request for nearby places
        console.log('Making Places Nearby Search API request');
        const searchResponse = await axios.get(searchUrl);
        console.log('Nearby Search API response:', searchResponse.data);
        
        // Return empty array if no results found
        if (!searchResponse.data.results) {
            console.log('No results from Nearby Search');
            return [];
        }

        console.log(`Found ${searchResponse.data.results.length} initial results`);

        // Fetch detailed information for each place
        const detailedPlaces = await Promise.all(
            searchResponse.data.results.map(async (place) => {
                try {
                    // Construct URL for place details
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,price_level,formatted_address,photos,wheelchair_accessible_entrance,opening_hours&key=${apiKey}`;
                    
                    console.log(`Fetching details for ${place.name}`);
                    const detailsResponse = await axios.get(detailsUrl);
                    const details = detailsResponse.data.result;

                    // Format and return restaurant details
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
                        WheelchairAccessible: details.wheelchair_accessible_entrance ? 'Yes' : 'Unknown',
                        Location: {
                            lat: place.geometry.location.lat,
                            lng: place.geometry.location.lng
                        },
                        PlaceId: place.place_id,
                        OpeningHours: details.opening_hours?.weekday_text || [],
                        OpenStatus: details.opening_hours ? 
                            (details.opening_hours.open_now ? 'Open now' : 'Closed') : 
                            'Hours not available'
                    };
                } catch (error) {
                    console.error(`Error fetching details for ${place.name}:`, error.message);
                    return {
                        Name: place.name,
                        Rating: place.rating?.toString() || 'No rating',
                        Price: place.price_level ? '$'.repeat(place.price_level) : '$',
                        Cuisine: cuisines[0],
                        Address: place.vicinity || 'Address unknown',
                        Photos: ['default-restaurant.jpg'],
                        OpeningHours: [],
                        OpenStatus: 'Hours not available',
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
        console.error('Error fetching restaurants:', error.message);
        return [];
    }
}

module.exports = { getRestaurants }; 