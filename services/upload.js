/**
 * **********************************************************************************************************
 * services/upload.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Implements the services that manage uploads/collections
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express           = require('express');
var User              = require('../models/user');
var preauthorize      = require('../api/user/preauthorize');
var collectionManager = require('../api/collection/collection');
var multer            = require('multer');
var upload            = multer({ dest: 'private/upload_temp/' });

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: get
 *
 * path params:
 *  collection: name of the collection to return a description of
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the collection's info
 */
router.get('/list/:collection/get', function(req, res, next)
{
    collectionManager.findByName(req.params.collection, res.mongooseCallback);
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: list
 *
 * path params:
 *  collection: name of the collection to list contents for
 *  drawer: name of the drawer to list contents for
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  upload collections
 */
router.get('/list/:collection/:drawer',
    function(req, res, next)
    {
        collectionManager.findByName(req.params.collection, res.chain(function(collection)
        {
            collectionManager.listContents(collection, req.params.drawer, res.mongooseCallback);
        }));
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: to
 *
 * Upload a file to the given collection
 *
 * path params:
 *  collection: id of the collection to update
 *  drawer: name of the drawer to update
 *
 * post params:
 *  file: the file that was uploaded
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.post('/to/:collection/:drawer',
    preauthorize('manage resources', 'req.params.collection'),
    upload.single('file'),

    function(req, res, next)
    {
        if (!req.file)
        {
            res.error('No file was uploaded');
        }
        else
        {
            collectionManager.uploadFile(
                req.params.collection,
                req.params.drawer,
                req.file, res.mongooseCallback);
        }

    });

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: import
 *
 * Import a file into the given collection
 *
 * path params:
 *  collection: id of the collection to update
 *  drawer: name of the drawer to update
 *
 * post params:
 *  file: the file path to import
 *
 * output:
 *  standard Response wrapper indicating success or failure
 */
router.post('/import/:collection/:drawer',
    preauthorize('manage resources', 'req.params.collection'),
    function(req, res, next)
    {
        if (!req.body.file)
        {
            res.error('No file was chosen to import');
        }
        else
        {
            collectionManager.importIntoDrawer(
                req.body.file,
                req.body.rename,
                req.params.collection,
                req.params.drawer,
                false,
                res.mongooseCallback);
        }

    });

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: delete/from
 *
 * Delete a file from the given collection
 *
 * path params:
 *  collection: name of the collection to update
 *  drawer: the drawer to update
 *
 * post params:
 *  file: the file name that was deleted
 *
 * output:
 *  standard Response wrapper indicating success or failure containing collection's new contents
 */
router.post('/delete/from/:collection/:drawer',
    preauthorize('manage resources', 'req.params.collection'),
    function(req, res, next)
    {
        if ( (!req.body.file) || (req.body.file.length == 0) || (req.body.file.indexOf('../') != -1) )
        {
            res.error('invalid path ' + req.body.file);
        }
        else
        {
            collectionManager.deleteFile(
                req.params.collection,
                req.params.drawer,
                req.body.file,
                res.mongooseCallback);
        }
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: user/:userId/makeCollection
 *
 * Make a standard collection for the given user.  Uses the system settings to create a set of standard
 * drawers for the user.
 *
 * path params:
 *  userId The user to generate a collection for
 *
 * output:
 *  standard Response wrapper indicating success or failure containing the collection's specifications
 */
router.get('/user/:userId/makeCollection',
    preauthorize('manage users', 'req.params.userId'),
    preauthorize('manage resources'),
    function(req, res, next)
    {
        User.findById(req.params.userId, function(err, user)
        {
            if ( (err) || (!user) )
            {
                res.error('User does not exist');
            }
            else
            {
                collectionManager.createCollection(
                    req.session.user,
                    req.params.userId,
                    "user",
                    user,
                    res.mongooseCallback);
            }
        });
    }
);

// ----------------------------------------------------------------------------------------------------------

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/upload.js
// ----------------------------------------------------------------------------------------------------------
