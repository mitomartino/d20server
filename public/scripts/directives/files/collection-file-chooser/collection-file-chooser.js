'use strict';

angular.module('d20helper.collectionFileChooser', []).

/**
 * Controller for file-chooser panels
 */
directive('collectionFileChooser', [

    'collectionService', '$timeout',

    function(collectionService, $timeout)
    {
        var directive =
        {
            /**
             * Element only
             */
            restrict: 'E',

            /**
             * Template for this directive
             */
            templateUrl: 'views/file-chooser/file-chooser-panel.html',

            /**
             * Isolated $scope for this directive
             */
            scope: {
                collection:       '=',          // the selected collection to manage files from
                userCollection:   '=?',         // collection for the associated user
                gameCollection:   '=?',         // collection for the associated game
                systemCollection: '=?',         // collection for shared files
                drawer:           '=',          // the selected drawer to manage files from
                file:             '=?',         // the file that is selected
                fullPath:         '=?',         // the full path to the selected file
                fileType:         '=?',         // the type of file to restrict selection to
                allowedDrawers:   '=?',         // array or single drawer to allow the user to view
                onSelect:         '&',          // callback for when a file is selected
                showPreview:      '=?',         // whether or not to show the preview pane
                selectButtonText: '@'           // button text for the select button
            },

            /**
             * Link function for the directive
             *
             * @param $scope  $scope for the element
             * @param element element that we are linking the directive to
             * @param attrs   element attributes
             */
            link: function ($scope, element, attrs)
            {
                /**
                 * Initialization function
                 */
                function init()
                {
                    $scope.initialCollection = $scope.collection;

                    $scope.collections =
                    {
                        game: {
                            name: $scope.gameCollection,
                            exists: false
                        },
                        user: {
                            name: $scope.userCollection,
                            exists: false,
                            isDefault: true
                        },
                        system: {
                            name: $scope.systemCollection,
                            exists: false
                        }
                    };

                    $scope.$watch('gameCollection', function()
                    {
                        $scope.updateCollection('game');
                    });

                    $scope.$watch('userCollection', function()
                    {
                        $scope.updateCollection('user');
                    });

                    $scope.$watch('systemCollection', function()
                    {
                        $scope.updateCollection('system');
                    });

                    $scope.updateCollection('system');
                    $scope.updateCollection('game');
                    $scope.updateCollection('user');
                }

                /**
                 * Update the given scope variable assigned to a collection
                 *
                 * @param collectionType
                 */
                $scope.updateCollection = function(collectionType)
                {
                    var collDef  = $scope.collections[collectionType];
                    var collName = $scope[collectionType + 'Collection'];

                    if (collName)
                    {
                        collectionService.loadCollection(collDef.name).then(
                            function ()
                            {
                                if ((!$scope.collection) && (collDef.isDefault))
                                {
                                    $scope.collection = collDef.name;
                                }
                                else if (!$scope.initialCollection)
                                {
                                    $scope.collection = collDef.name;
                                }

                                collDef.exists = true;
                            },
                            function(error)
                            {
                                // collection does not exist
                            });
                    }
                    else
                    {
                        collDef.exists = false;
                    }
                }

                /**
                 * Show the given collection type
                 *
                 * @param type One of "user", "game" or "system"
                 */
                $scope.showCollection = function(type)
                {
                    $scope.collection = $scope.collections[type].name;
                }

                /**
                 * Respond to a file selection
                 */
                $scope.fileSelected = function()
                {
                    var selection =
                    {
                        collection: $scope.collection,
                        drawer:     $scope.drawer,
                        file:       $scope.file
                    };

                    collectionService.getUrl(selection.collection, selection.drawer, selection.file).then(function(url)
                    {
                        selection.url = url;

                        if ($scope.onSelect)
                        {
                            $scope.onSelect()(selection);
                        }
                    });
                }

                $timeout(init, 10);
            }
        }

        return directive;
    }
]);