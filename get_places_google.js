require('dotenv').config();

(async () => {
    const fetch = (await import('node-fetch')).default;
    const fs = require('fs');
  
    async function getNearbyRestaurants(options = {}) {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const location = options.location;
        const radius = options.distance || 5000;
        const type = 'restaurant';
        const minPrice = options.price ? options.price[0] : '';
        const maxPrice = options.price ? options.price[1] : '';
        const rating = options.rating || '';

        const allRestaurants = new Set();

        // Make an API call for each cuisine
        for (const cuisine of options.cuisines) {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&keyword=${cuisine}&minprice=${minPrice}&maxprice=${maxPrice}&key=${apiKey}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                for (const place of data.results) {
                    if (!rating || place.rating >= rating) {
                        // Get additional details like address components and photos
                        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,price_level,photos,types&key=${apiKey}`;
                        const detailsResponse = await fetch(detailsUrl);
                        const detailsData = await detailsResponse.json();

                        const details = detailsData.result;

                        // Get up to 5 photos
                        const photos = details.photos ? details.photos.slice(0, 5).map(photo => 
                            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
                        ) : ['N/A'];

                        const cuisine = details.types ? details.types.filter(type => type !== 'restaurant').join(', ') : 'N/A';
                        const price = details.price_level ? '$'.repeat(details.price_level) : 'N/A';

                        allRestaurants.add(JSON.stringify({
                            Name: details.name,
                            Photos: photos,
                            Address: details.formatted_address,
                            Rating: details.rating,
                            Price: price,
                            Cuisine: cuisine
                        }));
                    }
                }
            } catch (error) {
                console.error(`Error fetching places for cuisine ${cuisine}:`, error);
            }
        }

        const restaurants = Array.from(allRestaurants).map(restaurant => JSON.parse(restaurant));
        fs.writeFileSync('exampleOutputGoogleAPI.json', JSON.stringify(restaurants, null, 2));
    }
  
    console.log('Script started');

    // Check if API key exists
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set');
        return;
    }

    try {
        // Read preferences from JSON file
        const preferences = JSON.parse(fs.readFileSync('aggregated_preferences.json', 'utf8'));
        console.log('Loaded preferences:', preferences);

        await getNearbyRestaurants(preferences);
    } catch (error) {
        console.error('Top level error:', error);
    }
  })();
  