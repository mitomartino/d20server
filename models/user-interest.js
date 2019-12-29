/**
 * **********************************************************************************************************
 * models/user-settings.js
 *
 * author: William Martino
 *
 * Mongoose binding for available settings for a user
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var mongoose = require("mongoose");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var UserInterest = new mongoose.Schema(
{
    /**
     * user that is interested in something to
     */
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },

    /**
     * id of interesting thing
     */
    interestId: mongoose.Schema.Types.ObjectId,

    /**
     * type of thing user is interested in (collection name)
     */
    interestType: String

});

UserInterest.index({interestId: 1});

module.exports = mongoose.model('user_interests', UserInterest);

// ----------------------------------------------------------------------------------------------------------
// end models/user-interest.js
// ----------------------------------------------------------------------------------------------------------
