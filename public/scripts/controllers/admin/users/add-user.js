'use strict';

angular.module('d20helper.admin.addUser', []).


/**
 * Controller for registering new user accounts
 *
 */
controller('AdminAddUserCtrl', ['$scope', '$http', '$uibModalInstance', 'userService', 'constantsService',
    function($scope, $http, $uibModalInstance, userService, constants)
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

                $uibModalInstance.close(response.data);
            };

            var onError = function(response)
            {
                $scope.busy = false;

                $scope.errors =
                {
                    server: response.data.message
                };

                $scope.view = 'general';

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
            var valid  = true;

            $scope.errors = {};

            if ( (!$scope.user.email) || ($scope.user.email.indexOf('@') == -1) )
            {
                valid = false;
                $scope.errors.email = 'must be a valid email address';
            }

            if ( (!$scope.user.nickname) || (!$scope.user.nickname.length) || ($scope.user.nickname.length > 16) )
            {
                valid = false;
                $scope.errors.nickname = 'must be between 1 and 16 characters';
            }

            if ( (!$scope.user.password) || ($scope.user.password.length < 6) )
            {
                valid = false;
                $scope.errors.password = 'must contain at least 6 characters';
            }

            if (!$scope.user.pronouns)
            {
                valid = false;
                $scope.errors.pronouns = 'must contain a valid selection';
            }

            return (valid);
        }

        /**
         * Cancel addition of the user
         */
        $scope.cancel = function()
        {
            $uibModalInstance.dismiss('cancel');
        }

        init();
    }
]);