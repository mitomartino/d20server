/**
 * **********************************************************************************************************
 * models/permission.js
 *
 * author: William Martino
 *
 * Mongoose binding for available permissions in the application
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var mongoose = require("mongoose");
var fs       = require('fs');
var path     = require('path');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var UploadCollection = new mongoose.Schema({
    name:        String,
    baseUrl:     String,
    quota:       Number,
    bytesUsed:   Number,
    type:        String,

    drawers:
    [
        {
            name:         String,
            contentType:  String,
            accept:       String,
            targetWidth:  Number,
            targetHeight: Number,
            icon:         String
        }
    ]
});

UploadCollection.methods.getDrawer = function(name)
{
    for (var ii in this.drawers)
    {
        if (this.drawers[ii].name == name)
        {
            return this.drawers[ii];
        }
    }
}

UploadCollection.methods.updateDrawer = function(name, values, callback)
{
    var found = false;

    for (var ii in this.drawers)
    {
        if (this.drawers[ii].name == name)
        {
            var drawer = this.drawers[ii];

            found = true;

            for (var field in values)
            {
                drawer[field] = values[field];
            }
        }
    }

    if (found)
    {
        this.save(callback);
    }
}

UploadCollection.methods.list = function(drawer, callback)
{
    var drawerObj         = this.getDrawer(drawer);

    if (!drawerObj)
    {
        callback('No such drawer: ' + drawer);
    }
    else
    {
        var thisCollection = this;
        var absPath = path.normalize(path.join(__dirname, "../", thisCollection._doc.baseUrl, drawer));

        fs.readdir(absPath, function (err, files)
        {
            if (err)
            {
                drawerObj._doc.contents = [];

                callback(null, thisCollection);
            }
            else
            {
                drawerObj._doc.contents = files;

                callback(null, thisCollection);
            }
        });
    }
};

module.exports = mongoose.model('upload_collection', UploadCollection);

// ----------------------------------------------------------------------------------------------------------
// end models/upload-collection.js
// ----------------------------------------------------------------------------------------------------------
