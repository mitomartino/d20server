/**
 * **********************************************************************************************************
 * models/game.js
 *
 * author: William Martino
 *
 * Mongoose binding for available game types
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

var Game = new mongoose.Schema(
{
    /**
     * Host for the game
     */
    host: {type: mongoose.Schema.ObjectId, ref: "users"},

    /**
     * Rule set for the game
     */
    ruleset: {type: mongoose.Schema.ObjectId, ref: "rulesets"},

    /**
     * display name for the game
     */
    name: String,

    /**
     * Description of the game
     */
    description: String,

    /**
     * Icon for the game
     */
    icon: String,

    /**
     * The schedule for the game
     */
    schedule:
    {
        recurs:
        {
            type: String,
            enum: enums.calendar.recurrence
        },
        recursOn:
        [
            Number
        ],

        startingOn: Number
    }
});

module.exports = mongoose.model('games', Game);

// ----------------------------------------------------------------------------------------------------------
// end models/game.js
// ----------------------------------------------------------------------------------------------------------
