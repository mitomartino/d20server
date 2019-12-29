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


// ----------------------------------------------------------------------------------------------------------
// template definitions
// ----------------------------------------------------------------------------------------------------------

var templates =
{
    notifications: {},
    activityLogs:  {}
};

var notifications = templates.notifications;
var activityLogs  = templates.activityLogs;

// ----------------------------------------------------------------------------------------------------------
// notifications
// ----------------------------------------------------------------------------------------------------------

notifications.set_avatar =
{
    title:    "User Avatar",
    text:     "{{ user.nickname }} has updated {{ user.pronouns.their }} avatar",
    iconType: "image",
    icon:     "{{ user.avatar }}"
};

// ----------------------------------------------------------------------------------------------------------
// activity logs
// ----------------------------------------------------------------------------------------------------------

activityLogs.set_avatar =
{
    title:    "User Avatar",
    text:     "{{ user.nickname }} has updated {{ user.pronouns.their }} avatar",
    iconType: "image",
    icon:     "{{ user.avatar }}"
};

// ----------------------------------------------------------------------------------------------------------

module.exports = templates;

// ----------------------------------------------------------------------------------------------------------
// end templates.js
// ----------------------------------------------------------------------------------------------------------