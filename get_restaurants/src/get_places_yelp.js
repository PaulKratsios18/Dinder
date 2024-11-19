const axios = require('axios');
require('dotenv').config();

const YELP_API_KEY = process.env.YELP_API_KEY;
if (!YELP_API_KEY) {
    throw new Error('YELP_API_KEY is not set in environment variables');
}

async function getRestaurants(location, radius = 1000, cuisines = ['restaurant']) {
    try {
        const allRestaurants = new Set();
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        const radiusMeters = Math.min(radius, 40000); // Yelp's max radius is 40000 meters

        // Search for each cuisine type
        for (const cuisine of cuisines) {
            console.log(`\nSearching for ${cuisine} restaurants...`);
            
            try {
                const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
                    headers: {
                        'Authorization': `Bearer ${YELP_API_KEY}`
                    },
                    params: {
                        latitude: lat,
                        longitude: lng,
                        radius: radiusMeters,
                        categories: 'restaurants',
                        term: cuisine,
                        limit: 50,
                        sort_by: 'distance'
                    }
                });

                const prevTotal = allRestaurants.size;

                // Process results
                for (const business of response.data.businesses) {
                    try {
                        // Get detailed business info
                        const detailsResponse = await axios.get(
                            `https://api.yelp.com/v3/businesses/${business.id}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${YELP_API_KEY}`
                                }
                            }
                        );

                        const details = detailsResponse.data;

                        // Format price level
                        const priceRanges = {
                            '$': '💰 ($11-30)',
                            '$$': '💰💰 ($31-60)',
                            '$$$': '💰💰💰 ($61-100)',
                            '$$$$': '💰💰💰💰 ($100+)'
                        };
                        const price = details.price ? priceRanges[details.price] : 'N/A';

                        // Format hours
                        let openStatus = 'N/A';
                        let nextChange = '';
                        if (details.hours && details.hours[0]) {
                            const isOpen = details.hours[0].is_open_now;
                            openStatus = isOpen ? '✅ Open' : '❌ Closed';
                            
                            if (details.hours[0].open) {
                                // Format hours logic here (simplified for brevity)
                                const today = new Date().getDay();
                                const todayHours = details.hours[0].open.find(h => h.day === today);
                                if (todayHours) {
                                    const closeTime = formatTime(todayHours.end);
                                    nextChange = isOpen ? ` (Closes today at ${closeTime})` : '';
                                }
                            }
                        }

                        allRestaurants.add(JSON.stringify({
                            Name: details.name,
                            Photos: details.photos || [],
                            Rating: `${details.rating || 'N/A'} (${details.review_count || 0} reviews)`,
                            Price: price,
                            Cuisine: details.categories.map(c => c.title).join(', '),
                            Address: details.location.display_address.join(', '),
                            Location: {
                                lat: details.coordinates.latitude,
                                lng: details.coordinates.longitude
                            },
                            OpenStatus: `${openStatus}${nextChange}`,
                            WheelchairAccessible: details.is_wheelchair_accessible ? '♿ Yes' : '♿ No'
                        }));

                    } catch (detailsError) {
                        console.error(`Error fetching details for ${business.name}:`, detailsError.message);
                    }
                }

                const uniqueNew = allRestaurants.size - prevTotal;
                console.log(`Found ${response.data.businesses.length} results (${uniqueNew} new unique)`);

            } catch (error) {
                console.error(`Error fetching places for cuisine ${cuisine}:`, error.message);
            }
        }

        return Array.from(allRestaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error.message);
        return [];
    }
} 