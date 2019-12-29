'use strict';

angular.module('d20helper.utilsService', []).

/**
 * Utility function service
 *
 * Provides helper functions for common tasks
 *
 */
factory('utilsService', ['$rootScope', '$q',

    function($rootScope, $q)
    {

        var service =
        {
            caches: []
        };

        // ------------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Perform a nested _.each on an object or array of objects
         *
         * @param obj The object(s)
         * @param nestField The name of the field to nest calls on
         * @param callback The function to call
         */
        service.nestedForEach = function (obj, nestField, callback)
        {
            if (_.isArray(obj))
            {
                _.each(obj, function (oneObj)
                {
                    service.nestedForEach(oneObj, nestField, callback);
                });
            }
            else
            {
                callback.call(this, obj);

                if ((_.isObject(obj)) && (obj[nestField]))
                {
                    _.each(obj[nestField], function (oneObj)
                    {
                        service.nestedForEach(oneObj, nestField, callback);
                    });
                }
            }
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Find the parent object of the given object
         *
         * @param root      The root object
         * @param obj       The object whose parent to locate
         * @param nestField The name of the field that nests objects (defaults to children)
         */
        service.findParent = function (root, obj, nestField)
        {
            nestField = nestField || 'children';

            var searchNode = function (parent, node)
            {
                if (node == obj)
                {
                    return parent;
                }

                if ((node[nestField]) && (node[nestField].length))
                {
                    var children = node[nestField];

                    for (var i in children)
                    {
                        var found = searchNode(node, children[i]);

                        if (found)
                        {
                            return found;
                        }
                    }
                }

                return null;
            };

            if (_.isArray(root))
            {
                for (var i in root)
                {
                    var found = searchNode(null, root[i]);

                    if (found)
                    {
                        return found;
                    }
                }
            }
            else
            {
                return searchNode(null, root);
            }

            return null;
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Update the permission targets for the given user
         *
         * The targeted permissions make it much easier to bind to in angular when viewing a particular object
         *
         * @param user The user to update
         */
        service.makePermissionTargets = function(user)
        {
            user.permissionTargets = {};

            if (user.user_permissions !== undefined)
            {
                user.isAdmin = false;

                _.each(user.user_permissions, function (permission)
                {
                    var targetId = permission.target || 'global';
                    var target = user.permissionTargets[targetId];

                    if (!target)
                    {
                        user.permissionTargets[targetId] = {};
                        target = user.permissionTargets[targetId];
                    }

                    target[permission.entitlement] = true;

                    if ((targetId == 'global') && (permission.entitlement == 'administrator'))
                    {
                        user.isAdmin = true;
                    }
                });
            }
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Get the error message from the given object
         *
         * The given object may be a javascript exception, an ajax error object, or a string
         *
         * @param  obj            The object
         * @param  defaultMessage The default message if none can be found
         * @return The error message or the default
         */
        service.getMessageFromError = function(obj, defaultMessage)
        {
            if ( (obj) && (obj.data) && (obj.data.message) && (_.isString(obj.data.message)) )
            {
                return obj.data.message;
            }

            if ( (obj) && (obj.message) && (_.isString(obj.message)) )
            {
                return obj.message;
            }

            if (_.isString(obj))
            {
                return obj;
            }

            return defaultMessage;
        }

        init();

        return service;
    }
]);
