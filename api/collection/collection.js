/**
 * **********************************************************************************************************
 * collection.js
 *
 * author: William Martino
 *
 * Collection/file system api
 *
 * Provides methods for managing system/table/user file collections
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var SystemSettings   = require('../../models/system-settings');
var UploadCollection = require("../../models/upload-collection");
var auth             = require('../user/auth');
var socketIo         = require("../socket/socket");
var Callback         = require("../utils/callback");
var fs               = require('fs-extra');
var path             = require('path');
var im               = require("imagemagick");
var _                = require('underscore');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api = {};

// ----------------------------------------------------------------------------------------------------------

/**
 * Load the given collection if it is not loaded
 *
 * @param collection The collection object or collection id
 * @param errorCb    The callback to invoke if no collection could be found
 * @param successCb  The callback to invoke with the collection
 */
api.ensureLoaded = function(collection, errorCb, successCb)
{
    if (collection._id)
    {
        successCb(collection);
    }
    else
    {
        UploadCollection.find({_id: collection}, Callback.validateCount(1, errorCb, successCb));
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Load a collection
 *
 * @param name The collection name
 * @param cb   The callback to invoke
 */
api.findByName = function(name, cb)
{
    UploadCollection.findOne({name: name}, cb);
}

// ------------------------------------------------------------------------------------------------------

/**
 * List the contents of the given drawer
 *
 * @param collection The collection or collection id
 * @param drawer     The name of the drawer to list
 * @param cb         The callback
 */
api.listContents = function(collection, drawer, cb)
{
    api.ensureLoaded(collection, cb, function(collObj)
    {
        collObj.list(drawer, cb);
    });
}

// ------------------------------------------------------------------------------------------------------

/**
 * Create a new collection
 *
 * @param creator The creator of the new collection
 * @param name    The name of the collection to create
 * @param type    One of "user" or "table"
 * @param owner   The user to assign ownership of the collection
 * @param cb      Callback to invoke when done
 */
api.createCollection = function(creator, name, type, owner, cb)
{
    UploadCollection.findOne({name: name}, Callback.validateCount(0, cb, function(collection)
    {
        SystemSettings.find({}, Callback.validateCount(1, cb, function (settings)
        {
            settings = settings.collections;

            var collectionDef =
            {
                name:      name,
                type:      type,
                baseUrl:   "/upload/user/" + name + "/",
                quota:     settings.defaultUserQuota,
                bytesUsed: 0,
                drawers:   []
            };

            var absPath = path.normalize(path.join(__dirname, "../../", collectionDef.baseUrl));

            _.each(settings.standardDrawers, function (def)
            {
                collectionDef.drawers.push(_.extend({}, def._doc));
            });

            // in case there are already files here, init the used quota to the used space
            api.getFileSize(absPath, function(err, bytesUsed)
            {
                if (err)
                {
                    bytesUsed = 0;
                }

                collectionDef.bytesUsed = bytesUsed;

                var collection = new UploadCollection(collectionDef);

                collection.save(Callback.successOrError(cb, function(savedCollection)
                {
                    socketIo.emitAll("collection.created", null, savedCollection);

                    auth.permit(
                        owner._id || owner,
                        creator,
                        'manage resources',
                        savedCollection,
                        Callback.forward(cb, savedCollection));
                }));
            });
        }));
    }));
}

// ------------------------------------------------------------------------------------------------------

/**
 * Check the free space for the given collection and update it if it can accommodate the given space
 *
 * If the collection cannot accommodate the given change, then the deleteOnFail file will be unlinked
 *
 * @param collOrId     The collection to update or its id
 * @param space        The amount of space to fill up or free
 * @param deleteOnFail The file to delete if there is insufficient space
 * @param cb           The callback to invoke
 */
api.updateFreeSpace = function(collOrId, space, deleteOnFail, cb)
{
    api.ensureLoaded(collOrId, cb, function(collection)
    {
        // if we are freeing space, then
        if (space < 0)
        {
            collection.bytesUsed += space;

            if (collection.bytesUsed < 0)
            {
                collection.bytesUsed = 0;
            }

            collection.save(cb);
        }
        else if (space > 0)
        {
            if (collection.bytesUsed + space > collection.quota)
            {
                var msg = "This operation would exceed your disk space quota.  " +
                          "Please clear some space and try again";

                if (deleteOnFail)
                {
                    fs.unlink(deleteOnFail, function(err)
                    {
                        if (err)
                        {
                            cb(err);
                        }
                        else
                        {
                            cb(msg);
                        }
                    });
                }
                else
                {
                    cb(msg);
                }
            }
            else
            {
                collection.bytesUsed += space;
                collection.save(cb);
            }
        }
        else
        {
            // no update
            cb(null, collection);
        }
    });
}

// ------------------------------------------------------------------------------------------------------

/**
 * Get the current size of the file at the given path
 *
 * @param filePath The path to locate file size
 * @param cb       The callback to receive size or any errors
 */
api.getFileSize = function(filePath, cb)
{
    fs.stat(filePath, Callback.successOrError(cb, function(stats)
    {
        if (stats.isDirectory())
        {
            var total = 0;

            fs.readdir(filePath, Callback.successOrError(cb, function(files)
            {
                var ii     = 0;
                var nFiles = files.length;

                function processNext(fileSize)
                {
                    if (fileSize)
                    {
                        total += fileSize;
                    }

                    if (ii >= nFiles)
                    {
                        cb(null, total);
                    }
                    else
                    {
                        api.getFileSize(
                            path.join(filePath, files[ii++]), Callback.successOrError(cb, processNext));
                    }
                }

                processNext();
            }));
        }
        else
        {
            cb(null, stats["size"]);
        }
    }));
}

// ------------------------------------------------------------------------------------------------------

/**
 * Determine the difference in file size between two paths
 *
 * @param from The base file to gauge size
 * @param to   The updated file to gauge size
 * @param cb   The callback to receive size difference or errors
 */
api.getFileSizeDifference = function(from, to, cb)
{
    api.getFileSize(from, function(err, origSize)
    {
        // file doesn't exist? consider existing size to be 0
        if (err)
        {
            origSize = 0;
        }

        // get the new file size so that we can determine the change in free space
        api.getFileSize(to, Callback.successOrError(cb, function (newSize)
        {
            var result =
            {
                origSize: origSize,
                newSize:  newSize,
                diff:     newSize - origSize
            };

            cb(null, result);
        }));
    });
}

// ------------------------------------------------------------------------------------------------------

/**
 * Delete the given file from the given drawer
 *
 * @param collectionOrId The collection to modify
 * @param drawer         The drawer to modify
 * @param file           The file to delete
 * @param cb             The callback to invoke once done
 */
api.deleteFile = function(collectionOrId, drawer, file, cb)
{
    api.ensureLoaded(collectionOrId, cb, function(collection)
    {
        var drawerObj = collection.getDrawer(drawer);

        if (!drawerObj)
        {
            cb('No such drawer: ' + drawer);
        }
        else
        {
            var base    = collection.baseUrl;
            var absPath = path.normalize(path.join(__dirname, "../../", base, drawer));
            var delPath = absPath + "/" + file;

            api.getFileSize(delPath, Callback.successOrError(cb, function(size)
            {
                fs.unlink(delPath, Callback.successOrError(cb, function()
                {
                    api.updateFreeSpace(collection, -size, null, function(err, data)
                    {
                        api.contentsChanged(data, "removed", drawer, file);

                        cb(err, data);
                    });
                }));
            }));
        }
    });
}

// ------------------------------------------------------------------------------------------------------

/**
 * Upload a file to a collection
 *
 * @param collectionOrId The collection or id of the collection to update
 * @param drawer         The drawer to update
 * @param file           The file info from the upload
 * @param cb             Callback to invoke with results
 */
api.uploadFile = function(collectionOrId, drawer, file, cb)
{
    // we specify not to delete on success because we are going to delete on failure as well, since
    // file is a temporary upload
    api.importIntoDrawer(file.path, file.originalname, collectionOrId, drawer, false, function(err, collection)
    {
        fs.unlink(file.path, function()
        {
            if (err)
            {
                cb(err);
            }
            else
            {
                cb(null, collection);
            }
        });
    });
}

// ------------------------------------------------------------------------------------------------------

/**
 * Import the given path into the given collection + drawer
 *
 * @param from           The path to import
 * @param rename         New name for the file
 * @param collectionOrId The collection or id of the collection to update
 * @param drawer         The drawer to update
 * @param deleteOriginal Whether or not to delete the original on success
 * @param cb             Callback to invoke with results
 */
api.importIntoDrawer = function(from, rename, collectionOrId, drawer, deleteOriginal, cb)
{
    if (!rename)
    {
        rename = path.basename(from);
    }

    api.ensureLoaded(collectionOrId, cb, function(collection)
    {
        var drawerObj = collection.getDrawer(drawer);
        var operation = "added";

        if (!drawerObj)
        {
            return cb('No such drawer: ' + drawer);
        }

        var base      = collection.baseUrl;
        var parentDir = path.normalize(path.join(__dirname, "../../", base, drawer));
        var newPath   = parentDir + "/" + path.basename(rename);
        var source    = path.normalize(path.join(__dirname, "../../", from));

        api.transformFile(source, drawerObj, deleteOriginal, Callback.successOrError(cb, function(transformedPath)
        {
            api.getFileSizeDifference(newPath, transformedPath, Callback.successOrError(cb, function(sizeInfo)
            {
                function importComplete()
                {
                    api.updateFreeSpace(collection, sizeInfo.diff, null, Callback.successOrError(cb, function(collection)
                    {
                        var op = "added";

                        if (sizeInfo.origSize)
                        {
                            op = "updated";
                        }

                        api.contentsChanged(collection, op, drawer, rename);
                        collection.list(drawer, cb);

                    }));
                }

                // ensure directory exists
                fs.ensureDir(parentDir, Callback.successOrError(cb, function()
                {
                    // if we are deleting the original (or if the transformation created a temporary file),
                    // then move, otherwise copy
                    if ( (deleteOriginal) || (transformedPath != source) )
                    {
                        fs.rename(transformedPath, newPath, Callback.successOrError(cb, importComplete));
                    }
                    else
                    {
                        fs.copy(transformedPath, newPath, Callback.successOrError(cb, importComplete));
                    }
                }));

            }));
        }));
    });
}

// ------------------------------------------------------------------------------------------------------

/**
 * Perform any transformations that the given file import requires
 *
 * @param inputPath      Path to the input file
 * @param drawer         The drawer object that the file is going to be imported into
 * @param deleteOriginal Whether the file at inputPath should be deleted on successful transform
 * @param cb             The callback to invoke with the file path to import
 */
api.transformFile = function(inputPath, drawer, deleteOriginal, cb)
{
    // for now, no transformation occurs
    cb(null, inputPath);

}

// ------------------------------------------------------------------------------------------------------

/**
 * Notify interested users that the contents of a collection have changed
 *
 * @param collection The collection that was modified
 * @param operation  The operation that was performed
 * @param drawer     The drawer that was updated
 * @param file       The file that was added/updated/deleted
 */
api.contentsChanged = function(collection, operation, drawer, file)
{
    var event = "collection.file-" + operation;

    var data =
    {
        collection: collection,
        drawer:     drawer,
        file:       file
    };

    if (collection.name == "system")
    {
        socketIo.emitAll(event, null, data);
    }
    else
    {
        socketIo.emitAuthorized(event, "manage resources", collection._id, null, data);
    }

}

// ----------------------------------------------------------------------------------------------------------

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end collection.js
// ----------------------------------------------------------------------------------------------------------
