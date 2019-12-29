/**
 * **********************************************************************************************************
 * settings.js
 *
 * author: William Martino
 *
 * api for managing user settings
 *
 * Provides methods for getting and setting user settings
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var socketIo         = require("../socket/socket");
var Callback         = require("../utils/callback");
var UserSettings     = require("../../models/user-settings");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api = {};

// ----------------------------------------------------------------------------------------------------------

/**
 * Load all user settings for the given user
 *
 * @param userId The user to load settings for
 * @param cb     The callback to invoke
 */
api.get = function(userId, cb)
{
    UserSettings.findOne({userId: userId}, function(err, settings)
    {
        if ( (err) || (!settings) )
        {
            // insert settings
            settings = new UserSettings(
            {
                userId:   userId,
                settings:
                {
                    empty: true
                }
            });

            settings.save(cb);
        }
        else
        {
            cb(null, settings);
        }
    });
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Set the given user-setting
 *
 * @param sessionUser  The user performing the update
 * @param targetUserId The user to update settings for
 * @param key          The value to update
 * @param value        The new value
 * @param cb           The callback to invoke with success or error
 */
api.set = function(sessionUser, targetUserId, key, value, cb)
{
    api.get(targetUserId, Callback.successOrError(cb, function(userSettings)
    {
        if (userSettings.settings[key] == value)
        {
            cb(null, userSettings);
        }
        else
        {
            userSettings.settings[key] = value;
            userSettings.markModified("settings");

            userSettings.save(Callback.successOrError(cb, function(savedSettings)
            {
                var data =
                {
                    updatedBy: sessionUser._id || sessionUser,
                    user:      targetUserId,
                    key:       key,
                    value:     value
                };

                socketIo.emitOne(targetUserId, "user.settings.changed", null, data);

                cb(null, savedSettings);
            }));
        }
    }));
}

// ----------------------------------------------------------------------------------------------------------

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end settings.js
// ----------------------------------------------------------------------------------------------------------
