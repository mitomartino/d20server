/**
 * **********************************************************************************************************
 * notification-manager.js
 *
 * author: William Martino
 *
 * api for managing user notifications
 *
 * This api manages three kinds of event notifications:
 *  emails
 *  activity log
 *  popup notifications
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var socketIo        = require("../socket/socket");
var Callback        = require("../utils/callback");
var UserInterest    = require("../../models/user-interest");
var UserActivity    = require("../../models/user-activity");

// ----------------------------------------------------------------------------------------------------------
// class definition
// ----------------------------------------------------------------------------------------------------------

/**
 * Notification manager
 */
function NotificationManager()
{

}

// ----------------------------------------------------------------------------------------------------------
// public methods
// ----------------------------------------------------------------------------------------------------------

/**
 * Interest the given user in the given object
 *
 * @param userId       The user to interest
 * @param interestId   The object to interest the user in
 * @param interestType The type of object
 * @param callback     Callback to invoke with success or error
 */
NotificationManager.prototype.addInterest = function(userId, interestId, interestType, callback)
{
    var searchFor = {userId: userId, interestId: interestId, interestType: interestType};

    UserInterest.findOne(searchFor, Callback.ifNotFound(callback, function()
    {
        var interest = new UserInterest(searchFor);

        interest.save(callback);
    }));
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Disinterest the given user in the given object
 *
 * @param userId       The user to disinterest
 * @param interestId   The object to interest the user in
 * @param callback     Callback to invoke with success or error
 */
NotificationManager.prototype.removeInterest = function(userId, interestId, callback)
{
    var searchFor = {userId: userId, interestId: interestId};

    UserInterest.remove(searchFor, callback);
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Transfer interest in the given object to the given user
 *
 * @param fromUserId   The user to disinterest
 * @param toUserId     The user to interest
 * @param interestId   The object to transfer interest in
 */
NotificationManager.prototype.transferInterest = function(fromUserId, toUserId, interestId, callback)
{
    var searchFor = {userId: fromUserId, interestId: interestId};
    var update    = {$set: {userId: toUserId}};
    var opts      = {new: true};

    UserInterest.findOneAndUpdate(searchFor, update, opts, callback);
}

// ----------------------------------------------------------------------------------------------------------

module.exports = new NotificationManager();

// ----------------------------------------------------------------------------------------------------------
// end notification-manager.js
// ----------------------------------------------------------------------------------------------------------
