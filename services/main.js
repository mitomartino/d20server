/**
 * **********************************************************************************************************
 * services/main.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Loads all services and peforms middleware functions for backend services
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

module.exports = function(io)
{
    var express         = require('express');

    var userService     = require('./user');
    var lookupService   = require('./lookup');
    var menuService     = require('./menu');
    var uploadService   = require('./upload');
    var gameService     = require('./game');
    var populateService = require('./populate');
    var chatService     = require('./chat');

    var auth           = require('../api/user/auth');
    var JsonResponse   = require('../api/common/json-response');
    var socketIo       = require("../api/socket/socket");

    var router   = express.Router();

    // all basic services require the database and respond with json
    router.use(function(req, res, next)
    {
        // we will be serving json response objects
        res.set('Content-Type', 'application/json');

        // for all services (except, naturally, the login service), we need to be
        // logged in so that we can be authorized
        if ( (req.url != '/user/login')    &&
             (req.url != '/user/continue') &&
             (!req.session.user) )
        {
            JsonResponse.prototype.loginRequired().submit(req, res);
        }
        else
        {
            // attach socket-io info
            socketIo.initRequest(req);

            // apply some helper methods
            res.success = function (data)
            {
                JsonResponse.prototype.success(data).submit(req, res);
            };

            res.error = function (status, message)
            {
                JsonResponse.prototype.error(status, message).submit(req, res);
            };

            res.chain = function (next, mustBePresent)
            {
                return function(err, data)
                {
                    var needsData  = ( (mustBePresent == undefined) || (mustBePresent) );

                    if (err)
                    {
                        res.error(err);
                    }
                    else if ( (needsData) && (!data) )
                    {
                        res.error("Object could not be found");
                    }
                    else if (next)
                    {
                        next(data);
                    }
                    else
                    {
                        res.success(data);
                    }
                }
            };

            res.forward = function (data, next, mustBePresent)
            {
                return function(err)
                {
                    var needsData  = ( (mustBePresent == undefined) || (mustBePresent) );

                    if (err)
                    {
                        res.error(err);
                    }
                    else if ( (needsData) && ((!data) || (data.length == 0)) )
                    {
                        res.error("Object could not be found");
                    }
                    else if (next)
                    {
                        next(data);
                    }
                    else
                    {
                        res.success(data);
                    }
                }
            };

            res.mongooseCallback = function (err, data)
            {
                if (err)
                {
                    res.error(err);
                }
                else if ((!data) || (data.length == 0))
                {
                    res.error("Object could not be found");
                }
                else
                {
                    res.success(data);
                }
            };

            res.successOrError = function(err, data)
            {
                if (err)
                {
                    res.error(err);
                }
                else
                {
                    res.success();
                }
            }

            res.callbackWrapper = function (callback)
            {
                return function (err, data)
                {
                    if (err)
                    {
                        res.error(err);
                    }
                    else
                    {
                        callback(data);
                    }
                }
            };

            res.promise = function (promise)
            {
                promise.then(
                    function (data)
                    {
                        res.success(data);
                    },
                    function (err)
                    {
                        res.error(err);
                    }
                );
            };

            // ensure that there is a database connection
            next();
        }
    });

    // assign services
    router.use("/user",      userService);
    router.use("/lookup",    lookupService);
    router.use("/menu",      menuService);
    router.use("/upload",    uploadService);
    router.use("/game",      gameService);
    router.use("/populate",  populateService);
    router.use("/chat",      chatService);

    // ------------------------------------------------------------------------------------------------------
    // error handlers
    // ------------------------------------------------------------------------------------------------------

    // development error handler
    // will print stacktrace
    router.use(function(err, req, res, next)
    {
        JsonResponse.prototype.error(err.status, err.message).submit(req, res);
    });

    return router;
};

// ----------------------------------------------------------------------------------------------------------
// end services/all.js
// ----------------------------------------------------------------------------------------------------------
