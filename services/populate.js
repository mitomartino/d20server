/**
 * **********************************************************************************************************
 * services/lookup.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Implements the services that serve lookup table data
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express          = require('express');
var preauthorize     = require('../api/user/preauthorize');
var populate         = require('../api/populate/populate');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

/**
 * Service: /:dataType
 *
 * Populate the given data type
 */
router.get('/:dataType', preauthorize("administrator"), function(req, res, next)
{
    var dt = req.params.dataType;

    if (!populate[dt])
    {
        res.error("No such data to populate: " + dt);
    }
    else
    {
        populate[dt].call(populate, req, res, next);
    }
});

// ----------------------------------------------------------------------------------------------------------

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/lookup.js
// ----------------------------------------------------------------------------------------------------------
