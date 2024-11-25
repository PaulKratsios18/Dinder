const Vote = require('../../models/Vote');
const Session = require('../../models/Session');
const Restaurant = require('../../models/Restaurant');

async function handleVote(sessionId, userId, restaurantId, vote) {
    try {
        const session = await Session.findOne({ session_id: sessionId });
        const participant = session.participants.find(p => p.user_id === userId);
        
        if (!participant) {
            throw new Error('Unauthorized user attempting to vote');
        }

        console.log('Processing vote for:', {
            sessionId,
            userId,
            userName: participant.name,
            isHost: participant.isHost,
            restaurantId,
            vote
        });
        
        // Save the vote with explicit vote field
        const savedVote = await Vote.findOneAndUpdate(
            { 
                sessionId, 
                userId,
                restaurantId 
            },
            { 
                $set: {
                    vote: vote,
                    timestamp: new Date(),
                    sessionId,
                    userId,
                    restaurantId
                }
            },
            { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true
            }
        );

        // Get all votes for this restaurant (both positive and negative)
        const allVotesForRestaurant = await Vote.find({
            sessionId,
            restaurantId
        });

        // Get all positive votes for this restaurant
        const positiveVotes = allVotesForRestaurant.filter(v => v.vote === true);

        // Get total number of actual participants
        const totalParticipants = session.participants.length;

        const isMatch = positiveVotes.length === totalParticipants && totalParticipants > 0;

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
                yes: positiveVotes.length,
                total: totalParticipants
            }
        };

    } catch (error) {
        console.error('Error in handleVote:', error);
        throw error;
    }
}

module.exports = { handleVote };
