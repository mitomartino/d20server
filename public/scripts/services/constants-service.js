'use strict';

angular.module('d20helper.constantsService', []).

/**
 * Constant definition service
 *
 */
factory('constantsService', ['$rootScope', 'ajaxService', 'utilsService', 'cache',

    function($rootScope, ajaxService, utilsService, cache)
    {
        var service =
        {
            KEYS:
            {
                ENTER: 13,
                ESC:   27
            },

            lookupCache:
            {

            },
        };

        /**
         * Fetch the lookup table with the given name
         *
         * @param  name      The lookup table to retrieve
         * @param  search    (optional) Search object to pass into _.findWhere to return a particular item
         * @return {Promise} a promise to track success or failure, resolves with the table data
         */
        service.lookup = function(name, search)
        {
            var dataName = name;

            if (search)
            {
                dataName += '-' + JSON.stringify(search);
            }

            if (!service.lookupCache[dataName])
            {
                service.lookupCache[dataName] = new cache.AsyncCache(dataName);
            }

            return service.lookupCache[dataName].load(function(resolve, reject)
            {
                var req = ajaxService.request({
                    method:     'get',
                    url:        '/services/lookup/:name',
                    pathParams: {name: name}
                });

                req.then(
                    function (data)
                    {
                        if (search)
                        {
                            data = _.findWhere(data, search);
                        }

                        resolve(data);
                    },
                    function(err)
                    {
                        reject(err);
                    }
                );
            });
        }

        return service;

}]);
