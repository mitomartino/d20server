'use strict';

angular.module('d20helper.user.profile', ['ngRoute']).

/**
 * Establish route
 *
 * state: profile
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider)
{
    $stateProvider.state('profile',
    {
        url:         '/profile/:userId',
        templateUrl: 'scripts/controllers/user/profile.html',
        controller:  'UserProfileCtrl',
        params:
        {
            userId: null
        },
        data:
        {
            status: 'Viewing Profiles'
        }
    });
}]).

/**
 * Controller for managing user's profile
 *
 * View/edit upcoming events
 */
controller('UserProfileCtrl', ['$transitions', '$scope', '$state', '$stateParams', 'applicationService', 'userService',

    function($transitions, $scope, $state, $stateParams, applicationService, userService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            // when the state changes, we want to try to update our message
            $transitions.onSuccess({}, function(transition)
            {
                $scope.setUserFromState();
            });

            $scope.$watch("user", function (newVal)
            {
                if (newVal)
                {
                    if (newVal == applicationService.model.currentUser)
                    {
                        applicationService.setTitle("My Profile");
                    }
                    else
                    {
                        applicationService.setTitle(newVal.nickname);
                    }
                }
                else
                {
                    applicationService.setTitle("Users");
                }
            });

            $scope.setUserFromState();
        }

        /**
         * Set the current user to display based on the target state
         *
         */
        $scope.setUserFromState = function()
        {
            if ( ($state.current) && ($state.current.name == "profile") )
            {
                userService.loadUsers().then(function(users)
                {
                    var user = applicationService.model.currentUser;

                    if ($stateParams)
                    {
                        user = _.findWhere(users, {_id: $stateParams.userId});
                    }

                    if (!user)
                    {
                        user = applicationService.model.currentUser;
                    }

                    if (user)
                    {
                        userService.showUserDetails(user).then(function()
                        {
                            $scope.loading = false;
                            $scope.user    = user;
                        });
                    }
                });
            }
        }

        init();
    }
]);
