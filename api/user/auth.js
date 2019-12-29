/**
 * **********************************************************************************************************
 * auth.js
 *
 * author: William Martino
 *
 * Authorization/authentication api
 *
 * Provides methods for verifying and logging in users
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var User                = require("../../models/user");
var UserPermission      = require("../../models/user-permission");
var Permission          = require("../../models/permission");
var passport            = require("passport");
var socketIo            = require("../socket/socket");
var postman             = require("../mailer/postman");
var Callback            = require("../utils/callback");
var notificationManager = require("../notifications/notification-manager");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

// set up the authentication strategy for passport
passport.use(User.createStrategy());

// basic serialization
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api =
{
    /**
     * Initialize authorization
     *
     * @param app The application object
     */
    initialize: function(app)
    {
        app.use(passport.initialize());
        app.use(passport.session());

        socketIo.addConnectionHandler(function(socket)
        {
            var user = socketIo.getUser(socket);

            if (user)
            {
                // user is now online
                var status =
                {
                    online: true,
                    what:   "Logging in",
                    where:  "Home",
                };

                api.setStatus(user._id, status);

                // update status to offline on disconnect
                socket.on("disconnect", function()
                {
                    var status =
                    {
                        online: false,
                        what:   "Offline",
                        where:  "Nowhere",
                    };

                    api.setStatus(user._id, status);
                });

                // handle status changes over the socket io
                socket.on("user.setStatus", function(status)
                {
                   api.setStatus(user, status);
                });
            }
        });
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Get the user information for the current logged in user
     *
     * @param  req  Request to pull user info from
     * @return User Currently logged in user
     */
    getCurrentUser: function(req)
    {
        return req.session.user;
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Set the status of the given user
     *
     * @param userId   The id of the user to update
     * @param status   The new status
     * @param callback Callback for success/failure
     */
    setStatus: function(id, status, callback)
    {
        var userId = id._id || id;

        status.when = new Date().getTime();

        User.findOneAndUpdate({_id: userId}, {status: status}, function(err, user)
        {
            if (!err)
            {
                status.userId = userId;
                socketIo.emitAll("user.status", null, status);
            }

            if (callback)
            {
                callback(err, user);
            }
        });
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Permit a user to perform an action on a target
     *
     * @param userId      The user id to permit
     * @param userAdmin   The admin allowing the permission
     * @param entitlement The action to permit
     * @param target      The target (optional)
     * @param callback    Callback with success or failure
     */
    permit: function(userId, userAdmin, entitlement, target, callback)
    {
        // entitlement must be a known permission
        Permission.find({entitlement: entitlement}, Callback.validateCount(1, callback, function(permission)
        {
            // user must exist
            User.findById(userId, Callback.validateCount(1, callback, function(user)
            {
                var searchFor =
                {
                    userId:      userId,
                    entitlement: entitlement,
                    target:      target || null
                };

                // if the user already has this entitlement, then great
                UserPermission.find(searchFor, Callback.ifNotFound(callback, function()
                {
                    // notification function for successful permission
                    function notify(userPermission)
                    {
                        postman.send(
                        {
                            to:       user.email,
                            subject:  "Permission granted",
                            template: "permission_granted",
                            context:
                            {
                                user:       user,
                                admin:      userAdmin,
                                permission: permission,
                                link_back:  postman.mailer.baseUrl
                            }
                        });

                        socketIo.emitAll("user.permitted", null, searchFor);
                        callback(null, userPermission);
                    }

                    // create the permission for this user/target combination
                    new UserPermission(searchFor).save(Callback.validateCount(1, callback, function(userPermission)
                    {
                        // admins should be tagged as admin
                        if ((searchFor.entitlement == 'administrator') &&
                            (searchFor.target      == null))
                        {
                            user.isAdmin = true;

                            user.save(Callback.successOrError(callback, function()
                            {
                                notify(userPermission);
                            }));
                        }
                        else
                        {
                            notify(userPermission);
                        }
                    }));
                }));
            }));
        }));
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Deny a user an entitlement on a particular object
     *
     * @param userId      Id of the user to modify
     * @param userAdmin   User revoking the entitlement
     * @param entitlement The entitlement to remove
     * @param target      The object to remove the entitlement from
     * @param callback    The callback method for success/failure
     */
    deny: function(userId, userAdmin, entitlement, target, callback)
    {
        // entitlement must be a known permission
        Permission.find({entitlement: entitlement}, Callback.validateCount(1, callback, function(permission)
        {
            // user must exist
            User.findById(userId, Callback.validateCount(1, callback, function (user)
            {
                var searchFor =
                {
                    userId:      userId,
                    entitlement: entitlement,
                    target:      target || null
                };

                UserPermission.remove(searchFor, Callback.successOrError(callback, function(userPermission)
                {
                    // notification function for successful revocation
                    function notify(userPermission)
                    {
                        postman.send(
                        {
                            to:       user.email,
                            subject:  "Permission revoked",
                            template: "permission_revoked",
                            context:
                            {
                                user:       user,
                                admin:      userAdmin,
                                permission: permission,
                                link_back:  postman.mailer.baseUrl
                            }
                        });

                        socketIo.emitAll("user.denied", null, searchFor);
                        callback(null, userPermission);
                    }

                    if ((searchFor.entitlement == 'administrator') &&
                        (searchFor.targets == null))
                    {
                        user.isAdmin = false;

                        user.save(Callback.successOrError(callback, function(user)
                        {
                            notify(userPermission);
                        }));
                    }
                    else
                    {
                        notify(userPermission);
                    }
                }));
            }));
        }));
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Transfer ownership of an object from one user to another
     *
     * @param obj         Object or object id of the object to transfer ownership
     * @param entitlement The entitlement we are transferring
     * @param targetUser  The user or user id that is receiving ownership
     * @param callback    Callback with permission that was transferred or error
     */
    transferOwnership: function(req, obj, entitlement, targetUser, callback)
    {
        var targetUserId = targetUser._id || targetUser;
        var objId        = obj._id        || obj;
        var auth         = this;

        if (!targetUserId)
        {
            callback('target user must exist');
        }
        else if (!entitlement)
        {
            callback('entitlement must be specified');
        }
        else if (!objId)
        {
            callback('object id must be specified');
        }
        else if (entitlement == 'administrator')
        {
            callback('Cannot transfer administrator privileges');
        }
        else
        {
            var searchFor =
            {
                entitlement: entitlement,
                target:      objId
            };

            UserPermission.findOneAndUpdate(searchFor, {userId: targetUserId}, function(err, updated)
            {
                if (err)
                {
                    callback(err);
                }
                else
                {
                    socketIo.emitAll(
                        "user.transferOwnership",
                        null,
                        {
                            toUser:      targetUserId,
                            entitlement: entitlement,
                            target:      target
                        }
                    );

                    callback(err, updated);
                }
            });
        }
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Authenticate a request
     *
     * @param req      The request
     * @param res      The response
     * @param callback The success/failure callback
     */
    authenticate: function(req, res, callback)
    {
        passport.authenticate('local', callback)(req, res);
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * List the user ids of the users who are authorized to perform the given action
     *
     * @param entitlement The entitlement to search for
     * @param object      The optional target to search for
     * @param callback    The callback to invoke with the list of user ids
     */
    listAuthorizedUsers: function(entitlement, object, callback)
    {
        var searchFor =
        {
            $or:
            [
                {
                    entitlement: 'administrator'
                },
                {
                    entitlement: entitlement,
                    target:      null
                }
            ]
        };

        if (object)
        {
            searchFor.$or.push({entitlement: entitlement, target:  object});
        }

        UserPermission.find().distinct("userId", searchFor, callback);
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Authorize the given action on the given object
     *
     * @param req      The request object
     * @param action   The action to authorize
     * @param object   (optional) The object id to authorize the action on
     * @param callback Callback to invoke on success/failure
     */
    authorize: function(req, action, object, callback)
    {
        var currentUser = this.getCurrentUser(req);

        var searchFor =
        {
            $or:
            [
                {
                    userId:      currentUser._id,
                    entitlement: 'administrator',
                    target:      null
                },
                {
                    userId:      currentUser._id,
                    entitlement: action,
                    target:      null
                }
            ]
        }

        if (object)
        {
            searchFor.$or.push(
            {
                userId:      currentUser._id,
                entitlement: action,
                target:      object._id || object
            });
        }

        UserPermission.find(searchFor, function(err, user) {
            if (err)
            {
                callback(err, user);
            }
            else if ( (!user) || (!user.length) )
            {
                callback('You are not authorized to perform this action');
            }
            else
            {
                callback(err, user);
            }
        });
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Register a new user
     *
     * @param userInfo The user information (email, nickname, etc)
     * @param password The password for the new user
     * @param callback Callback to invoke on success/failure
     */
    register: function(req, userInfo, password, callback)
    {
        var newUser   = new User(userInfo);
        var auth      = this;
        var loginUser = this.getCurrentUser(req);

        User.register(newUser, password, Callback.validateCount(1, callback, function(user)
        {
            postman.send(
            {
                to:       user.email,
                subject:  "Welcome to D20 Server",
                template: "welcome",
                context:
                {
                    user:      user,
                    password:  password,
                    admin:     loginUser,
                    link_back: postman.mailer.baseUrl
                }
            });

            auth.permit(loginUser._id, loginUser, 'manage users', user._id, Callback.successOrError(callback, function(permission)
            {
                socketIo.emitAll("user.added", null, user);

                callback(null, user);
            }));
        }));
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Delete a user
     *
     * @param req      The request object containing the admin performing the delete
     * @param id       User to delete
     * @param callback Callback to indicate success or failure
     */
    delete: function(req, id, callback)
    {
        User.remove({id: id}, function(err, user)
        {
            if (err)
            {
                callback(err);
            }
            else
            {
                // remove all permissions the user has
                UserPermission.remove({userId: id}, function(err)
                {
                    if (err)
                    {
                        callback(err);
                    }
                    else
                    {
                        UserPermission.remove({target: id}, function(err, user)
                        {
                            if (err)
                            {
                                callback(err);
                            }
                            else
                            {
                                socketIo.emitAll("user.deleted", id);

                                callback(err, user);
                            }
                        });
                    }
                });
            }
        });
    }
};

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end auth.js
// ----------------------------------------------------------------------------------------------------------
