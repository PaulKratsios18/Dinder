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
            // Update session status and emit match event
            await Session.findOneAndUpdate(
                { session_id: sessionId },
                { status: 'completed' }
            );

            const matchedRestaurant = await Restaurant.findById(restaurantId);
            const matchData = {
                restaurantName: matchedRestaurant.name,
                address: matchedRestaurant.address,
                rating: matchedRestaurant.rating,
                photo: matchedRestaurant.photo
            };

            // Emit match found to all participants
            io.to(sessionId).emit('voteUpdate', {
                isMatch: true,
                matchData: matchData
            });

            return { success: true, isMatch: true, matchData };
        }

        // Get all restaurants and votes for session
        const allSessionRestaurants = await Restaurant.find({ sessionId });
        const totalRestaurants = allSessionRestaurants.length;
        const allVotes = await Vote.find({ sessionId });

        // Track votes per user
        const votesPerUser = new Map();
        session.participants.forEach(participant => {
            votesPerUser.set(participant.user_id, 0);
        });

        allVotes.forEach(vote => {
            const key = vote.userId;
            if (votesPerUser.has(key)) {
                votesPerUser.set(key, votesPerUser.get(key) + 1);
            }
        });

        // Check if all users have voted on all restaurants
        const allVotingComplete = Array.from(votesPerUser.values()).every(voteCount => 
            voteCount === totalRestaurants
        );

        // Log voting progress
        console.log('Vote tracking:', {
            totalParticipants,
            totalRestaurants,
            votesPerUser: Object.fromEntries(votesPerUser),
            allVotingComplete
        });

        if (allVotingComplete) {
            // Emit results to all participants
            io.to(sessionId).emit('voteUpdate', {
                showResults: true,
                topRestaurants: topRestaurants
            });

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
