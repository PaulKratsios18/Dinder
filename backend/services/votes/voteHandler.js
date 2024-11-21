const Vote = require('../../models/Vote');
const Session = require('../../models/Session');
const Restaurant = require('../../models/Restaurant');

async function handleVote(sessionId, userId, restaurantId, vote) {
    try {
        const session = await Session.findOne({ session_id: sessionId });
        console.log('Found session:', {
            sessionId,
            participantsCount: session.participants.length,
            participants: session.participants.map(p => p.name)
        });
        
        // Save the vote with explicit vote field
        const savedVote = await Vote.findOneAndUpdate(
            { sessionId, userId, restaurantId },
            { vote: vote, timestamp: new Date() },
            { upsert: true, new: true }
        );
        console.log('Saved vote:', {
            userId,
            restaurantId,
            vote: savedVote.vote
        });

        // Get all positive votes for this restaurant
        const allVotes = await Vote.find({
            sessionId,
            restaurantId,
            vote: true
        });
        console.log('All positive votes for restaurant:', {
            restaurantId,
            positiveVotesCount: allVotes.length,
            votes: allVotes.map(v => ({userId: v.userId, vote: v.vote}))
        });

        // Get total number of actual participants
        const totalParticipants = session.participants.length;
        console.log('Match check:', {
            positiveVotes: allVotes.length,
            totalParticipants,
            isMatch: allVotes.length === totalParticipants && totalParticipants > 0
        });

        // Check if we have a match
        const isMatch = allVotes.length === totalParticipants && totalParticipants > 0;

        let matchData = null;
        if (isMatch) {
            console.log('MATCH FOUND! Fetching restaurant details...');
            const restaurant = await Restaurant.findOne({ _id: restaurantId });
            console.log('Restaurant details:', restaurant);
            
            matchData = {
                restaurantId,
                restaurantName: restaurant.name,
                address: restaurant.address,
                photo: restaurant.photo,
                rating: restaurant.rating
            };

            // Save match to session
            session.matchedRestaurant = matchData;
            await session.save();
            console.log('Match saved to session:', matchData);
        }

        return {
            success: true,
            isMatch,
            matchData,
            votes: {
                yes: allVotes.length,
                total: totalParticipants
            }
        };

    } catch (error) {
        console.error('Error in handleVote:', error);
        throw error;
    }
}

module.exports = { handleVote };
