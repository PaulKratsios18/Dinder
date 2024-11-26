const Vote = require('../../models/Vote');
const Session = require('../../models/Session');
const Restaurant = require('../../models/Restaurant');

async function handleVote(sessionId, userId, restaurantId, vote) {
    try {
        const session = await Session.findOne({ session_id: sessionId });
        const savedVote = await Vote.findOneAndUpdate(
            { sessionId, userId, restaurantId },
            { vote: vote, timestamp: new Date() },
            { upsert: true, new: true }
        );

        // Get all votes for this restaurant
        const restaurantVotes = await Vote.find({ sessionId, restaurantId });
        const totalParticipants = session.participants.length;

        // Check for immediate match (all participants voted yes)
        const positiveVotes = restaurantVotes.filter(v => v.vote === true).length;
        if (positiveVotes === totalParticipants) {
            // Update session status to complete when match is found
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

        // Get all restaurants for this session
        const allSessionRestaurants = await Restaurant.find({ sessionId });
        const totalRestaurants = allSessionRestaurants.length;

        // Get all votes for this session
        const allVotes = await Vote.find({ sessionId });

        // Check if all users have voted on all restaurants
        const votesPerUser = new Map();
        allVotes.forEach(vote => {
            const key = vote.userId;
            votesPerUser.set(key, (votesPerUser.get(key) || 0) + 1);
        });

        // All users have voted on all restaurants when each user has totalRestaurants votes
        const allVotingComplete = session.participants.every(participant => 
            votesPerUser.get(participant.user_id) === totalRestaurants
        );

        console.log('Vote tracking:', {
            totalParticipants,
            totalRestaurants: allSessionRestaurants.length,
            votesPerUser: Object.fromEntries(votesPerUser),
            allVotingComplete
        });

        if (allVotingComplete) {
            // Update session status to complete when showing results
            await Session.findOneAndUpdate(
                { session_id: sessionId },
                { status: 'completed' }
            );

            // Get restaurants with >50% positive votes
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

            if (restaurantVotes.length > 0) {
                const topRestaurants = await Restaurant.find({
                    _id: { $in: restaurantVotes.map(r => r._id) }
                });

                return {
                    success: true,
                    isMatch: false,
                    showResults: true,
                    topRestaurants: topRestaurants.map(rest => ({
                        ...rest.toObject(),
                        positiveVotes: restaurantVotes.find(r => 
                            r._id.toString() === rest._id.toString()
                        ).positiveVotes,
                        totalParticipants: session.participants.length,
                        openingHours: rest.openingHours,
                        openStatus: rest.openStatus
                    }))
                };
            }
        }

        // Calculate votes for current restaurant
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
