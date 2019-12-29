/**
 * **********************************************************************************************************
 * services/menu.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Implements the services that manage menu login/logout/privileges
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express        = require('express');
var auth           = require('../api/user/auth');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: /main
 *
 * Create an return the main menu for the application
 */
router.get("/main", function(req, res, next)
{
    var mainMenu =
        [
            {
                icon:    "main-menu/home.png",
                title:   "Home",
                target:  "dashboard",
                tooltip: "Go back to the tavern..."
            },
            {
                icon:    "main-menu/profile.png",
                title:   "My Profile",
                target:  "profile",
                tooltip: "Paint us a word picture..."
            },
            {
                icon:    "main-menu/calendar.png",
                title:   "Calendar",
                target:  "calendar",
                tooltip: "Game on!"
            },
            {
                icon: "main-menu/admin.png",
                title: "Admin",
                target: "admin",
                tooltip: "It's good to be the king...",
                options:
                [
                    {
                        icon:       "main-menu/default.png",
                        title:      "Users",
                        target:     "admin-users",
                        tooltip:    "Invite players to join or wield the mighty ban hammer...",
                        auth:       "manage users",
                        authTarget: "any"
                    },
                    {
                        icon:    "main-menu/default.png",
                        title:   "Settings",
                        target:  "admin-settings",
                        tooltip: "Have it your way...",
                        auth:    "administrator"
                    }
                ]
            },
            {
                icon:    "main-menu/games.png",
                title:   "Games",
                target:  "games",
                tooltip: "Join a game or start your own...",
                options:
                [
                    {
                        icon:       "main-menu/default.png",
                        title:      "My Games",
                        target:     "games-my-games",
                        tooltip:    "Don't hate the player...",
                        auth:       "play games",
                        authTarget: "any"
                    },
                    {
                        icon:    "main-menu/default.png",
                        title:   "Find A Game",
                        target:  "games-matchmaker",
                        tooltip: "Matchmaker, make me a match..."
                    }
                ]
            },
            {
                icon:    "main-menu/horn.png",
                title:   "Chat",
                target:  "chat",
                tooltip: "Talk about it..."
            },
            {
                icon:    "main-menu/credits.png",
                title:   "Credits",
                target:  "attribution",
                tooltip: "Credit where credit is due..."
            },
            {
                icon:    "main-menu/logout.png",
                title:   "Log Out",
                target:  "logout",
                tooltip: "What? You think you're better than us?"
            }
        ];

    res.success(mainMenu);

});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: /dnd35
 *
 * Create an return the table menu for the application
 */
router.get("/dnd35", function(req, res, next) {

    var menu =
    [
        {
            icon:    "main-menu/characters.png",
            title:   "Characters",
            target:  "/characters",
            tooltip: "View characters under your control...",
            options:
            [
                {
                    icon:    "main-menu/default.png",
                    title:   "Browse",
                    target:  "characters-browse",
                    tooltip: "Browse characters under your control"
                },
                {
                    icon:    "main-menu/default.png",
                    title:   "New Character",
                    target:  "characters-new",
                    tooltip: "Roll up a new character",
                    auth:    "manage characters"
                }
            ]
        },
        {
            icon:    "main-menu/encounters.png",
            title:   "Encounters",
            target:  "encounters",
            tooltip: "Manage encounters...",
            auth:    "design games"
        },
        {
            icon:   "main-menu/dice.png",
            title:  "Dice Bag",
            target: "dicebag",
            tooltip: "It's time to roll the dice..."
        },
        {
            icon:    "main-menu/logout.png",
            title:   "Back",
            target:  "dashboard",
            tooltip: "Leave this table and do something else"
        }
    ];

    res.success(menu);
});

// ----------------------------------------------------------------------------------------------------------

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/menu.js
// ----------------------------------------------------------------------------------------------------------
