'use strict';

angular.module('d20helper.applicationService', []).

/**
 * Application service
 *
 * Manages application-level settings
 *
 * Provides helper methods for managing application-level properties
 *
 *  getMainMenuItems()
 *  setOptionMenuItems()
 *  getOptionMenuItems()
 *  setStatusText(text)
 *  setTitle(title)
 *
 */
factory('applicationService', ['$rootScope', '$state', '$stateParams', '$q', '$timeout', 'ajaxService', 'utilsService', "socketService",

    function($rootScope, $state, $stateParams, $q, $timeout, ajaxService, utilsService, socketService)
    {
        var service =
        {
            model:
            {
                title:        'D20 Toolbox',
                mainMenu:     [],
                optionsMenu:  [],
                statusText:   null,
                currentUser:  null,
                loginStatus:
                {
                    loggedIn:          false,
                    loginMessage:      'You must log in to play on this server',
                    nextState:         null,
                    nextStateData:     null,
                    busy:              false,
                    continueAttempted: false
                },
                currentModal: null,
                state: 'unknown'
            }
        };

        // ---------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
            ajaxService.addErrorHandler(function(event, request, response) {
                console.log('error', request, response);

                // auto-logout on any unauthorized attempts
                if ( (response) && (response.status) && (response.status == 401) )
                {
                    if (response.details.loggedIn === false)
                    {
                        $state.go('login');
                    }
                    else
                    {
                        $state.go('unauthorized');
                    }
                }
            });

            $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {

                if (service.model.currentModal)
                {
                    service.model.currentModal.close();
                }

                if ( (!service.model.loginStatus.loggedIn) &&
                     (toState.name != 'login')             &&
                     (toState.name != 'not-found') )
                {
                    event.preventDefault();

                    service.model.loginStatus.nextState     = toState.name;
                    service.model.loginStatus.nextStateData = toParams;

                    $state.go('login');
                }
                else if ( (service.model.currentUser)          &&
                          (service.model.currentUser.isBanned) &&
                          (toState.name != 'banned')           &&
                          (toState.name != 'logout')           &&
                          (toState.name != 'login')            &&
                          (toState.name != 'unauthorized') )
                {
                    event.preventDefault();

                    $state.go('banned');
                }
            });

            service.setTitleFromState();
            service.setStatusFromState();

            $rootScope.$on('$stateChangeSuccess', function(){
                service.setTitleFromState();
                service.setStatusFromState();
            });
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Set the title for the application based on the current state
         */
        service.setTitleFromState = function()
        {
            service.model.state = $state.current.name;

            if ( ($state) && ($state.current) && ($state.current.data) && ($state.current.data.title) )
            {
                service.model.title = $state.current.data.title;
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Set the user status based on the current state
         */
        service.setStatusFromState = function()
        {
            service.model.state = $state.current.name;

            if ( ($state) && ($state.current) && ($state.current.data) && ($state.current.data.status) )
            {
                service.sendServerUpdate(
                    "user.setStatus",
                    {
                        online: true,
                        what:   $state.current.data.status,
                        where:  $state.current.data.title
                    }
                );
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Set the title text
         *
         * @param text The new text
         */
        service.setTitle = function(text)
        {
            service.model.title = text;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Log into the application
         *
         * @param  email     The email address to log in as
         * @param  password  The password to use to log in
         * @return {Promise} a promise to track success or failure
         */
        service.login = function(email, password)
        {
            var status = service.model.loginStatus;

            return $q(function(resolve, reject) {

                status.busy = true;

                var req = ajaxService.request({
                    method: 'post',
                    url:    '/services/user/login',
                    data:
                    {
                        email:    email,
                        password: password
                    }
                });

                req.then(
                    function (data)
                    {
                        service.postLogin(data);

                        socketService.begin().then(
                            function(connection)
                            {
                                resolve(data);
                            },
                            reject
                        );
                    },
                    reject
                );

                req.finally(function () {
                    status.busy = false;
                });
            });
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Attempt to continue an existing session
         *
         * @return {Promise} a promise to track success or failure
         */
        service.continue = function()
        {
            var status = service.model.loginStatus;

            return $q(function(resolve, reject) {

                status.busy              = true;
                status.continueAttempted = true;

                $timeout(function() {

                    var req = ajaxService.request({
                        method: 'get',
                        url:    '/services/user/continue'
                    });

                    req.then(
                        function (data)
                        {
                            service.postLogin(data);

                            socketService.begin().then(
                                function(connection)
                                {
                                    resolve(data);
                                },
                                reject
                            );
                        },
                        function(err)
                        {
                            reject(err);
                        }
                    );

                    req.finally(function () {
                        status.busy = false;
                    });
                },
                1000);
            });
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Proceed after a successful login/continue
         *
         * @param userData data defining the currently logged in user
         */
        service.postLogin = function(userData)
        {
            var status    = service.model.loginStatus;
            var nextState = status.nextState || 'dashboard';

            if ( (nextState == 'login') || (nextState == 'logout') )
            {
                nextState = 'dashboard';
            }

            _.each(userData.user_permissions, function(perm)
            {
                if (!perm.target)
                {
                    perm.target = null;
                }
            });

            service.model.currentUser = userData;
            utilsService.makePermissionTargets(userData);

            var menuReq = ajaxService.request({
                method: 'get',
                url: '/services/menu/main'
            });

            menuReq.then(function(menu){
                service.model.mainMenu = menu;
            });

            status.loggedIn = true;

            $state.go(nextState, status.nextStateData);

            status.nextState     = null;
            status.nextStateData = null;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Log out of the application
         *
         * @return {Promise} a promise to track success or failure
         */
        service.logout = function()
        {
            var status = service.model.loginStatus;

            return $q(function(resolve, reject) {

                status.busy = true;

                var req = ajaxService.request({
                    method: 'get',
                    url:    '/services/user/logout'
                });

                req.then(
                    function (data)
                    {
                        socketService.end();

                        status.loggedIn = false;
                        status.loginMessage = "You have successfully logged out";

                        $state.go('login');

                        status.nextState     = 'dashboard';
                        status.nextStateData = null;

                        resolve(data);
                    },
                    function(err)
                    {
                        reject(err);
                    }
                );

                req.finally(function () {
                    status.busy = false;
                });
            });
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Register a callback for a particular type of message
         *
         * @param name     The event name
         * @param scope    The scope to tie the liftime of the callback to (or null)
         * @param callback The callback
         */
        service.onServerUpdate = function(name, scope, callback)
        {
            socketService.on(name, scope, callback);
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * De-register a callback for a particular type of message
         *
         * @param name     The event name
         * @param callback The callback
         */
        service.offServerUpdate = function(name, callback)
        {
            socketService.off(name, callback);
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Send a message to the real-time connection
         *
         * @param name The event name
         * @param data The event data
         */
        service.sendServerUpdate = function(name, data)
        {
            socketService.emit(name, data);
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Authorize an action on an object
         *
         * The special target any will authorize if the user is authorized to perform this action on at least one
         * object.
         *
         * @param  action    the action to authorize
         * @param  target    the target object (optional)
         * @return {boolean} true if authorized else false
         */
        service.isAuthorized = function(action, target)
        {
            var user = service.model.currentUser;

            if ( (user) && (user.user_permissions) )
            {
                var global = user.permissionTargets.global;

                // admin's can do anything
                if (user.isAdmin)
                {
                    return true;
                }
                // otherwise if permissible to this user on all objects, then authorized
                else if ( (global) && (global[action]) )
                {
                    return true;
                }
                // otherwise, if the target is "any" then authorize if there exists an object on which
                // the user can perform this action
                else if (target == 'any')
                {
                    for (var target in user.permissionTargets)
                    {
                        if (user.permissionTargets[target][action])
                        {
                            return true;
                        }
                    }
                }
                // else test for particular object
                else if ( (target) && (target != 'global') )
                {
                    if ( (target) && (user.permissionTargets[target]) && (user.permissionTargets[target][action]) )
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Register a callback for whenever permissions have changed
         *
         * @param callback The callback to invoke
         */
        service.onPermissionChange = function(callback)
        {
            $rootScope.$on('current-user:permissions-changed', callback);
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Notify the application service that permissions have changed
         */
        service.permissionsChanged = function()
        {
            $rootScope.$broadcast('current-user:permissions-changed');
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Get the main menu items
         *
         * @return The main menu items
         */
        service.getMainMenuItems = function()
        {
            return service.model.mainMenu;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Get the options menu items
         *
         * @return The options menu items
         */
        service.getOptionsMenuItems = function()
        {
            return service.model.optionsMenu;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Set the options menu items
         *
         * @param menu The options menu items
         */
        service.setOptionsMenuItems = function(menu)
        {
            service.model.optionsMenu = menu;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Set the status text to display in the footer
         *
         * @param text
         */
        service.setStatusText = function(text)
        {
            service.model.statusText = text;
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Test whether or not a state with the given name exists
         *
         * @param state The name of the state to search for
         */
        service.stateExists = function(state)
        {
            return _.findWhere($state.get(), {name: state});
        }

        // ---------------------------------------------------------------------------------------------------

        init();

        return service;
    }
]);
