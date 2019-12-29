/**
 * **********************************************************************************************************
 * services/user.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Implements the services that manage user login/logout/privileges
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express        = require('express');
var preauthorize   = require('../api/user/preauthorize');
var auth           = require('../api/user/auth');
var chat           = require('../api/chat/chat');
var User           = require('../models/user');
var UserPermission = require('../models/user-permission');
var UserSettings   = require('../models/user-settings');
var socketIo       = require('../api/socket/socket');
var userSettings   = require('../api/user/settings');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: login
 *
 * Login the user
 *
 * POST parameters:
 *  email: email of the user to log in
 *  password: password of the user to log in
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.post('/login', function(req, res, next) {

    auth.authenticate(req, res, function(err, user, message) {

        if ( (err) || (!user) )
        {
            res.error(message.message);
        }
        else
        {
            user.resolve([UserPermission], function(err, user) {

                if ( (err) || (!user) )
                {
                    res.error(err || 'User not found');
                }
                else
                {
                    userSettings.get(user._id, function(err, settings)
                    {
                        if (err)
                        {
                            res.error(err);
                        }
                        else
                        {
                            user._doc.user_settings = settings;
                            req.session.user   = user;

                            req.session.save();
                            res.success(user);
                        }
                    });
                }
            });
        }
    });
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: continue
 *
 * Attempt to continue an existing session
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing logged in user details
 */
router.get('/continue', function(req, res, next)
{
    if (req.session.user)
    {
        User.findById(req.session.user._id, function(err, user) {

            if (err)
            {
                res.error(500, err);
            }
            else if (user)
            {
                user.resolve([UserPermission], function(err)
                {
                    userSettings.get(user._id, function(err, settings)
                    {
                        if (err)
                        {
                            res.error(err);
                        }
                        else
                        {
                            user._doc.user_settings = settings;

                            res.success(user);
                        }
                    });
                });
            }
            else
            {
                res.error(400, 'The requested user was not found');
            }
        });
    }
    else
    {
        res.error('No user currently logged in');
    }
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: logout
 *
 * Log the user out
 *
 * POST parameters:
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.all('/logout', function(req, res, next)
{
    req.session.destroy();
    res.success();
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: register
 *
 * Register a new user
 *
 * POST parameters:
 *  email:     email of the user to register
 *  password:  password of the user to register
 *  nickname:  display name for the user
 *  pronouns:  pronouns for displaying status
 *  avatar:    avatar for the user
 *  about:     about blurb
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the user information
 */
router.post('/register', preauthorize('create users'), function(req, res, next)
{
    var userInfo =
    {
        email:    req.body.email,
        nickname: req.body.nickname,
        about:    req.body.about,
        avatar:   req.body.avatar,
        pronouns: req.body.pronouns
    };

    req.checkBody('password', 'Password cannot be empty').notEmpty();
    req.checkBody('nickname', 'Nickname cannot be empty').notEmpty();
    req.checkBody('email',    'Email must be a valid email address').isEmail();

    auth.register(req, userInfo, req.body.password, function(error, user, passwordErr)
    {

        if (error)
        {
            res.error(error);
        }
        else
        {
            res.success(user);
        }
    });
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: delete
 *
 * Delete an existing user
 *
 * Path params:
 *  userId - id of the user to delete
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.get('/:userId/delete', preauthorize('manage users', 'req.params.userId'), function(req, res, next)
{
    if (req.params.userId == req.session.user._id)
    {
        res.error("You cannot delete yourself");
    }
    else
    {
        User.findById(req.params.userId, res.chain(function(user)
        {
            User.remove({_id: req.params.userId}, function(err)
            {
                if (err)
                {
                    res.error(err);
                }
                else
                {
                    chat.participants.removeFromAllConversations(user, function()
                    {
                        socketIo.emitAll("user.deleted", null, req.params.userId);
                        res.success();
                    });
                }
            });
        }));
    }
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: ban
 *
 * Ban an existing user
 *
 * Path params:
 *  userId - id of the user to ban
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.get('/:userId/ban', preauthorize('manage users', 'req.params.userId'), function(req, res, next)
{
    if (req.params.userId == req.session.user._id)
    {
        res.error("You cannot ban yourself");
    }
    else
    {
        User.findByIdAndUpdate(req.params.userId, {$set: {isBanned: 1} }, function(err, user)
        {
            if (err)
            {
                res.error(err);
            }
            else
            {
                user._doc.isBanned = 1;
                socketIo.emitAll("user.banned", null, { user: user._id, banned: 1});

                res.success(user);
            }
        });
    }
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: unban
 *
 * Lift a ban on an existing user
 *
 * Path params:
 *  userId - id of the user to unban
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.get('/:userId/unban', preauthorize('manage users', 'req.params.userId'), function(req, res, next)
{
    if (req.params.userId == req.session.user._id)
    {
        res.error("You cannot unban yourself");
    }
    else
    {
        User.findByIdAndUpdate(req.params.userId, {$set: {isBanned: 0} }, function(err, user)
        {
            if (err)
            {
                res.error(err);
            }
            else
            {
                user._doc.isBanned = 0;
                socketIo.emitAll("user.banned", null, { user: user._id, banned: 0});

                res.success(user);
            }
        });
    }
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: list
 *
 * Retrieve the list of users
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the list of users
 */
router.get('/list', function(req, res, next)
{
    User.find(res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/:userId/details
 *
 * Retrieve the list of permissions, badges, etc for the given user
 *
 * path params:
 *  userId: id of the user to update
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the details for the given user
 */
router.get('/:userId/details', function(req, res, next)
{
    User.findById(req.params.userId, function(err, user)
    {
        if (err)
        {
            res.error(500, err);
        }
        else if (user)
        {
            user.resolve([UserPermission], res.mongooseCallback);
        }
        else
        {
            res.error(400, 'The requested user was not found');
        }
    });
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/:userId/permit
 *
 * Permit the given user to perform the given action on the given object
 *
 * path params:
 *  userId: id of the user to update
 *
 * POST params:
 *  entitlement The new entitlement to add
 *  target: The object id of the object the entitlement should operate on
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the details for the given user
 */
router.post('/:userId/permit', preauthorize('manage users', 'req.params.userId'), function(req, res, next)
{
    auth.permit(
        req.params.userId,
        req.session.user,
        req.body.entitlement,
        req.body.target,
        res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/:userId/deny
 *
 * No longer permit the given user to perform the given action on the given object
 *
 * path params:
 *  userId: id of the user to update
 *
 * POST params:
 *  entitlement The new entitlement to add
 *  target: The object id of the object the entitlement should operate on
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the details for the given user
 */
router.post('/:userId/deny', preauthorize('manage users', 'req.params.userId'), function(req, res, next)
{
    auth.deny(
        req.params.userId,
        req.session.user,
        req.body.entitlement,
        req.body.target,
        res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/objects/transfer/to/:userId
 *
 * Transfer ownership of the given object to the given user id
 *
 * path params:
 *  userId: id of the user to transfer ownership to
 *
 * POST params:
 *  object: The object whose ownership should be transferred
 *  entitlement The entitlement to transfer
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the details for the permission that was transferred
 */
router.post('/objects/transfer/to/:userId',
    preauthorize('req.body.entitlement', 'req.body.object'),
    function(req, res, next)
    {
        auth.transferOwnership(
            req,
            req.body.object,
            req.body.entitlement,
            req.params.userId,
            req.mongooseCallback);
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/:userId/setAvatar
 *
 * Set the avatar that represents the given user
 *
 * path params:
 *  userId: id of the user to update
 *
 * POST params:
 *  avatar: the url to the new avatar
 *
 * output:
 *  standard Response wrapper indicating success or failure with details
 *  containing the details for the given user
 */
router.post('/:userId/setAvatar', preauthorize('manage users', 'req.params.userId'), function(req, res, next)
{
    if (!req.body.avatar)
    {
        res.error('Invalid avatar path: ' + req.body.avatar);
    }
    else
    {
        User.findByIdAndUpdate(req.params.userId, {$set: {avatar: req.body.avatar} }, res.chain(function(user)
        {
            socketIo.emitAll("user.updated", user);

            res.success(user);
        }));
    }
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/:userId/setPassword
 *
 * Set the password to login the given user
 *
 * path params:
 *
 * POST params:
 *  email:       email of the user to update
 *  password:    the user's current password
 *  newPassword: the new password for the user
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.post('/setPassword', function(req, res, next)
{
    var email = req.body.email;

    if ( (!email) || (!req.body.newPassword) )
    {
        res.error('Missing email or password');
    }
    else
    {
        // user must exist
        User.find({email: email}, req.chain(function(user)
        {
            // if the logged in user can manage this user, then we don't need to authenticate
            // the current password
            auth.authorize(req, "manage users", user._id, function(err)
            {
                if (err)
                {
                    // try to authenticate the user
                    auth.authenticate(req, res, function(err, user, message) {
                        if (err)
                        {
                            res.error(err);
                        }
                        else
                        {
                            user.setPassword(req.body.newPassword, res.successOrError);
                        }
                    });
                }
                else
                {
                    // just set the password
                    user.setPassword(req.body.newPassword, res.successOrError);
                }
            });

        }));
    }
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: settings/get
 *
 * Get the user settings for the given user
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing user settings
 */
router.get('/settings/get', function(req, res, next)
{
    userSettings.get(req.session.user._id, res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: settings/set
 *
 * Set a user setting for the given user
 *
 * POST params:
 *  key:   name of the setting to update
 *  value: new value for the setting
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.post('/settings/set', function(req, res, next)
{
    var key   = req.body.key;
    var value = req.body.value || null;

    if (!key)
    {
        res.error("Invalid key: " + key);
    }
    else
    {
        var userId = req.session.user._id;

        userSettings.set(userId, userId, key, value, function(err, settings)
        {
            if (err)
            {
                res.error(err);
            }
            else
            {
                req.session.user.user_settings = settings;
                req.session.save();

                res.success(settings);
            }
        });
    }

});

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/user.js
// ----------------------------------------------------------------------------------------------------------
