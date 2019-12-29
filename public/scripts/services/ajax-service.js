'use strict';

angular.module('d20helper.ajaxService', []).

/**
 * AJAX request service
 *
 * Provides helper functions and hooks for ajax requests
 *
 * Adds the ability to receive a callback whenever a request is made or whenever
 * a request fails.
 *
 */
factory('ajaxService', ['$rootScope', '$q', '$http',

    function($rootScope, $q, $http)
    {

        var service =
        {
            name:      'ajax-service',
            nextReqId: 1,
            model:
            {
                requests:
                [

                ]
            }
        };

        /**
         * Add a callback to handle any unsuccessful requests
         *
         * @param callback The method to invoke
         */
        service.addErrorHandler = function(callback)
        {
            $rootScope.$on('d20helper.ajaxService.error', callback);
        }

        /**
         * Add a callback to handle all requests
         *
         * @param callback The method to invoke
         */
        service.addRequestHandler = function(callback)
        {
            $rootScope.$on('d20helper.ajaxService.request', callback);
        }

        /**
         * Make an ajax request
         *
         * @param requestObj (see angular's $http service)
         * @return {{Promise}} a promise that resolves when the request succeeds
         */
        service.request = function(requestObj)
        {
            var promise = $q(function(resolve, reject)
            {
                try
                {
                    var reqInfo =
                    {
                        id: service.model.nextReqId++,
                        request: requestObj
                    };

                    if (_.isString(requestObj))
                    {
                        var newObj =
                        {
                            url:    requestObj,
                            method: 'get'
                        };

                        requestObj = newObj;
                    }

                    if (requestObj.pathParams)
                    {
                        requestObj.origUrl = requestObj.url;

                        for (var name in requestObj.pathParams)
                        {

                            requestObj.url = requestObj.url.replace(
                                ":" + name,
                                encodeURIComponent(requestObj.pathParams[name]));
                        }
                    }

                    service.model.busy = true;
                    service.model.requests.push(reqInfo);

                    $http(requestObj).then(
                        function (response)
                        {
                            if (response.data.status == 200)
                            {
                                resolve(response.data.details);
                            }
                            else
                            {
                                $rootScope.$broadcast('d20helper.ajaxService.error', requestObj, response.data);
                                reject(response);
                            }
                        },
                        function (response)
                        {
                            var errorObj =
                            {
                                status: response.status,
                                message: response.message
                            };

                            $rootScope.$broadcast('d20helper.ajaxService.error', requestObj, errorObj);
                            reject(response);
                        }
                    ).finally(
                        function ()
                        {
                            $rootScope.$broadcast('d20helper.ajaxService.request', requestObj);

                            service.model.requests = _.reject(service.model.requests, function (rejReq)
                            {
                                return (rejReq = reqInfo);
                            });

                            service.model.busy = (service.model.requests.length > 0);
                        }
                    );
                }
                catch (err)
                {
                    reject(err);
                }
            });

            return promise;
        }

        // ------------------------------------------------------------------------------------------------------
        // private methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
        }

        init();

        return service;

    }
]);
