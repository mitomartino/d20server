/**
 * **********************************************************************************************************
 * models/system-settings.js
 *
 * author: William Martino
 *
 * Mongoose binding for available system-wide settings
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

var SystemSettings = new mongoose.Schema({

    server:
    {
        url: String
    },

    users:
    {

    },

    collections:
    {
        defaultSystemQuota: Number,
        defaultUserQuota:   Number,
        defaultGameQuota:   Number,

        standardDrawers:
        [
            {
                name:         String,
                contentType:  String,
                accept:       String,
                targetWidth:  Number,
                targetHeight: Number,
                icon:         String
            }
        ]
    },

    mailer:
    {
        displayName:  String,
        email:        String,
        clientId:     String,
        clientSecret: String,
        accessToken:  String,
        refreshToken: String
    }

});

module.exports = mongoose.model('system_settings', SystemSettings);

// ----------------------------------------------------------------------------------------------------------
// end models/system-settings.js
// ----------------------------------------------------------------------------------------------------------
