'use strict';

angular.module('d20helper.main', ['ngRoute']).

/**
 * Main controller for the application
 *
 * Performs bindings onto the application service's model
 */
controller('MainCtrl',

    ['$scope', 'applicationService', 'userService',

    function($scope, applicationService, userService)
    {

        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.application = applicationService.model;
        }

        init();

    }
]);