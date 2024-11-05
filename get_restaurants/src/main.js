require('dotenv').config();
const { getSessionPreferences } = require('./session_preferences');
const { getRestaurants } = require('./get_places_google');
const { rankingAlgorithm } = require('./ranking_algorithm');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { exec } = require('child_process');
const { connectToDatabase } = require('./utils/mongodb');

async function openBrowser(url) {
    const command = process.platform === 'win32' ? 'start' :
                   process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    return new Promise((resolve, reject) => {
        exec(`${command} "${url}"`, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

function formatRestaurantForTemplate(restaurantData) {
    // The restaurant data is already in the correct format, just need to rename some properties
    return {
        name: restaurantData.Name || 'Unknown Restaurant',
        rating: restaurantData.Rating || 'No rating',
        price: restaurantData.Price || 'Price not available',
        distance: restaurantData.distance || 'Distance unknown',
        cuisine: restaurantData.Cuisine || 'Cuisine unknown',
        address: restaurantData.Address || 'Address unknown',
        score: restaurantData.score || 0,
        maxScore: restaurantData.maxScore || 0,
        photo: restaurantData.Photos && restaurantData.Photos.length > 0 
            ? restaurantData.Photos[0] 
            : 'default-restaurant-image.jpg',
        openStatus: restaurantData.OpenStatus || 'Status unknown',
        wheelchairAccessible: restaurantData.WheelchairAccessible || 'Unknown'
    };
}

function consolidatePreferences(preferencesArray) {
    const userMap = new Map();

    for (const pref of preferencesArray) {
        if (!userMap.has(pref.Name)) {
            // Create new user entry with cuisines array
            userMap.set(pref.Name, {
                Name: pref.Name,
                Cuisines: [pref.Cuisine],
                Price: pref.Price,
                Rating: pref.Rating,
                Distance: pref.Distance,
                Location: pref.Location
            });
        } else {
            // Add cuisine to existing user's cuisines array
            const userPref = userMap.get(pref.Name);
            userPref.Cuisines.push(pref.Cuisine);
        }
    }

    return Array.from(userMap.values());
}

async function generateHTML(restaurants, sessionCode) {
    try {
        const outputDir = path.join(__dirname, '..', 'output');
        // Create output directory if it doesn't exist
        await fsPromises.mkdir(outputDir, { recursive: true });
        
        // Read the template file
        const templatePath = path.join(__dirname, '..', 'templates', 'results_template.html');
        let template = await fsPromises.readFile(templatePath, 'utf8');

        // Create the JavaScript data
        const jsData = `const rankedRestaurants = ${JSON.stringify(restaurants, null, 2)};`;

        // First replace the session code - make sure this happens before restaurantsData
        template = template.replace(/\{\{sessionCode\}\}/g, sessionCode);
        
        // Then replace the restaurants data
        template = template.replace('{{restaurantsData}}', jsData);

        // Write the file
        const outputPath = path.join(outputDir, `results_${sessionCode}.html`);
        await fsPromises.writeFile(outputPath, template);

        // Debug log to verify replacements
        console.log('Session code used:', sessionCode);
        console.log('First few chars of generated HTML:', template.substring(0, 200));

        return outputPath;
    } catch (error) {
        console.error('Error generating HTML:', error);
        throw error;
    }
}

async function getUserPreferencesFromDB(sessionCode) {
    const db = await connectToDatabase();
    const session = await db.collection('sessions').findOne({ session_id: sessionCode });
    
    if (!session || !session.participants || session.participants.length < 2) {
        throw new Error('Session not found or insufficient participants');
    }

    // Skip the first participant and only process those with preferences
    const participantsWithPreferences = session.participants
        .slice(1)  // Skip first participant
        .filter(p => p.preferences)
        .flatMap(participant => {
            const prefs = participant.preferences;
            
            // Convert price levels to numbers
            const priceMap = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
            const priceRange = [
                Math.min(...prefs.price.map(p => priceMap[p] || 1)),
                Math.max(...prefs.price.map(p => priceMap[p] || 4))
            ];

            return prefs.cuisine.map(cuisine => ({
                Name: participant.name,
                Cuisine: cuisine,
                Price: priceRange,
                Rating: Math.min(...prefs.rating.map(r => 
                    typeof r === 'object' ? r.$numberInt || r.$numberDouble : r
                )),
                Distance: prefs.distance && typeof prefs.distance === 'object' 
                    ? (prefs.distance.$numberInt || prefs.distance.$numberDouble) * 1609.34
                    : prefs.distance * 1609.34,
                Location: prefs.location
            }));
        });

    return participantsWithPreferences;
}

async function main(sessionCode) {
    try {
        console.log('\n=== Starting Dinder Restaurant Search ===\n');
        console.log(`Processing session code: ${sessionCode}`);

        if (!sessionCode) {
            throw new Error('Session code is required');
        }

        // Step 1: Get and aggregate preferences
        console.log('\n1. Getting and aggregating preferences...');
        const aggregatedPreferences = await getSessionPreferences(sessionCode);
        console.log('✓ Successfully aggregated preferences:');
        console.log(JSON.stringify(aggregatedPreferences, null, 2));

        // Step 2: Get restaurants from Google Places API
        console.log('\n2. Fetching restaurants from Google Places API...');
        const restaurants = await getRestaurants(
            aggregatedPreferences.location, 
            aggregatedPreferences.distance,
            aggregatedPreferences.cuisines
        );
        console.log('✓ Successfully fetched restaurants');
        
        // Save to file for reference
        fs.writeFileSync('exampleOutputGoogleAPI.json', JSON.stringify(restaurants, null, 2));

        // Deduplicate restaurants by name
        const uniqueRestaurants = Array.from(new Map(
            restaurants.map(restaurant => [restaurant.Name, restaurant])
        ).values());

        console.log(`Found ${uniqueRestaurants.length} unique restaurants after deduplication`);

        // Step 3: Rank restaurants
        console.log('\n3. Ranking restaurants...');
        console.log(`Found ${uniqueRestaurants.length} restaurants to rank`);
        
        // Get user preferences from MongoDB
        const userPreferences = await getUserPreferencesFromDB(sessionCode);
        const consolidatedPreferences = consolidatePreferences(userPreferences);
        const rankedRestaurants = await rankingAlgorithm(uniqueRestaurants, consolidatedPreferences, aggregatedPreferences.location);
        console.log('✓ Successfully ranked restaurants');

        // Format restaurants for template
        const formattedRestaurants = rankedRestaurants.map(restaurant => formatRestaurantForTemplate(restaurant));

        // Debug log
        console.log('First ranked restaurant:', rankedRestaurants[0]);
        console.log('First formatted restaurant:', formattedRestaurants[0]);

        // Generate and save the HTML
        const outputPath = await generateHTML(formattedRestaurants, sessionCode);
        console.log('✓ Saved ranked restaurants and generated HTML');

        // Open the results in the default browser
        const openCommand = process.platform === 'win32' ? 'start' : 
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
        require('child_process').exec(`${openCommand} ${outputPath}`);
        console.log('✓ Opened results in browser');

        return outputPath;
    } catch (error) {
        console.error('Error in main:', error);
        throw error;
    }
}

module.exports = { main };

if (require.main === module) {
    const sessionCode = process.argv[2];
    if (!sessionCode) {
        console.error('Session code is required as command line argument');
        process.exit(1);
    }

    main(sessionCode)
        .then(() => {
            console.log('Process completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Process failed:', error);
            process.exit(1);
        });
} 