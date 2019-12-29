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
var Permission       = require('../models/permission');
var UploadCollection = require('../models/upload-collection');
var Ruleset          = require('../models/ruleset');
var enums            = require('../api/data/enums');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: permissions
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  permissions
 */
router.get('/permissions', function(req, res, next)
{
    Permission.find(res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: collections
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  upload collections
 */
router.get('/collections', function(req, res, next)
{
    UploadCollection.find(res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: rulesets
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  rule sets
 */
router.get('/rulesets', function(req, res, next)
{
    Ruleset.find(res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: enums
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of acceptable
 *  enumerations
 */
router.get('/enums', function(req, res, next)
{
    res.success(enums);
});

// ----------------------------------------------------------------------------------------------------------

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/lookup.js
// ----------------------------------------------------------------------------------------------------------
