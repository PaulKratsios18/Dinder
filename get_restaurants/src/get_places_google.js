const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables');
}

async function getRestaurants(location, radius = 1000, cuisines = ['restaurant']) {
    try {
        const allRestaurants = new Set();
        
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        
        // Search for each cuisine type
        for (const cuisine of cuisines) {
            console.log(`\nSearching for ${cuisine} restaurants...`);
            
            const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&keyword=${cuisine}&key=${apiKey}`;
            
            try {
                const searchResponse = await axios.get(searchUrl);
                if (!searchResponse.data.results) continue;

                const prevTotal = allRestaurants.size;
                
                // Process results
                for (const place of searchResponse.data.results) {
                    try {
                        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,price_level,photos,types,business_status,user_ratings_total,wheelchair_accessible_entrance,current_opening_hours,price_level&key=${apiKey}`;
                        const detailsResponse = await axios.get(detailsUrl);
                        const details = detailsResponse.data.result;

                        // If price_level is missing but we have a place_id, try to get it from a Maps search
                        let priceLevel = details.price_level;
                        if (priceLevel === undefined && place.place_id) {
                            try {
                                // Make a separate request to get price level
                                const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=price_level&key=${apiKey}`;
                                const placeResponse = await axios.get(placeUrl);
                                if (placeResponse.data.result && placeResponse.data.result.price_level !== undefined) {
                                    priceLevel = placeResponse.data.result.price_level;
                                }
                            } catch (priceError) {
                                console.debug(`Could not fetch price for ${details.name}`);
                            }
                        }

                        // Format price level with dollar range
                        const priceRanges = {
                            0: '💰 ($0-10)',
                            1: '💰 ($11-30)',
                            2: '💰💰 ($31-60)',
                            3: '💰💰💰 ($61-100)',
                            4: '💰💰💰💰 ($100+)'
                        };
                        const price = priceLevel !== undefined ? priceRanges[priceLevel] : 'N/A';

                        // Handle opening hours
                        let openStatus = 'N/A';
                        let nextChange = '';
                        if (details.current_opening_hours) {
                            const isOpen = details.current_opening_hours.open_now;
                            openStatus = isOpen ? '✅ Open' : '❌ Closed';
                            
                            if (details.current_opening_hours.periods) {
                                const now = new Date();
                                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                const today = now.getDay();
                                
                                if (isOpen) {
                                    // Find today's closing time
                                    const todayPeriod = details.current_opening_hours.periods.find(period => 
                                        period.open && period.open.day === today
                                    );
                                    
                                    if (todayPeriod && todayPeriod.close) {
                                        const closeTime = todayPeriod.close.time;
                                        const formattedTime = formatTime(closeTime);
                                        nextChange = ` (Closes today at ${formattedTime})`;
                                    }
                                } else {
                                    // Find next opening time
                                    let nextDay = today;
                                    let daysChecked = 0;
                                    let foundNextOpen = false;
                                    
                                    while (!foundNextOpen && daysChecked < 7) {
                                        const nextPeriod = details.current_opening_hours.periods.find(period => 
                                            period.open && period.open.day === nextDay
                                        );
                                        
                                        if (nextPeriod) {
                                            const openTime = nextPeriod.open.time;
                                            const formattedTime = formatTime(openTime);
                                            const dayName = nextDay === today ? 'today' : 
                                                  nextDay === (today + 1) % 7 ? 'tomorrow' : 
                                                  days[nextDay];
                                            nextChange = ` (Opens ${dayName} at ${formattedTime})`;
                                            foundNextOpen = true;
                                        } else {
                                            nextDay = (nextDay + 1) % 7;
                                            daysChecked++;
                                        }
                                    }
                                    
                                    if (!foundNextOpen) {
                                        nextChange = ' (Opening hours unavailable)';
                                    }
                                }
                            }
                        }

                        // Helper function to format time from "0000" to "12:00 AM" format
                        function formatTime(time) {
                            const hour = parseInt(time.substring(0, 2));
                            const minute = time.substring(2);
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const formattedHour = hour % 12 || 12;
                            return `${formattedHour}:${minute} ${period}`;
                        }

                        // Format photos
                        const photoUrls = details.photos ? 
                            details.photos.slice(0, 5).map(photo => 
                                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
                            ) : [];

                        // Better cuisine type handling
                        let cuisineType = details.types ? 
                            details.types.filter(type => 
                                ![
                                    'food', 'point_of_interest', 
                                    'establishment', 'meal_takeaway', 'meal_delivery',
                                    'store', 'business'
                                ].includes(type)
                            )
                            .map(type => type.replace(/_/g, ' '))  // Replace underscores with spaces
                            .map(type => type.split(' ')  // Capitalize each word
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' '))
                            .join(', ') : '';

                        // Add the search keyword if it's not already in the cuisine type
                        const searchCuisine = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
                        if (!cuisineType) {
                            cuisineType = searchCuisine;
                        } else if (!cuisineType.includes(searchCuisine)) {
                            cuisineType = `${cuisineType}, ${searchCuisine}`;
                        }

                        // If cuisineType is still empty, use the search cuisine
                        if (!cuisineType) {
                            cuisineType = searchCuisine;
                        }

                        allRestaurants.add(JSON.stringify({
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
                        }));

                    } catch (detailsError) {
                        console.error(`Error fetching details for ${place.name}:`, detailsError.message);
                    }
                }

                const uniqueNew = allRestaurants.size - prevTotal;
                console.log(`Found ${searchResponse.data.results.length} results (${uniqueNew} new unique)`);

            } catch (error) {
                console.error(`Error fetching places for cuisine ${cuisine}:`, error.message);
            }
        }

        const restaurantsArray = Array.from(allRestaurants).map(jsonStr => JSON.parse(jsonStr));
        console.log(`\n✓ Found ${restaurantsArray.length} total unique restaurants`);
        
        return restaurantsArray;

    } catch (error) {
        console.error('Error fetching restaurants:', error.message);
        throw error;
    }
}

module.exports = { getRestaurants }; 