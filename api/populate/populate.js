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

var express          = require('express');
var Permission       = require('../../models/permission');
var UploadCollection = require('../../models/upload-collection');
var SystemSettings   = require('../../models/system-settings');
var Ruleset          = require('../../models/ruleset');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api =
{
    all: function(req, res, next)
    {
        var thisArg = api;
        var ii      = 0;

        var functions =
        [
            "systemSettings",
            "permissions",
            "collections",
            "rulesets"
        ];

        function nextBack()
        {
            if (ii < functions.length)
            {
                var func = functions[ii++];

                thisArg[func].call(thisArg, req, res, next, nextBack)
            }
            else
            {
                res.success({});
            }
        }

        nextBack();
    },

    systemSettings: function(req, res, next, callback)
    {
        var settings;

        SystemSettings.remove({}, function(err)
        {
            if (err)
            {
                res.error(err);
            }
            else
            {
                settings = new SystemSettings({

                    users:
                    {

                    },

                    collections:
                    {
                        defaultSystemQuota: 1024 * 1024 * 1024,
                        defaultUserQuota:   1024 * 1024 * 150,
                        defaultGameQuota:   1024 * 1024 * 1024,

                        standardDrawers:
                        [
                            {
                                name:         'avatars',
                                contentType:  'images',
                                accept:       'png;jpg;gif',
                                targetWidth:  128,
                                targetHeight: 128,
                                icon:         'fa-user'
                            },
                            {
                                name:         'portraits',
                                contentType:  'images',
                                accept:       'png;jpg;gif',
                                targetWidth:  32,
                                targetHeight: 32,
                                icon:         'fa-picture-o'
                            },
                            {
                                name:         'tiles',
                                contentType:  'images',
                                accept:       'png;jpg;gif',
                                icon:         'fa-puzzle-piece'
                            },
                            {
                                name:         'maps',
                                contentType:  'images',
                                accept:       'png;jpg;gif',
                                icon:         'fa-map'
                            },
                            {
                                name:         'sounds',
                                contentType:  'audio',
                                accept:       'wav;mp3;mp4',
                                icon:         'fa-bell'
                            },
                            {
                                name:         'music',
                                contentType:  'audio',
                                accept:       'wav;mp3;mp4',
                                icon:         'fa-music'
                            }
                        ]
                    }
                });

                settings.save();

                if (callback)
                {
                    callback();
                }
                else
                {
                    res.success({});
                }
            }
        });
    },

    collections: function(req, res, next, callback)
    {
        var collection;

        UploadCollection.remove({}, function(err)
        {
            if (err)
            {
                res.error(err);
            }
            else
            {
                collection = new UploadCollection({
                    name:      'system',
                    type:      'system',
                    baseUrl:   '/upload/system/',
                    quota:     1024 * 1024 * 1024 * 5,
                    bytesUsed: 0,
                    drawers:
                    [
                        {
                            name:         'avatars',
                            contentType:  'images',
                            accept:       'png;jpg;gif',
                            targetWidth:  128,
                            targetHeight: 128,
                            icon:         'fa-user'
                        },
                        {
                            name:         'portraits',
                            contentType:  'images',
                            accept:       'png;jpg;gif',
                            targetWidth:  32,
                            targetHeight: 32,
                            icon:         'fa-picture-o'
                        },
                        {
                            name:         'tiles',
                            contentType:  'images',
                            accept:       'png;jpg;gif',
                            icon:         'fa-puzzle-piece'
                        },
                        {
                            name:         'maps',
                            contentType:  'images',
                            accept:       'png;jpg;gif',
                            icon:         'fa-map'
                        },
                        {
                            name:         'sounds',
                            contentType:  'audio',
                            accept:       'wav;mp3;mp4',
                            icon:         'fa-bell'
                        },
                        {
                            name:         'music',
                            contentType:  'audio',
                            accept:       'wav;mp3;mp4',
                            icon:         'fa-music'
                        }
                    ]
                });
                collection.save();

                if (callback)
                {
                    callback();
                }
                else
                {
                    res.success({});
                }
            }
        });
    },

    permissions: function(req, res, next, callback)
    {
        var permission;

        Permission.remove({}, function(err)
        {
            if (err)
            {
                res.error(err);
            }
            else
            {
                permission = new Permission({
                    order:       1,
                    entitlement: 'administrator',
                    icon:        'fa-star',
                    description: 'administrator privileges',
                    details:     'You are now an administrator.  Behold your phenomenal cosmic powers!',
                    hidden:      0,
                    routeState:
                    {
                        name: 'admin-settings'
                    }
                });
                permission.save();

                permission = new Permission({
                    order:       2,
                    entitlement: 'create users',
                    targets:     'users',
                    icon:        'fa-user-plus',
                    description: 'the ability to create users',
                    details:     'You can now create and manage users, assign permissions of your own, inspect ' +
                                 'conversations, reward the innocent and punish the guilty',
                    hidden:      0,
                    routeState:
                    {
                        name: 'admin-users'
                    }
                });
                permission.save();

                permission = new Permission({
                    order:       3,
                    entitlement: 'manage users',
                    targets:     'users',
                    icon:        'fa-user',
                    description: 'a user to manage',
                    details:     'You can now manage this user with minor admin capabilities.  Remember that absolute ' +
                                 'power corrupts absolutely',
                    hidden:      1,
                    routeState:
                    {
                        name: 'profile',
                        data: '{user: {{target}}}'
                    }
                });
                permission.save();

                permission = new Permission({
                    order:       4,
                    entitlement: 'host games',
                    targets:     'games',
                    icon:        'fa-bullhorn',
                    description: 'the ability to host games of your own',
                    details:     'You are the game master for your own game.  You can invite players, manage schedules, ' +
                                 'manage images/sounds/documents/references for the game, start conversations, and '      +
                                 'run sessions.',
                    hidden:      0,
                    routeState:
                    {
                        name: 'games-my-games'
                    }
                });
                permission.save();

                permission = new Permission({
                    order:       5,
                    entitlement: 'play games',
                    targets:     'games',
                    icon:        'fa-th-large',
                    description: 'an invitation to play',
                    details:     'You have been invited to join this game.  The game should now appear in your \" ' +
                                 'My Games\" area.  Contact the Game Master for details',
                    hidden:      1,
                    routeState:
                    {
                        name: 'games',
                        data: '{game: {{target}}}'
                    }
                });
                permission.save();

                permission = new Permission({
                    order:       6,
                    entitlement: 'manage characters',
                    targets:     'characters',
                    icon:        'fa-book',
                    description: 'a character to manage',
                    details:     'This character is now yours to play.  His/her fate is in your hands',
                    hidden:      1,
                    routeState:
                    {
                        name: 'characters',
                        data: '{character: {{target}}}'
                    }
                });
                permission.save();

                permission = new Permission({
                    order:       7,
                    entitlement: 'manage resources',
                    targets:     'upload_collections',
                    description: 'the ability to manage files',
                    details:     'You can now upload files to your personal file space to use as avatars, attachments, or assets ' +
                                 'for your personal adventures.',
                    icon:        'fa-image',
                    hidden:      0,
                    routeState:
                    {
                        name: 'profile',
                        data: '{view: "files"}'
                    }
                });
                permission.save();

                if (callback)
                {
                    callback();
                }
                else
                {
                    res.success({});
                }
            }
        });
    },

    rulesets: function(req, res, next, callback)
    {
        Ruleset.remove({}, function(err)
        {
            if (err)
            {
                res.error(err);
                return;
            }

            var dnd35 = new Ruleset(
            {
                name:        "Dungeons and Dragons 3.5ed",
                path:        "dnd35",
                description: "Dungeons and dragons edition 3.5",
                icon:        "public/images/games/dnd35.png"
            });
            dnd35.save();

            var dnd5 = new Ruleset(
            {
                name:        "Dungeons and Dragons 5.0ed",
                path:        "dnd5",
                description: "Dungeons and Dragons Fifth Edition",
                icon:        "public/images/games/dnd5.png"
            });
            dnd5.save();

            var chess = new Ruleset(
            {
                name:        "Chess",
                path:        "chess",
                description: "Don't play that game.  You know what it is",
                icon:        "public/images/games/chess.png"
            });
            chess.save();

            if (callback)
            {
                callback();
            }
            else
            {
                res.success({});
            }
        });
    }
};

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end auth.js
// ----------------------------------------------------------------------------------------------------------
