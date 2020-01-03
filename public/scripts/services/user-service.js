'use strict';

angular.module('d20helper.userService', []).

/**
 * User account management service
 *
 * Allows loading/selection/addition/updating/deletion of users
 *
 */
factory('userService', ['$rootScope', '$q', '$state', '$transitions', 'ajaxService', 'applicationService', 'utilsService', 'collectionService', 'cache',

    function($rootScope, $q, $state, $transitions, ajaxService, applicationService, utilsService, collectionService, cache)
    {
        var service =
        {
            name: 'userService',
            model:
            {
                users: new cache.AsyncCache("users")
            }
        };

        // ------------------------------------------------------------------------------------------------------

        /**
         * Load the set of existing users
         *
         * @return {Promise} a promise to track the request
         */
        service.loadUsers = function()
        {
            return service.model.users.load(function(resolve, reject) {

                var request = ajaxService.request({
                    method: 'get',
                    url:    '/services/user/list'
                });

                request.then(
                    function(data)
                    {
                        service.model.users.data = data;

                        applyCurrentUser();

                        _.each(service.model.users.data, function(user) {
                            processUser(user);
                        });

                        resolve(service.model.users.data);
                    },
                    function(error)
                    {
                        reject(error);
                    }
                );
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Add a new user
         *
         * userInfo should minimally contain:
         *  email:    a valid email address
         *  nickname: a display name for the user
         *  password: a password for the user
         *
         * @param userInfo The user information object
         * @return {Promise} a promise to track the request
         */
        service.addUser = function(userInfo)
        {
            return ajaxService.request(
            {
                method: 'post',
                url: '/services/user/register',
                data: userInfo
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Delete a user
         *
         * @param  user      The user to delete or the user id of the user to delete
         * @return {Promise} a promise to track the request
         */
        service.deleteUser = function(user)
        {
            var userId = user._id || user;

            return ajaxService.request({
                method: 'get',
                url: '/services/user/:userId/delete',
                pathParams:
                {
                    userId: userId
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Permit the given user to perform the given action
         *
         * @param user   The user to update permissions for
         * @param action The action to add permission for
         * @param target The target object to add permission for
         */
        service.permitUser = function(user, action, target)
        {
            var userId = user._id || user.id || user;

            target = target || null;

            if (target == 'global')
            {
                target = null;
            }

            return ajaxService.request({
                method: 'post',
                url: '/services/user/:userId/permit',
                data:
                {
                    entitlement: action,
                    target:      target
                },
                pathParams:
                {
                    userId: userId
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * No longer permit the given user to perform the given action
         *
         * @param user   The user to update permissions for
         * @param action The action to remove permission for
         * @param target The target object to remove permission for
         */
        service.denyUser = function(user, action, target)
        {
            var userId = user._id || user.id || user;

            target = target || null;

            if (target == 'global')
            {
                target = null;
            }

            return ajaxService.request({
                method: 'post',
                url: '/services/user/:userId/deny',
                data:
                {
                    entitlement: action,
                    target:      target
                },
                pathParams:
                {
                    userId: userId
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Load the detailed information for the given user
         *
         * @param   user The user to load detailed information for
         * @returns {Promise} A promise to track success
         */
        service.loadUserDetails = function(user)
        {
            return $q(function(resolve, reject) {

                var userId = user._id || user.id || user;

                var request = ajaxService.request({
                    method:     'get',
                    url:        '/services/user/:userId/details',
                    pathParams: { userId: userId }
                });

                request.then(
                    function(data)
                    {
                        var user = _.findWhere(service.model.users.data, {_id: userId});

                        if (user)
                        {
                            angular.extend(user, data);
                            user.hasDetails = true;

                            processUser(user);
                        }

                        resolve(user);
                    },
                    function(err)
                    {
                        reject(err);
                    }
                )
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Set the given user's avatar
         *
         * @param user       The user to update
         * @param avatar     The new avatar
         * @return {Promise} A promise to track the request
         */
        service.setAvatar = function(user, avatar)
        {
            var userId  = user._id || user;

            return $q(function(resolve, reject)
            {
                var req = ajaxService.request(
                    {
                        method: 'post',
                        url:    '/services/user/:userId/setAvatar',
                        pathParams:
                        {
                            userId: userId
                        },
                        data:
                        {
                            avatar: avatar
                        }
                    });

                req.then(
                    function(updatedUser)
                    {
                        var userObj = _.findWhere(service.model.users.data, {_id: userId});

                        if (userObj)
                        {
                            userObj.avatar = avatar;
                        }

                        resolve(updatedUser);
                    },
                    reject
                );
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Ban the given user from this server
         *
         * @param user       The user to update
         * @return {Promise} A promise to track the request
         */
        service.banUser = function(user)
        {
            var userId  = user._id || user;

            return ajaxService.request(
            {
                method: 'get',
                url:    '/services/user/:userId/ban',
                pathParams:
                {
                    userId: userId
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Lift any ban on the given user from this server
         *
         * @param user       The user to update
         * @return {Promise} A promise to track the request
         */
        service.unbanUser = function(user)
        {
            var userId  = user._id || user;

            return ajaxService.request(
            {
                method: 'get',
                url:    '/services/user/:userId/unban',
                pathParams:
                {
                    userId: userId
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Query the currently edited user
         *
         * @return The user currently being edited if any
         */
        service.editingUser = function()
        {
            return service.model.users.editing;
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Show details for the given user
         *
         * Note: The service enforces a policy of one user showing details at a time.
         *
         * @param user The user to show details for
         */
        service.showUserDetails = function(user)
        {
            return $q(function(resolve, reject)
            {
                if (service.model.users.editing)
                {
                    service.hideUserDetails(service.model.users.editing);
                }

                service.loadUserDetails(user).then(
                    function()
                    {
                        service.model.users.editing = user;
                        service.model.users.editing.showingDetails = true;

                        service.setUserConfig("editingUser", user._id);

                        resolve(user);
                    },
                    reject
                );
            })
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Hide details for the given user
         *
         * Note: The service enforces a policy of one user showing details at a time.
         *
         * @param user The user to show details for
         */
        service.hideUserDetails = function(user)
        {
            if (service.model.users.editing)
            {
                service.model.users.editing.showingDetails = false;
                service.model.users.editing.hasDetails     = false;

                service.setUserConfig("editingUser", null);
            }
        }

        // ------------------------------------------------------------------------------------------------------
        // private methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Process a given user
         *
         * Invoked on new users
         *
         * @param user The user to process
         */
        function processUser(user)
        {
            if ( (service.model.avatars) && (!user.avatar) )
            {
                user.avatar = service.model.avatars.baseUrl + '/default.png';
            }

            user.pronounsLabel =
                user.pronouns.they  + "/" +
                user.pronouns.them  + "/" +
                user.pronouns.their + "/" +
                user.pronouns.theirs;

            utilsService.makePermissionTargets(user);
            determineIfManaged(user);

            if (user == applicationService.model.currentUser)
            {
                _.each(service.model.users.data, function(user)
                {
                    determineIfManaged(user);
                });
            }

            collectionService.loadCollection(user._id).then(
                function(collection)
                {
                    user.files = collection;
                },
                function (err)
                {
                    user.files = null;
                }
            );
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Apply the current user to the user list
         */
        function applyCurrentUser()
        {
            var currentUser = applicationService.model.currentUser;
            var id          = currentUser._id;
            var users       = service.model.users.data;

            for (var ii in users)
            {
                var user = users[ii];

                if (user._id == id)
                {
                    if (user.hasDetails)
                    {
                        delete currentUser.user_permissions;
                        delete currentUser.permissionTargets;

                        angular.extend(currentUser, user);
                    }

                    processUser(currentUser);

                    users[ii] = currentUser;

                    return;
                }
            }
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Set the isManaged field for the given user
         *
         * @param user The user to modify
         */
        function determineIfManaged(user)
        {
            var currentUser = applicationService.model.currentUser;

            if (!currentUser)
            {
                user.isManaged = false;
            }
            else
            {
                var globals = currentUser.permissionTargets['global'];

                if ( (globals) && (globals['administrator']) )
                {
                    user.isManaged = true;
                }
                else
                {
                    var target  = currentUser.permissionTargets[user._id];

                    user.isManaged = ( (target) && (target['manage users']) );
                }
            }
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
            service.model.users.setChangeEvent("users.changed", $rootScope);

            function getUser(userId)
            {
                var user = applicationService.model.currentUser;

                if (userId == user._id)
                {
                    return user;
                }

                return service.model.users.find({_id: userId});
            }

            // respond to new users
            applicationService.onServerUpdate("user.added", null, function(data)
            {
                if (service.model.users.hasData())
                {
                    processUser(data);
                    service.model.users.append(data);
                }
            });

            // respond to deleted users
            applicationService.onServerUpdate("user.deleted", null, function(userId)
            {
                var user = getUser(userId);

                if (user)
                {
                    service.model.users.remove(user).then(function()
                    {
                        if (user == service.model.users.editing)
                        {
                            service.model.users.editing = null;
                        }
                    });

                    if (user == applicationService.model.currentUser)
                    {
                        applicationService.logout();
                    }
                }

            });

            // respond to user status
            applicationService.onServerUpdate("user.status", null, function(status)
            {
                var user = getUser(status.userId);

                if (user)
                {
                    user.status = status;
                }
            });

            // respond to user banned
            applicationService.onServerUpdate("user.banned", null, function(update)
            {
                var user = getUser(update.user);

                if (user)
                {
                    user.isBanned = update.banned;

                    if (user == applicationService.model.currentUser)
                    {
                        if (user.isBanned)
                        {
                            $state.go('banned');
                        }
                        else
                        {
                            $state.go('dashboard');
                        }
                    }
                }
            });

            // respond to user config
            applicationService.onServerUpdate("user.settings.changed", null, function(data)
            {
                applicationService.model.currentUser.user_settings.settings[data.key] = data.value;
            });

            // respond to user receiving a file collection
            applicationService.onServerUpdate("collection.created", null, function(data)
            {
                if (data.type == "user")
                {
                    var user = getUser(data.name);

                    if (user)
                    {
                        processUser(user);
                    }
                }
            });

            // respond to user granted a permission
            applicationService.onServerUpdate("user.permitted", null, function(update)
            {
                var user = getUser(update.userId);

                if (user)
                {
                    if (!user.user_permissions)
                    {
                        user.user_permissions = [];
                    }

                    var permission = _.findWhere(user.user_permissions, {entitlement: update.entitlement, target: update.target});

                    if (!permission)
                    {
                        user.user_permissions.push({entitlement: update.entitlement, target: update.target});
                    }

                    utilsService.makePermissionTargets(user);

                    if (user == applicationService.model.currentUser)
                    {
                        update.type = "permitted";

                        $rootScope.$broadcast("user.permissionsChanged", update);
                    }
                }
            });

            // respond to user denies a permission
            applicationService.onServerUpdate("user.denied", null, function(update)
            {
                var user = getUser(update.userId);

                if (user)
                {
                    if (!user.user_permissions)
                    {
                        user.user_permissions = [];
                    }

                    user.user_permissions = _.reject(user.user_permissions, function(permission)
                    {
                        return ( (permission.entitlement  == update.entitlement) &&
                                 (permission.target       == update.target) );
                    });

                    utilsService.makePermissionTargets(user);

                    if (user == applicationService.model.currentUser)
                    {
                        update.type = "denied";

                        $rootScope.$broadcast("user.permissionsChanged", update);
                    }
                }
            });

            $transitions.onSuccess({}, function()
            {
                if (service.model.users.editing)
                {
                    service.hideUserDetails(service.model.users.editing);
                    service.model.users.editing = null;
                }
            });

            collectionService.loadCollection('system').then(
                function(system)
                {
                    var avatars = _.findWhere(system.drawers, {name: 'avatars'});

                    if (avatars)
                    {
                        service.model.avatars         = avatars;
                        service.model.avatars.baseUrl = system.baseUrl + 'avatars';
                    }

                    _.each(service.model.users.data, function (user)
                    {
                        if (!user.avatar)
                        {
                            user.avatar = service.model.avatars.baseUrl + '/default.png';
                        }
                    });
                },
                function(err)
                {
                    // no system drawer
                });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Query the given user value
         *
         * @param  key    The key to query
         * @return Object The value
         */
        service.getUserConfig = function(key)
        {
            return applicationService.model.currentUser.user_settings.settings[key];
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Set the given user value to the given value
         *
         * @param  key       The key to query
         * @param  value     The value to set
         * @return {Promise} A promise to track the request
         */
        service.setUserConfig = function(key, value)
        {
            var def =
            {
                method: "post",
                url:    "/services/user/settings/set",
                data:
                {
                    key:    key,
                    value:  value
                }
            };

            return ajaxService.request(def);
        }

        // ------------------------------------------------------------------------------------------------------

        init();

        return service;
    }
]);
