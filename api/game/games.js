/**
 * **********************************************************************************************************
 * api/games/game.js
 *
 * author: William Martino
 *
 * API for creating/modifying/joining games, managing session schedule, etc
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express          = require("express");
var Game             = require("../../models/game");
var GameSession      = require("../../models/game-session");
var Ruleset          = require("../../models/ruleset");
var Callback         = require("../utils/callback");
var auth             = require("../user/auth");

// ----------------------------------------------------------------------------------------------------------
// api definition
// ----------------------------------------------------------------------------------------------------------

/**
 * game management api
 */
var api = {};

// ----------------------------------------------------------------------------------------------------------

/**
 * create
 *
 * Create a new game with the given name and ruleset, hosted by the given user
 *
 * @param host        The host running the game
 * @param name        The name of the game
 * @param description Textual description of the game
 * @param ruleset     The rulset for the game
 * @param icon        The optional icon for the game
 * @param schedule    Optional schedule definition for the game
 * @param callback    Callback to invoke with the new game object or failure
 */
api.create = function(host, name, description, ruleset, icon, schedule, callback)
{
    if (!callback)
    {
        if (schedule)
        {
            callback = schedule;
        }
        else
        {
            callback = icon;
            icon     = undefined;
        }

        schedule = undefined;
    }

    if ( (!host) || (!name) || (!ruleset) )
    {
        callback("Missing host/name/ruleset");
    }
    else
    {
        Ruleset.find({name: ruleset}, Callback.validateCount(1, callback, function(dbRuleset)
        {
            if (!schedule)
            {
                schedule =
                {
                    recurs:     "TBD",
                    recursOn:   -1,
                    startingOn: Date.now(),
                    icon:       icon || ruleset.icon
                };
            }

            var game = new Game(
            {
                host:        host._id || host,
                name:        name,
                description: description,
                schedule:    schedule,
                ruleset:     dbRuleset._id
            });

            game.save(Callback.successOrError(function(dbGame)
            {
                auth.permit(game.host, game.host, "host games", dbGame._id, Callback.successOrError(function()
                {
                    callback(null, dbGame);
                }));
            }));
        }));
    }
}

// ----------------------------------------------------------------------------------------------------------

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end api/game/games.js
// ----------------------------------------------------------------------------------------------------------
