require('dotenv').config(); // For environment variables
const axios = require('axios');

// Load the API key from the .env file
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getGpsFromAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await axios.get(url);

    // Check if results exist
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Error in geocoding:', error.message);
  }
}

// Example usage
(async () => {
  const address = '1600 Pennsylvania Ave NW, Washington, DC 20500'; // Example address
  const gpsCoordinates = await getGpsFromAddress(address);
  if (gpsCoordinates) {
    console.log('Latitude:', gpsCoordinates.latitude);
    console.log('Longitude:', gpsCoordinates.longitude);
  }
})();
