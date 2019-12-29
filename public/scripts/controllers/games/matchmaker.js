'use strict';

angular.module('d20helper.games.matchmaker', ['ngRoute']).

/**
 * Establish route
 *
 * state: games-browse
 */
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider)
{
    $stateProvider.state('games-matchmaker',
    {
        url:         '/games/matchmaker',
        templateUrl: 'scripts/controllers/games/matchmaker.html',
        controller:  'GamesMatchmakerCtrl',
        data:
        {
            title:  'Games',
            status: 'Finding Games'
        }
    });
}]).

/**
 * Controller for managing games
 *
 * Manages adding/viewing/joining/deleting/etc
 */
controller('GamesMatchmakerCtrl', ['$scope', '$timeout', 'modalService', 'gameService', 'constantsService', 'applicationService',

    function($scope, $timeout, modalService, gameService, constants, applicationService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.gameModel = gameService.model.games;

            $scope.$watch('gameModel.data', function()
            {
                $scope.filterByTitle();
            });

            gameService.loadGames();
        }

        /**
         * Filter the visible games
         */
        $scope.filterByTitle = function()
        {
            $scope.currentFilter = $scope.filterText;

            _.each($scope.gameModel.data, function(game)
            {
                game.showingDetails = false;
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
                $scope.filteredGames = _.filter($scope.gameModel.data, function (game)
                {
                    return ( (game.title) && (game.title.indexOf($scope.currentFilter) != -1) );
                });
            }
            else
            {
                $scope.clearFilter();
            }
        }

        /**
         * Stop filtering the visible games
         */
        $scope.clearFilter = function()
        {
            $scope.filteredGames = _.filter($scope.gameModel.data, function(game)
            {
                return true;
            });

            $scope.filterText    = '';
            $scope.currentFilter = null;
        }

        /**
         * Toggle display of the details view for the given game
         *
         * @param game The game to toggle details view for
         */
        $scope.toggleDetails = function(game)
        {
        }

        /**
         * Respond to the game pressing a key
         *
         * Submits search on enter key; clears on escape
         *
         * @param $event The event to process
         */
        $scope.keyDown = function($event)
        {
            if ($event.keyCode == constants.KEYS.ENTER)
            {
                $scope.filterByTitle();
            }
            else if ($event.keyCode == constants.KEYS.ESC)
            {
                $scope.clearFilter();
            }
        }

        /**
         * Prompt and then delete the given game
         *
         * @param game The game to delete
         */
        $scope.deleteGame = function(game)
        {
            var promise = modalService.openOkCancel(
                'Delete game',
                'This operation cannot be undone.  Delete game ' + game.title + '?');

            promise.result.then(function()
            {
                console.log('delete');
            });
        }

        init();

    }
]);