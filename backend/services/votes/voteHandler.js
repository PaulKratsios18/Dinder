const Vote = require('../../models/Vote');
const Session = require('../../models/Session');
const Restaurant = require('../../models/Restaurant');

/**
 * Handles user votes for restaurants and determines matches
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {string} restaurantId - Restaurant identifier
 * @param {boolean} vote - User's vote (true for like, false for dislike)
 * @returns {Promise<Object>} Vote results and match status
 */
async function handleVote(sessionId, userId, restaurantId, vote) {
    try {
        // Find session and save/update vote
        const session = await Session.findOne({ session_id: sessionId });
        const savedVote = await Vote.findOneAndUpdate(
            { sessionId, userId, restaurantId },
            { vote: vote, timestamp: new Date() },
            { upsert: true, new: true }
        );

        // Get vote counts for current restaurant
        const restaurantVotes = await Vote.find({ sessionId, restaurantId });
        const totalParticipants = session.participants.length;

        // Check for immediate match (all participants voted yes)
        const positiveVotes = restaurantVotes.filter(v => v.vote === true).length;
        if (positiveVotes === totalParticipants) {
            // Update session status and return match data
            await Session.findOneAndUpdate(
                { session_id: sessionId },
                { status: 'completed' }
            );

            const matchedRestaurant = await Restaurant.findById(restaurantId);
            return {
                success: true,
                isMatch: true,
                showResults: false,
                matchData: {
                    restaurantName: matchedRestaurant.name,
                    address: matchedRestaurant.address,
                    rating: matchedRestaurant.rating,
                    photo: matchedRestaurant.photo
                }
            };
        }

        // Get all restaurants and votes for session
        const allSessionRestaurants = await Restaurant.find({ sessionId });
        const totalRestaurants = allSessionRestaurants.length;
        const allVotes = await Vote.find({ sessionId });

        // Track votes per user
        const votesPerUser = new Map();
        allVotes.forEach(vote => {
            const key = vote.userId;
            votesPerUser.set(key, (votesPerUser.get(key) || 0) + 1);
        });

        // Check if all users have voted on all restaurants
        const allVotingComplete = session.participants.every(participant => 
            votesPerUser.get(participant.user_id) === totalRestaurants
        );

        // Log voting progress
        console.log('Vote tracking:', {
            totalParticipants,
            totalRestaurants: allSessionRestaurants.length,
            votesPerUser: Object.fromEntries(votesPerUser),
            allVotingComplete
        });

        if (allVotingComplete) {
            // Update session status when all voting is complete
            await Session.findOneAndUpdate(
                { session_id: sessionId },
                { status: 'completed' }
            );

            // Aggregate votes and find restaurants with >50% positive votes
            const restaurantVotes = await Vote.aggregate([
                { $match: { sessionId: sessionId } },
                { $group: {
                    _id: '$restaurantId',
                    positiveVotes: {
                        $sum: { $cond: [{ $eq: ['$vote', true] }, 1, 0] }
                    },
                    totalVotes: { $sum: 1 }
                }},
                { $match: { 
                    positiveVotes: { $gte: Math.ceil(totalParticipants / 2) }
                }},
                { $sort: { positiveVotes: -1 } },
                { $limit: 3 }
            ]);

            // Get detailed information for top restaurants
            const topRestaurants = restaurantVotes.length > 0 ? 
                await Restaurant.find({
                    _id: { $in: restaurantVotes.map(r => r._id) }
                }).then(restaurants => restaurants.map(rest => ({
                    ...rest.toObject(),
                    positiveVotes: restaurantVotes.find(r => 
                        r._id.toString() === rest._id.toString()
                    ).positiveVotes,
                    totalParticipants: session.participants.length
                }))) : [];

            return {
                success: true,
                isMatch: false,
                showResults: true,
                topRestaurants: topRestaurants
            };
        }

        // Calculate current restaurant vote status
        const allVotesForRestaurant = await Vote.find({ sessionId, restaurantId });
        const positiveVotesCount = allVotesForRestaurant.filter(v => v.vote === true).length;

        return {
            success: true,
            isMatch: false,
            showResults: false,
            votes: {
                yes: positiveVotesCount,
                total: totalParticipants
            }
        };
    } catch (error) {
        console.error('Error in handleVote:', error);
        throw error;
    }
}

module.exports = { handleVote };
