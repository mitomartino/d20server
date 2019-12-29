'use strict';

angular.module('d20helper.user.calendar', ['ngRoute']).

/**
 * Establish route
 *
 * state: calendar
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider)
{
    $stateProvider.state('calendar',
    {
        url:         '/calendar',
        templateUrl: 'scripts/controllers/user/calendar.html',
        controller:  'CalendarCtrl',
        data:
        {
            title:  'My Calendar',
            status: 'Viewing Calendar'
        }
    });
}]).

/**
 * Controller for managing user's calendar
 *
 * View/edit upcoming events
 */
controller('CalendarCtrl', ['$scope', '$timeout', 'modalService', 'gameService', 'constantsService', 'applicationService',

    function($scope, $timeout, modalService, gameService, constants, applicationService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {

        }

        init();
    }
]);
