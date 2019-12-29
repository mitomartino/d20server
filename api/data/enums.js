/**
 * **********************************************************************************************************
 * api/data/enums.js
 *
 * author: William Martino
 *
 * Enumerations for various data types
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

var enums =
{
    GameSession:
    {
        state: ["undefined", "scheduled", "open", "closed"],

        invited:
        {
            state: ["going", "late", "not going", "undecided"]
        }
    },

    calendar:
    {
        recurrence: ["weekdays", "weekends", "weekly", "bi-weekly", "monthly", "every 4 weeks", "tbd"]
    },

    user:
    {
        pronouns:
        [
            {
                label: "he/him/his/his",
                value:
                {
                    they:   "he",
                    them:   "him",
                    their:  "his",
                    theirs: "his"
                }
            },
            {
                label: "she/her/her/hers",
                value:
                {
                    they:   "she",
                    them:   "her",
                    their:  "her",
                    theirs: "hers"
                }
            },
            {
                label: "they/them/their/theirs",
                value:
                {
                    they:   "they",
                    them:   "them",
                    their:  "their",
                    theirs: "theirs"
                }
            }
        ]
    }
};

module.exports = enums;

// ----------------------------------------------------------------------------------------------------------
// end api/data/enums.js
// ----------------------------------------------------------------------------------------------------------
