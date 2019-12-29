'use strict';

angular.module('d20helper.admin.users', ['ngRoute']).

/**
 * Establish route
 *
 * state: users
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider)
{
    $stateProvider.state('admin-users',
    {
        url: '/admin-users',
        templateUrl: 'scripts/controllers/admin/users/users.html',
        controller: 'AdminUsersCtrl',
        data:
        {
            title:  'Users',
            status: 'In Admin'
        }
    });
}]).

/**
 * Controller for managing user accounts
 *
 * Manages add/delete/grant permissions/search/etc
 */
controller('AdminUsersCtrl', [

    '$scope', '$rootScope', '$timeout', 'modalService', 'userService', 'constantsService', 'applicationService',

    function($scope, $rootScope, $timeout, modalService, userService, constants, applicationService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.userModel     = userService.model.users;
            $scope.currentFilter = null;
            $scope.filterText    = "";

            $rootScope.$on("users.changed", function()
            {
                $scope.filterByNickname();
            });

            $timeout(
                function()
                {
                    userService.loadUsers().then(function()
                    {
                        $scope.filterByNickname();
                    });
                },
                100
            );
        }

        /**
         * Filter the visible users
         */
        $scope.filterByNickname = function()
        {
            $scope.currentFilter = $scope.filterText;

            _.each($scope.userModel.data, function(user)
            {
                user.showingDetails = false;
            });

            $scope.applyFilter();
        }

        /**
         * Apply the current filter
         */
        $scope.applyFilter = function()
        {
            if ( ($scope.currentFilter) && ($scope.currentFilter.length) )
            {
                $scope.filteredUsers = _.filter($scope.userModel.data, function (user)
                {
                    return ( (user.isManaged) &&
                             (user.nickname)  &&
                             (user.nickname.indexOf($scope.currentFilter) != -1) );
                });
            }
            else
            {
                $scope.clearFilter();
            }
        }

        /**
         * Stop filtering the visible users
         */
        $scope.clearFilter = function()
        {
            $scope.filteredUsers = _.filter($scope.userModel.data, function(user)
            {
                return user.isManaged;
            });

            $scope.filterText    = '';
            $scope.currentFilter = null;
        }

        /**
         * Add a new user
         */
        $scope.addUser = function()
        {
            var modalInstance = modalService.open(
            {
                templateUrl: 'scripts/controllers/admin/users/add-user.html',
                controller: 'AdminAddUserCtrl',
                resolve:
                {

                }
            });

            modalInstance.result.then(function(newUser)
            {
               $scope.filterByNickname();
            });

            applicationService.model.currentModal = modalInstance;
        }

        /**
         * Respond to the user pressing a key
         *
         * Submits search on enter key; clears on escape
         *
         * @param $event The event to process
         */
        $scope.keyDown = function($event)
        {
            if ($event.keyCode == constants.KEYS.ENTER)
            {
                $scope.filterByNickname();
            }
            else if ($event.keyCode == constants.KEYS.ESC)
            {
                $scope.clearFilter();
            }
        }

        init();

    }
]);