'use strict';

angular.module('d20helper.data.structures', []).

/**
 * structures:
 *
 * Package containing helper classes for caching data
 *
 */
factory('structures', [

    function()
    {
        var pkg = {};

        // --------------------------------------------------------------------------------------------------
        // Constructor
        // --------------------------------------------------------------------------------------------------

        /**
         * HashList:
         *
         * class for managing lists of items by lookup
         *
         * @constructor
         */
        pkg.HashList = function()
        {
            this.lookup = {};
        }

        // --------------------------------------------------------------------------------------------------
        // Public interface
        // --------------------------------------------------------------------------------------------------

        /**
         * Clear the hash list
         *
         * @param key (optional) The key to clear out or the entire list if not provided
         */
        pkg.HashList.prototype.clear = function(key)
        {
            if (key)
            {
                this.lookup[key] = [];
            }
            else
            {
                this.lookup = {};
            }
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Put a value into the structures
         *
         * @param key   The key to insert the value under
         * @param value The value to append
         */
        pkg.HashList.prototype.put = function(key, value)
        {
            var list = this.lookup[key];

            if (!list)
            {
                list = [];
                this.lookup[key] = list;
            }

            list.push(value);
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Put an array of values into the structures
         *
         * @param key    The key to insert the value under
         * @param values The values to append
         */
        pkg.HashList.prototype.putAll = function(key, values)
        {
            var list = this.lookup[key];

            if (!list)
            {
                list = [];
                this.lookup[key] = list;
            }

            list.push.apply(list, values);
        }

        /**
         * Process each object in the hash list or under the given key
         *
         * @param key The key (optional)
         * @param cb  The callback to invoke
         */
        pkg.HashList.prototype.each = function(key, cb)
        {
            if (!cb)
            {
                var arr = [];

                cb = key;

                for (var key in this.lookup)
                {
                    arr.push.apply(arr, this.lookup[key])
                }

                _.each(arr, cb);
            }
            else
            {
                var list = this.lookup[key];

                _.each(list, cb);
            }
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Generate pass-throughs to _.js methods
         */
        _.each(["findWhere", "find", "indexOf"], function(func)
        {
            var delegate = _[func];

            pkg.HashList.prototype[func] = function()
            {
                var key  = arguments[0];
                var list = this.lookup[key];

                if (!list)
                {
                    list = [];
                    this.lookup[key] = list;
                }

                arguments[0] = list;

                return delegate.apply(delegate, arguments);
            }
        });

        _.each(["filter", "sortBy", "reject", "indexOf"], function(func)
        {
            var delegate = _[func];

            pkg.HashList.prototype[func] = function()
            {
                var key  = arguments[0];
                var list = this.lookup[key];

                if (!list)
                {
                    list = [];
                    this.lookup[key] = list;
                }

                arguments[0] = list;

                this.lookup[key] = delegate.apply(delegate, arguments);

                return this;
            }
        });

        // --------------------------------------------------------------------------------------------------
        // Main script
        // --------------------------------------------------------------------------------------------------

        return pkg;

    }
]);

// ----------------------------------------------------------------------------------------------------------
// End structures.js
// ----------------------------------------------------------------------------------------------------------

