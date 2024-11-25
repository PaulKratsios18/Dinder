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
        
        // Log the constructed URL
        const keywordQuery = cuisines.join('|');
        const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=${keywordQuery}&key=${apiKey}`;
        console.log('Constructed Places Nearby Search URL:', searchUrl);
        
        console.log('Making Places Nearby Search API request');
        const searchResponse = await axios.get(searchUrl);
        
        // Log the API response
        console.log('Nearby Search API response:', searchResponse.data);
        
        if (!searchResponse.data.results) {
            console.log('No results from Nearby Search');
            return [];
        }

        console.log(`Found ${searchResponse.data.results.length} initial results`);

        // Second API call - Get Details for each place
        const detailedPlaces = await Promise.all(
            searchResponse.data.results.map(async (place) => {
                try {
                    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,price_level,formatted_address,photos,wheelchair_accessible_entrance,opening_hours&key=${apiKey}`;
                    
                    console.log(`Fetching details for ${place.name}`);
                    const detailsResponse = await axios.get(detailsUrl);
                    const details = detailsResponse.data.result;

                    function formatOpeningStatus(openingHours) {
                        if (!openingHours) return 'Hours not available';
                        
                        const now = new Date();
                        const isOpen = openingHours.open_now;
                        
                        if (isOpen) {
                            return 'Open now';
                        } else {
                            // Find next opening time from periods
                            if (openingHours.periods) {
                                const today = now.getDay();
                                const currentTime = now.getHours() * 100 + now.getMinutes();
                                
                                for (let i = 0; i < 7; i++) {
                                    const checkDay = (today + i) % 7;
                                    const period = openingHours.periods.find(p => p.open.day === checkDay);
                                    
                                    if (period) {
                                        if (i === 0) {
                                            return `Opens at ${period.open.time.replace(/(\d{2})(\d{2})/, '$1:$2')}`;
                                        } else {
                                            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                            return `Opens ${days[checkDay]} at ${period.open.time.replace(/(\d{2})(\d{2})/, '$1:$2')}`;
                                        }
                                    }
                                }
                            }
                            return 'Closed';
                        }
                    }

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
                        openStatus: formatOpeningStatus(details.opening_hours),
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
                        OpenStatus: place.openingHours || 'Unknown',
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