'use strict';

angular.module('d20helper.login', ['ngRoute']).

/**
 * Establish routes
 *
 * state: login
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'scripts/controllers/login/login.html',
        controller: 'LoginCtrl',
        data:
        {
            title: 'Login'
        }
    });
}]).

/**
 * Establish routes
 *
 * state: logout
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {

    $stateProvider.state('logout', {
        url: '/logout',
        templateUrl: 'scripts/controllers/login/logout.html',
        controller: 'LoginCtrl',
        data:
        {
            title: 'Logout'
        }
    });
}]).

/**
 * Controller for logging in/out of the application
 */
controller('LoginCtrl', ['$scope', '$timeout', 'constantsService', 'applicationService',

    function($scope, $timeout, constants, applicationService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.loginStatus = applicationService.model.loginStatus;

            $scope.user =
            {
                email:    '',
                password: ''
            };

            $scope.errors = {};

            if (!$scope.loginStatus.continueAttempted)
            {
                $scope.info = 'Attempting to continue your previous session';

                applicationService.continue().then(
                    null,
                    function(err)
                    {
                        $scope.info = null;
                    }
                );
            }
        }

        /**
         * Perform a login
         *
         * @param event The event that caused the login
         */
        $scope.login = function(event)
        {
            if (event)
            {
                event.preventDefault();
            }

            if (!$scope.validateLogin())
            {
                return;
            }

            var req = applicationService.login($scope.user.email, $scope.user.password);

            var onSuccess = function(response)
            {

            };

            var onError = function(response)
            {
                $scope.errors =
                {
                    server: response.data.message
                };
            };

            req.then(onSuccess, onError);
        }

        /**
         * Validate login form data
         *
         * @return {boolean} true on success, false on error
         */
        $scope.validateLogin = function()
        {
            var valid  = true;

            $scope.errors = {};

            if ( (!$scope.user.email) || ($scope.user.email.length < 1) )
            {
                valid = false;
                $scope.errors.email = 'E-mail must be provided';
            }

            if ( (!$scope.user.password) || ($scope.user.password.length < 1) )
            {
                valid = false;
                $scope.errors.password = 'Password must be provided';
            }

            return (valid);
        }

        /**
         * Log out of the server
         */
        $scope.logout = function()
        {
            var req = applicationService.logout();

            req.then(
                null,
                function(err)
                {
                    $scope.errors =
                    {
                        server: 'Oops! We failed to log you out!'
                    }
                }
            )
        }

        init();

    }
]);