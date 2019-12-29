/**
 * **********************************************************************************************************
 * database.js
 *
 * author: William Martino
 *
 * Database connection
 *
 * Exports: The database connection to use for queries
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var connInfo = require("../../config/database");
var mongodb  = require("mongodb");
var mongoose = require("mongoose");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

module.exports = function (callback)
{
    var self = this;
    
    if (!self.connection)
    {
        mongoose.Promise = global.Promise;
        mongoose.connect(connInfo.connection, {useMongoClient: true});
        self.connection = mongoose.connection;

        self.connection.once('open', function()
        {
            callback(null, self.connection);
        });

        self.connection.on('error', function(err)
        {
            callback(err);
        });
    }
    else
    {
        callback(null, self.connection);
    }
};

// ----------------------------------------------------------------------------------------------------------
// end database.js
// ----------------------------------------------------------------------------------------------------------
