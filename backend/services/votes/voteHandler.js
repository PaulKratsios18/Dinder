const Vote = require('../../models/Vote');
const Session = require('../../models/Session');

async function handleVote(sessionId, userId, restaurantId, vote) {
    try {
        // Find session first
        const session = await Session.findOne({ roomCode: sessionId });
        
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Save the vote
        const newVote = await Vote.findOneAndUpdate(
            { 
                sessionId, 
                userId, 
                restaurantId 
            },
            { vote },
            { 
                upsert: true,
                new: true 
            }
        );

        // Get all votes for this restaurant in this session
        const allVotes = await Vote.find({
            sessionId,
            restaurantId
        });

        // Count positive votes
        const positiveVotes = allVotes.filter(v => v.vote === true).length;
        
        // Check if everyone has voted yes
        const isMatch = positiveVotes === session.participants.length;

        return {
            success: true,
            isMatch,
            restaurantId,
            votes: {
                yes: positiveVotes,
                no: allVotes.length - positiveVotes
            }
        };

    } catch (error) {
        console.error('Error in handleVote:', error);
        throw error;
    }
}

module.exports = { handleVote };
