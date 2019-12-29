/**
 * **********************************************************************************************************
 * models/user.js
 *
 * author: William Martino
 *
 * Mongoose binding for an accepted user in the application
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var mongoose       = require("mongoose");
var plm            = require('passport-local-mongoose');
var UserPermission = require('./user-permission');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var User = new mongoose.Schema({
    email:     String,
    password:  String,
    nickname:  String,
    avatar:    String,
    about:     String,
    isAdmin:   Number,
    isBanned:  Number,

    pronouns:
    {
        they:   String,
        them:   String,
        their:  String,
        theirs: String
    },

    status:
    {
        online: Boolean,
        what:   String,
        where:  String,
        when:   Number
    }
});

var options =
{
    usernameField: 'email'
};

User.plugin(plm, options);

// ----------------------------------------------------------------------------------------------------------
// model methods
// ----------------------------------------------------------------------------------------------------------

/**
 * Resolve foreign key references to this user
 *
 * @param references an array of model schemas specifying which references to fetch
 */
User.methods.resolve = function(references, callback)
{
    var i          = 0;
    var fieldName  = '';
    var foreignKey = '';
    var thisUser   = this;
    var thisModel  = thisUser.collection.name;

    function resolveNext(err, document)
    {
        if (i > 0)
        {
            if (err)
            {
                callback(err);
            }

            thisUser._doc[fieldName] = document;
        }

        var searchFor = null;

        while ( (searchFor == null) && (i < references.length) )
        {
            var ref       = references[i];
            var coll      = ref.collection;
            var schema    = ref.schema;

            for (var name in schema.paths)
            {
                var path = schema.paths[name];

                if (path.options.ref == thisModel)
                {
                    searchFor = {};

                    searchFor[name] = thisUser._id;
                }
            }

            ++i;
        }

        if (searchFor)
        {
            fieldName  = coll.name;
            ref.find(searchFor, resolveNext);
        }
        else
        {
            callback(null, thisUser);
        }
    }

    // kick off resolutions
    resolveNext();
}

module.exports = mongoose.model('users', User);

// ----------------------------------------------------------------------------------------------------------
// end models/user.js
// ----------------------------------------------------------------------------------------------------------
