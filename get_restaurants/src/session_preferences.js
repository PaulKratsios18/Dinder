require('dotenv').config();
const fs = require('fs');
const { connectToDatabase } = require('./utils/mongodb');
const { aggregatePreferences } = require('./preference_aggregator');

async function getSessionPreferences(sessionCode) {
    const db = await connectToDatabase();
    
    // Find session by code
    const session = await db.collection('sessions').findOne({ code: sessionCode });
    
    if (!session || !session.participants || session.participants.length === 0) {
        throw new Error('Session not found or has no participants');
    }

    // Get host (first participant)
    const host = session.participants[0];
    if (!host) {
        throw new Error('Host not found');
    }

    // Get location from host's preferences
    let location;
    if (host.preferences.location && typeof host.preferences.location === 'object') {
        location = `${host.preferences.location.lat},${host.preferences.location.lng}`;
    } else {
        // If no location is set, use a default location (Troy, NY)
        location = '42.7284,-73.6918';
    }

    // Transform participants' preferences
    const preferences = session.participants.flatMap(participant => {
        const prefs = participant.preferences;
        
        // Convert price levels to numbers
        const priceMap = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
        const priceRange = [
            Math.min(...prefs.price.map(p => priceMap[p] || 1)),
            Math.max(...prefs.price.map(p => priceMap[p] || 4))
        ];

        // Get the minimum rating from user's rating array
        const minRating = Math.min(...prefs.rating.map(r => 
            typeof r === 'object' ? r.$numberInt || r.$numberDouble : r
        ));

        // Get distance value (properly handling MongoDB number format)
        const distance = prefs.distance && typeof prefs.distance === 'object' 
            ? (prefs.distance.$numberInt || prefs.distance.$numberDouble) * 1609.34  // Convert miles to meters
            : prefs.distance * 1609.34;

        // Create an entry for each cuisine
        return prefs.cuisine.map(cuisine => ({
            Name: participant.name,
            Cuisine: cuisine,
            Price: priceRange,
            Rating: minRating,
            Distance: distance,
            Location: location
        }));
    });

    // Write preferences to input file
    fs.writeFileSync('exampleInputGoogleAPI.json', JSON.stringify(preferences, null, 2));

    // Aggregate preferences
    const aggregatedOptions = {
        ...aggregatePreferences(preferences),
        location
    };

    // Write aggregated preferences
    fs.writeFileSync('aggregated_preferences.json', JSON.stringify(aggregatedOptions, null, 2));

    return aggregatedOptions;
}

// Only run if called directly
if (require.main === module) {
    const sessionCode = process.argv[2];
    if (!sessionCode) {
        console.error('Please provide a session code as an argument');
        process.exit(1);
    }

    getSessionPreferences(sessionCode)
        .then(result => {
            console.log('Aggregated preferences:', result);
        })
        .catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
        })
        .finally(() => {
            process.exit();
        });
}

module.exports = { getSessionPreferences }; 