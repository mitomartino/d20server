/**
 * **********************************************************************************************************
 * models/permission.js
 *
 * author: William Martino
 *
 * Mongoose binding for available permissions in the application
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

var Permission = new mongoose.Schema(
{
    order:       Number,
    entitlement: String,
    targets:     String,
    icon:        String,
    hidden:      Number,
    description: String,
    details:     String,

    routeState:
    {
        name: String,
        data: String
    }
});

module.exports = mongoose.model('permissions', Permission);

// ----------------------------------------------------------------------------------------------------------
// end models/permission.js
// ----------------------------------------------------------------------------------------------------------