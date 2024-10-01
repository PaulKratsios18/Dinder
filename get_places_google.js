// PLEASE DO NOT RUN THIS WITHOUT ASKING PAUL
// MY PERSONAL GOOGLE API IS ON THIS FILE WHICH CHARGES MY PERSONAL BANK ACCOUNT

(async () => {
    const fetch = (await import('node-fetch')).default;
  
    async function getNearbyRestaurants(options = {}) {
      const apiKey = 'PERSONAL_API_KEY';
      const location = options.location; // Example: Troy, NY
      const radius = options.distance || 5000;
      const type = 'restaurant';
      const keyword = options.cuisine || '';
      const minPrice = options.price ? options.price[0] : '';
      const maxPrice = options.price ? options.price[1] : '';
      const rating = options.rating || '';
  
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&keyword=${keyword}&minprice=${minPrice}&maxprice=${maxPrice}&key=${apiKey}`;
  
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
  
            console.log('---');
            console.log(`Name: ${details.name}`);
            console.log('Images:');
            photos.forEach((photo, index) => {
              console.log(`  Photo ${index + 1}: ${photo}`);
            });
            console.log(`Address: ${details.formatted_address}`);
            console.log(`Rating: ${details.rating}`);
            console.log(`Price: ${price}`);
            console.log(`Cuisine: ${cuisine}`);
          }
        }
      } catch (error) {
        console.error('Error fetching places:', error);
      }
    }
  
    const options = {
      location: '42.7284,-73.6918',
      distance: 11500, // Maximum distance in meters
      price: [2, 3], // Min and Max Price. Levels -> [1,2,3,4]
      rating: 4, // Minimum rating [0.0-5.0]
      cuisine: 'Italian', // Type of cuisine [Any cuisine, American, Barbecue, Chinese, French, Hamburger, Indian, Italian, Japanese, Mexican, Pizza, Seafood, Steak, Sushi, Thai]
    };
  
    getNearbyRestaurants(options);
  })();
  