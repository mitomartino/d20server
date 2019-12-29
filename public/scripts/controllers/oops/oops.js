'use strict';

angular.module('d20helper.oops', ['ngRoute']).

config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {

    $stateProvider.state("not-found",
    {
        url: "/not-found",
        controller: "OopsCtrl",
        templateUrl: "scripts/controllers/oops/oops.html",
        data:
        {
            title:   'Not Found',
            message: 'The feature you have selected is either still under construction or else a problem has occurred somewhere within the application.',
            status:  '??? ... !!!  ... ??'
        }
    });

    $stateProvider.state("unauthorized",
    {
        url: "/unauthorized",
        controller: "OopsCtrl",
        templateUrl: "scripts/controllers/oops/oops.html",
        data:
        {
            title: 'Not Authorized',
            message: 'You are not authorized to perform the requested action.  So, stop.  Guy.  Just stop.',
            status:  'Getting told'
        }
    });

    $stateProvider.state("banned",
    {
        url: "/banned",
        controller: "OopsCtrl",
        templateUrl: "scripts/controllers/oops/oops.html",
        data:
        {
            title:   'Not Authorized',
            message: 'You have been banned from this server.  Please speak with your admin if you do not know why',
            status:  'Already been told'
        }
    });

}]).

controller('OopsCtrl', [

    '$scope', '$rootScope', '$state', 'themeService',

    function($scope, $rootScope, $state, themeService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.unauthUrl = themeService.getImageUrl('frame', 'not-authorized');

            // when the state changes, we want to try to update our message
            $rootScope.$on('$stateChangeSuccess', function(event, toState)
            {
                $scope.setMessageFromState();
            });

            // initialize the message now
            $scope.setMessageFromState();
        }

        /**
         * Determine the message to display based on data associated with the current state
         */
        $scope.setMessageFromState = function()
        {
            if ( ($state.current) && ($state.current.data) && ($state.current.data.message) )
            {
                $scope.message = $state.current.data.message;
            }
        }

        init();
    }
]);