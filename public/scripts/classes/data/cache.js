'use strict';

angular.module('d20helper.data.cache', []).

/**
 * cache:
 *
 * Package containing helper classes for caching data
 *
 */
factory('cache', [

    '$rootScope', '$q', 'ajaxService',

    function($rootScope, $q, ajaxService)
    {
        var pkg = {};

        // --------------------------------------------------------------------------------------------------
        // Constructor
        // --------------------------------------------------------------------------------------------------

        /**
         * AsyncCache:
         *
         * class for managing asynchronous caches with helper methods for
         * updating/appending/removing/reordering/etc
         *
         * @constructor
         * @param       name The name of the cached data
         */
        pkg.AsyncCache = function(name)
        {
            this.name               = name;
            this.lastUpdate         = null;
            this.loading            = false;
            this.needsRefresh       = false;
            this.data               = null;
            this.promise            = null;
            this.requests           = 0;
            this.fetches            = 0;
            this.successfulUpdates  = 0;
            this.changeEvent        = null;

            if (pkg.AsyncCache.caches === undefined)
            {
                pkg.AsyncCache.caches = [];
            }

            pkg.AsyncCache.caches.push(this);
        }

        // --------------------------------------------------------------------------------------------------
        // Public interface
        // --------------------------------------------------------------------------------------------------

        /**
         * Query when the data was last updated
         *
         * @return {Date} A date object containing the timestamp of last update
         */
        pkg.AsyncCache.prototype.getLastUpdatedOn = function()
        {
            return this.lastUpdate;
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Query if the data in the cache is the initially set data
         *
         * @return {Boolean} true if the data is the initial data false if not loaded or has been updated
         */
        pkg.AsyncCache.prototype.isInitialData = function()
        {
            return (this.successfulUpdates == 1);
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Query if the data in the cache has been loaded
         *
         * @return {Boolean} true if the data in the cache has been loaded or is currently loading
         */
        pkg.AsyncCache.prototype.hasData = function()
        {
            return ( (this.successfulUpdates >= 1) || (this.promise) );
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Set the event emitted whenever the cached data is updated
         *
         * @param eventName  The event name
         * @param eventScope The scope to broadcast to
         */
        pkg.AsyncCache.prototype.setChangeEvent = function(eventName, eventScope)
        {
            this.changeEvent = { name: eventName, scope: eventScope };
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Load the given data item from the cache or from via the given callback
         *
         * The callback parameter can be a url which will be fetched via get, a request object per the
         * ajaxService.request method, or a callback method for a promise.
         *
         * @param  callback  Method to fetch the data if not present
         * @return {Promise} A promise to track the request
         */
        pkg.AsyncCache.prototype.load = function(callback)
        {
            var promise = null;
            var cache   = this;
            
            ++cache.requests;

            if ( (!cache.data) || (cache.needsRefresh) )
            {
                // are we already fetching the data? if so, then return the existing promise
                if (cache.promise)
                {
                    promise = cache.promise;
                }
                // if not, we need to fetch the data via the fetch callback
                else
                {
                    cache.fetches++;
                    cache.loading = true;

                    if (_.isFunction(callback))
                    {
                        promise = $q(callback);
                    }
                    else if (_.isString(callback))
                    {
                        promise = ajaxService.request({url: callback, method: 'get'});
                    }
                    else if (_.isObject(callback))
                    {
                        promise = ajaxService.request(callback);
                    }

                    cache.promise = promise;

                    // store the data in the cache
                    promise.then(function(data)
                    {
                        cache.needsRefresh = false;
                        cache.data         = data;

                        cache.updated();
                    });

                    // clean up the promise once the request is completed, either way
                    promise.finally(function ()
                    {
                        cache.loading = false;
                        cache.promise = null;
                    });
                }
            }
            // if data already exists and does not require update, then generate a promise that resolves with
            // the cached data
            else
            {
                promise = $q(function(resolve, reject)
                {
                    resolve(cache.data);
                });
            }

            return promise;
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Append data to a cache
         *
         * May wait until in-progress fetch completes before appending new data
         *
         * @param  item      The item to append
         * @return {Promise} A promise to track the request
         */
        pkg.AsyncCache.prototype.append = function(item)
        {
            var cache = this;
            
            return $q(function(resolve, reject)
            {
                var appendIt = function()
                {
                    if (!cache.data)
                    {
                        cache.data = [];
                    }

                    if (!_.isArray(cache.data))
                    {
                        cache.data = [cache.data];
                    }

                    cache.data.push(item);
                    cache.updated();

                    resolve(cache.data);
                }

                cache.onceStable(appendIt);
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Remove an item from the cache
         *
         * May wait until any in-progress fetch concludes before removing data
         *
         * @param  item      The item to remove
         * @return {Promise} Will resolve once the data has been removed
         */
        pkg.AsyncCache.prototype.remove = function(item)
        {
            var cache = this;
            
            return $q(function(resolve, reject)
            {
                var removeIt = function()
                {
                    if (cache.data)
                    {
                        if (_.isArray(cache.data))
                        {
                            cache.data = _.without(cache.data, item);
                        }
                        else if (_.isObject(cache.data))
                        {
                            delete cache.data[item];
                        }

                        cache.updated();
                    }

                    resolve(cache.data);
                }

                cache.onceStable(removeIt);
            });
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Mark the cache as updated, emitting any necessary events, etc
         */
        pkg.AsyncCache.prototype.updated = function()
        {
            this.lastUpdate = new Date();
            this.successfulUpdates++;

            if (this.changeEvent)
            {
                this.changeEvent.scope.$broadcast(this.changeEvent.name, this);
            }
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Find an object in the data based on the given criteria
         *
         * This method is essentially a pass-through to _.findWhere
         *
         * @param  searchObj Contains the fields to search for
         * @return {Object}  The data object or falsey if not found
         */
        pkg.AsyncCache.prototype.find = function(searchObj)
        {
            return _.findWhere(this.data, searchObj);
        }

        // --------------------------------------------------------------------------------------------------

        /**
         * Perform a task once the cache is stable
         *
         * @param callback The function to invoke once the cache is stable
         */
        pkg.AsyncCache.prototype.onceStable = function(callback)
        {
            if (this.promise)
            {
                this.promise.finally(callback);
            }
            else
            {
                callback();
            }
        }

        // --------------------------------------------------------------------------------------------------
        // Main script
        // --------------------------------------------------------------------------------------------------

        return pkg;

    }
]);

// ----------------------------------------------------------------------------------------------------------
// End cache.js
// ----------------------------------------------------------------------------------------------------------

