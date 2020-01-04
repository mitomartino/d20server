'use strict';

angular.module('d20helper.admin.addUser', []).


/**
 * Controller for registering new user accounts
 *
 */
controller('AdminAddUserCtrl', ['$scope', '$mdDialog', 'utilsService', 'userService', 'constantsService',
    function($scope, $mdDialog, utilsService, userService, constants)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            constants.lookup("enums").then(function(enums)
            {
                $scope.pronouns = enums.user.pronouns;
            });

            $scope.tabs =
            [
                {
                    name:  'general',
                    title: 'The Basics',
                },
                {
                    name:  'aboutme',
                    title: 'About Me',
                },
                {
                    name:  'avatar',
                    title: 'Portrait'
                }
            ];

            $scope.view =
            {
                name: 'general'
            };

            $scope.reset();
        }

        /**
         * Reset the form
         */
        $scope.reset = function()
        {
            $scope.user =
            {
                avatar:   null,
                nickname: null,
                email:    null,
                pronouns: null,
                password: null
            };
            
            $scope.busy   = false;
            $scope.errors = [];
        }

        /**
         * ok/enter handler
         */
        $scope.ok = function()
        {
            $scope.addUser();
        }

        /**
         * Attempt to add a new user to the application
         */
        $scope.addUser = function()
        {
            if (!$scope.validate())
            {
                $scope.view.name = 'general';

                return;
            }

            $scope.busy = true;

            var req = userService.addUser($scope.user);

            var onSuccess = function(response)
            {
                $scope.busy = false;

                $mdDialog.hide(response.data);
            };

            var onError = function(response)
            {
                $scope.busy = false;

                $scope.errors =
                {
                    server: utilsService.getMessageFromError(response.data.message, 'Failed to add new user')
                };

                $scope.view.name = 'general';
            };

            req.then(onSuccess, onError);
        }

        /**
         * Validate input
         *
         * Sets errors if any input is invalid
         */
        $scope.validate = function()
        {
            return ($scope.conversationForm.$valid);
        }

        /**
         * Cancel addition of the user
         */
        $scope.cancel = function()
        {
            $mdDialog.cancel();
        }

        init();
    }
]);