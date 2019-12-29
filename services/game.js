/**
 * **********************************************************************************************************
 * services/game.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Implements the services that manage games/schedules
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express          = require("express");
var preauthorize     = require("../api/user/preauthorize");
var Game             = require("../models/game");
var gameManager      = require("../api/game/games");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: list
 *
 * path params:
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of tables
 */
router.get("/list", function(req, res, next)
{
    Table.find(res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: create
 * 
 * post params:
 *  name:        name of the game to create
 *  description: description of the game
 *  ruleset:     rule set of the game
 *  icon:        optional icon for the game
 *  schedule     optional scheudle for the game
 *
 */
router.post("/create", preauthorize("host games"), function(req, res, next)
{
    gameManager.create(
        req.session.user,
        req.body.name,
        req.body.description,
        req.body.ruleset,
        req.body.icon,
        req.body.schedule,
        res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/table.js
// ----------------------------------------------------------------------------------------------------------
