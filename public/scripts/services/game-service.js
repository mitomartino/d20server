'use strict';

angular.module('d20helper.gameService', []).

/**
 * game management service
 *
 * Provides methods for querying, adding, updating, join, and leaving game games
 *
 */
factory('gameService', ['$rootScope', '$q', 'ajaxService', 'applicationService',

    function($rootScope, $q, ajaxService, applicationService)
    {
        var service =
        {
            name:      'game-service',
            model:
            {
                games:
                {
                    loading: false,
                    data:    []
                }
            }
        };

        // ------------------------------------------------------------------------------------------------------
        // service public interface methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Load the list of existing games
         *
         * @return {Promise} A promise that will resolve with the game list
         */
        service.loadGames = function()
        {
            service.model.games.loading = true;

            return $q(function(resolve, reject)
            {
                var request = ajaxService.request({
                    method: 'get',
                    url:    '/services/game/list'
                });

                request.then(
                    function(data)
                    {
                        service.model.games.data = data;

                        _.each(service.model.game.data, function(game) {
                            processGame(game);
                        });

                        resolve(service.model.games.data);
                    },
                    function(error)
                    {
                        reject(error);
                    }
                );

                request.finally(function() {
                    service.model.games.loading = false;
                });

            });
        }

        // ------------------------------------------------------------------------------------------------------
        // private methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Process the given game to determine if the current user owns or participates in the game
         *
         * @param game The game to process
         */
        function processGame(game)
        {
            var currUser = applicationService.model.currentUser._id;

            if (game.owner == currUser)
            {
                game.isOwner  = true;
                game.isPlayer = true;
            }
            else
            {
                var thisUser = _.findWhere(game.players, {_id: currUser});

                if (thisUser)
                {
                    game.isPlayer = true;
                }
            }
        }

        /**
         * Service initialization
         */
        function init()
        {
        }

        init();

        return service;

    }
]);
