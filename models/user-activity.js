/**
 * **********************************************************************************************************
 * models/user-activities.js
 *
 * author: William Martino
 *
 * Mongoose binding for user activity log
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

var UserActivity = new mongoose.Schema(
{
    /**
     * user that is activityed in something to
     */
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },

    /**
     * description of the activity
     */
    activity: String,

    /**
     * icon/image associated with the activity
     */
    icon: String

});

UserActivity.index({userId: 1});

module.exports = mongoose.model('user_activities', UserActivity);

// ----------------------------------------------------------------------------------------------------------
// end models/user-settings.js
// ----------------------------------------------------------------------------------------------------------
