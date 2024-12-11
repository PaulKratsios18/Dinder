require('dotenv').config();
const fs = require('fs');
const { connectToDatabase } = require('./utils/mongodb');
const { aggregatePreferences } = require('./preference_aggregator');

/**
 * Retrieves session preferences from the database
 * @param {string} sessionCode - ID of the session
 * @returns {Object} Aggregated preferences object
 */
async function getSessionPreferences(sessionCode) {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    console.log('DB Name:', process.env.DB_NAME);
    
    const db = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    console.log('Searching for session with ID:', sessionCode);
    const session = await db.collection('sessions').findOne({ sessionId: sessionCode });
    console.log('Found session:', session);
    
    if (!session || !session.participants || session.participants.length === 0) {
        throw new Error('Session not found or has no participants');
    }

    // Filter participants with valid preferences
    const participantsWithPreferences = session.participants.filter(p => 
        p.preferences && 
        p.preferences.price && 
        p.preferences.cuisine && 
        p.preferences.rating && 
        p.preferences.distance
    );

    if (participantsWithPreferences.length === 0) {
        throw new Error('No participants have set their preferences yet');
    }

    // Log participants with preferences
    console.log('Participants with preferences:', participantsWithPreferences);

    // Get location from first participant with preferences
    const firstParticipant = participantsWithPreferences[0];
    let location;
    if (firstParticipant.preferences.location && typeof firstParticipant.preferences.location === 'object') {
        location = `${firstParticipant.preferences.location.lat},${firstParticipant.preferences.location.lng}`;
    } else {
        location = '42.7284,-73.6918'; // Default to Troy, NY
    }

    // Transform only participants with valid preferences
    const preferences = participantsWithPreferences.flatMap(participant => {
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

    // Log transformed preferences
    console.log('Transformed preferences:', preferences);

    // Aggregate preferences
    const aggregatedOptions = {
        ...aggregatePreferences(preferences),
        location
    };

    // Log aggregated preferences
    console.log('Aggregated preferences:', aggregatedOptions);

    // Write preferences to input file
    fs.writeFileSync('exampleInputGoogleAPI.json', JSON.stringify(preferences, null, 2));

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