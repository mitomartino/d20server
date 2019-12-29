/**
 * **********************************************************************************************************
 * models/game-session.js
 *
 * author: William Martino
 *
 * Mongoose binding for sessions where a game is played
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var mongoose = require("mongoose");
var enums    = require("../api/data/enums");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var GameSession = new mongoose.Schema(
{
    /**
     * The game that was played
     */
    game: {type: mongoose.Schema.ObjectId, ref: "games"},

    /**
     * The state of the session
     */
    state:
    {
        type: String,
        enum: enums.GameSession.state
    },

    /**
     * Time that the session was scheduled to start
     */
    scheduled: Number,

    /**
     * Time that the session was started
     */
    started: Number,

    /**
     * Time that the session was ended
     */
    ended: Number,

    /**
     * Users that were invited
     */
    invited:
    [
        {
            userId:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:  'users'
            },
            status:
            {
                type: String,
                enum: enums.GameSession.invited.status
            },
            timestamp: Number
        }
    ],

    /**
     * The users that attended the game session
     */
    attended:
    [
        {
            userId:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users'
            },
            timestamp: Number
        }
    ],

});

module.exports = mongoose.model('game_sessions', GameSession);

// ----------------------------------------------------------------------------------------------------------
// end models/game-session.js
// ----------------------------------------------------------------------------------------------------------
