const Vote = require('../../models/Vote');
const Session = require('../../models/Session');
const Restaurant = require('../../models/Restaurant');

/**
 * Handles user votes for restaurants and determines matches
 * @param {string} sessionId - Session identifier
 * @param {string} userId - User identifier
 * @param {string} restaurantId - Restaurant identifier
 * @param {boolean} vote - User's vote (true for like, false for dislike)
 * @param {Object} io - Socket.io instance
 * @returns {Promise<Object>} Vote results and match status
 */
async function handleVote(sessionId, userId, restaurantId, vote, io) {
    try {
        // Save the vote
        const voteDoc = new Vote({
            sessionId,
            userId,
            restaurantId,
            vote
        });
        await voteDoc.save();
        console.log(`Vote recorded - Session: ${sessionId}, User: ${userId}, Restaurant: ${restaurantId}, Vote: ${vote}`);

        // Get session and all restaurants
        const session = await Session.findOne({ session_id: sessionId });
        const allRestaurants = await Restaurant.find({ sessionId });
        const totalParticipants = session.participants.length;
        
        // Calculate expected total votes (min of 20 and total restaurants * participants)
        const maxRestaurantsPerUser = 20;
        const restaurantsToVoteOn = Math.min(allRestaurants.length, maxRestaurantsPerUser);
        const expectedTotalVotes = restaurantsToVoteOn * totalParticipants;
        
        // Get all votes for this session
        const allSessionVotes = await Vote.find({ sessionId });
        const votesPerUser = {};
        
        session.participants.forEach(participant => {
            const userVotes = allSessionVotes.filter(v => v.userId === participant.user_id);
            votesPerUser[participant.user_id] = userVotes.length;
        });
        
        console.log('Vote tracking:', {
            totalRestaurants: allRestaurants.length,
            restaurantsToVoteOn,
            maxRestaurantsPerUser,
            totalParticipants,
            expectedTotalVotes,
            currentTotalVotes: allSessionVotes.length,
            votesPerUser
        });

        // Check if all voting is complete
        if (allSessionVotes.length >= expectedTotalVotes) {
            console.log('All voting complete! Calculating results...');
            
            // Update session status to complete
            await Session.findOneAndUpdate(
                { session_id: sessionId },
                { status: 'complete' }
            );

            const restaurantResults = allRestaurants
                .map(restaurant => {
                    const votes = allSessionVotes.filter(v => v.restaurantId === restaurant._id.toString());
                    const positiveVotes = votes.filter(v => v.vote).length;
                    const votePercentage = (positiveVotes / totalParticipants) * 100;
                    return {
                        ...restaurant.toObject(),
                        positiveVotes,
                        totalParticipants,
                        votePercentage
                    };
                })
                .sort((a, b) => b.votePercentage - a.votePercentage);

            // Check for perfect match (100% positive votes)
            const perfectMatch = restaurantResults.find(r => r.votePercentage === 100);
            if (perfectMatch) {
                io.to(sessionId).emit('matchFound', perfectMatch);
                return {
                    success: true,
                    isMatch: true,
                    matchedRestaurant: perfectMatch
                };
            }

            // Filter restaurants with >= 50% votes and take top 3
            const topRestaurants = restaurantResults
                .filter(r => r.votePercentage >= 50)
                .slice(0, 3);

            io.to(sessionId).emit('showResults', { topRestaurants });
            
            return {
                success: true,
                isMatch: false,
                showResults: true,
                topRestaurants
            };
        }

        // Check if current user has completed all votes
        const userVoteCount = votesPerUser[userId] || 0;
        
        if (userVoteCount >= 20) {
            // Calculate top restaurants based on votes
            const allRestaurants = await Restaurant.find({ sessionId });
            const restaurantVotes = await Vote.find({ sessionId });
            
            const topRestaurants = allRestaurants
                .map(restaurant => {
                    const votes = restaurantVotes.filter(v => v.restaurantId === restaurant._id.toString());
                    const positiveVotes = votes.filter(v => v.vote).length;
                    return {
                        ...restaurant.toObject(),
                        positiveVotes,
                        totalParticipants
                    };
                })
                .sort((a, b) => b.positiveVotes - a.positiveVotes)
                .slice(0, 5);

            return {
                success: true,
                isMatch: false,
                votesPerUser,
                userVoteCount,
                topRestaurants
            };
        }

        // Check for match only if vote is positive
        if (vote) {
            const restaurantVotes = await Vote.find({ sessionId, restaurantId });
            const allVotedYes = restaurantVotes.length === totalParticipants && 
                               restaurantVotes.every(v => v.vote === true);

            if (allVotedYes) {
                const matchedRestaurant = await Restaurant.findOne({ _id: restaurantId });
                if (matchedRestaurant) {
                    return {
                        success: true,
                        isMatch: true,
                        matchedRestaurant: {
                            ...matchedRestaurant.toObject(),
                            positiveVotes: totalParticipants,
                            totalParticipants
                        }
                    };
                }
            }
        }

        // Return vote update if no match
        return {
            success: true,
            isMatch: false,
            votesPerUser,
            userVoteCount: votesPerUser[userId] || 0
        };
    } catch (error) {
        console.error('Error in handleVote:', error);
        throw error;
    }
}

module.exports = { handleVote };
