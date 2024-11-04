require('dotenv').config(); // For environment variables
const axios = require('axios');
const haversine = require('haversine');

// Load the API key from the .env file
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Function to get GPS coordinates from address
async function getGpsFromAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await axios.get(url);

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Error in geocoding:', error.message);
    return null;
  }
}

// Ranking algorithm
async function rankingAlgorithm(restaurants, preferences, location) {
  const restaurantScores = [];

  for (const restaurant of restaurants) {
    let totalScore = 0;
    const restaurantPrice = restaurant.Price.length;
    const restaurantDistance = await calculateDistance(location, restaurant.Address);

    for (const user of preferences) {
      let priceScore = 0, distanceScore = 0, cuisineScore = 0, ratingScore = 0;

      if (restaurantPrice >= user.Price[0] && restaurantPrice <= user.Price[1]) {
        priceScore = 4;
      }

      if (restaurantDistance === -1) {
        distanceScore = 0;
      } else if (restaurantDistance <= (user.Distance * 0.000621371)) { // convert meters to miles
        distanceScore = 3;
      }

      if (restaurant.Cuisine.includes(user.Cuisine)) {
        cuisineScore = 2;
      }

      if (parseFloat(restaurant.Rating) >= user.Rating) {
        ratingScore = 1;
      }

      totalScore += priceScore + distanceScore + cuisineScore + ratingScore;
    }

    restaurantScores.push({ restaurant, totalScore });
  }

  // Sort restaurants based on total score in descending order
  const sortedRestaurants = restaurantScores.sort((a, b) => b.totalScore - a.totalScore);

  sortedRestaurants.forEach(({ restaurant, totalScore }) => {
    console.log(restaurant.Name, totalScore);
  });

  return sortedRestaurants;
}

// Function to calculate distance between two locations
async function calculateDistance(location, endAddress) {
  // Clean the address if it contains '#'
  if (endAddress.includes('#')) {
    const temp = endAddress.split(' ').filter(str => !str.includes('#'));
    endAddress = temp.join(' ');
  }

  const [lat1, lon1] = location.split(',').map(Number);

  try {
    const location2 = await getGpsFromAddress(endAddress);

    if (!location2) {
      return -1;
    }

    // Calculate distance using the haversine formula
    const start = { latitude: lat1, longitude: lon1 };
    const end = { latitude: location2.lat, longitude: location2.lng };

    const distance = haversine(start, end, { unit: 'mile' });
    return distance;
  } catch (error) {
    console.error('Error in calculating distance:', error.message);
    return -1;
  }
}

// Main function to load data and execute ranking algorithm
async function main() {
  const fs = require('fs');

  const restaurants = JSON.parse(fs.readFileSync('exampleOutputGoogleAPI.json', 'utf8'));
  const preferences = JSON.parse(fs.readFileSync('exampleInputGoogleAPI.json', 'utf8'));
  const location = '42.7284,-73.6918';

  const rankedRestaurants = await rankingAlgorithm(restaurants, preferences, location);
  
  // Save the ranked results
  fs.writeFileSync('ranked_restaurants.json', JSON.stringify(rankedRestaurants, null, 2));
}

// Run the main function
main();
