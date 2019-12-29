'use strict';

angular.module('d20helper.games.myGames', ['ngRoute']).

/**
 * Establish route
 *
 * state: games-browse
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider)
{
    $stateProvider.state('games-my-games',
    {
        url:         '/games/my-games',
        templateUrl: 'scripts/controllers/games/my-games.html',
        controller:  'GamesMyGamesCtrl',
        data:
        {
            title:  'My Games',
            status: 'Viewing Games'
        }
    });
}]).

/**
 * Controller for managing user's games
 *
 * Manages creation, scheduling, and administration of games for a user
 */
controller('GamesMyGamesCtrl', ['$scope', '$timeout', 'modalService', 'gameService', 'constantsService', 'applicationService',

    function($scope, $timeout, modalService, gameService, constants, applicationService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {

        }
    }
]);
