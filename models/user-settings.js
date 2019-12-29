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

var UserSettings = new mongoose.Schema({

    /**
     * user the setting belongs to
     */
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },

    /**
     * settings as a javascript object with key->value pairs
     */
    settings: mongoose.Schema.Types.Mixed

});

module.exports = mongoose.model('user_settings', UserSettings);

// ----------------------------------------------------------------------------------------------------------
// end models/user-settings.js
// ----------------------------------------------------------------------------------------------------------