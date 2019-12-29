angular.module('d20helper.collectionBrowser', [])

    /**
     * directive: collection-browser
     *
     * Element directive for browsing the contents/drawers of a collection
     */
    .directive(

        'collectionBrowser',

        ['$q', '$timeout', 'collectionService', 'applicationService', 'ajaxService', 'utilsService',

        function($q, $timeout, collectionService, applicationService, ajaxService, utilsService)
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
                templateUrl: 'scripts/directives/files/collection-browser/collection-browser.html',

                /**
                 * Isolated $scope for this directive
                 */
                scope:
                {
                    collection:       '=',          // the selected collection to manage files from
                    drawer:           '=',          // the selected drawer to manage files from
                    fullPath:         '=?',         // full-path to the selected file (one-way)
                    file:             '=?',         // the file that is selected
                    selectedFileType: '=?',         // the type of file chosen (one-way)
                    fileType:         '=?',         // the type of file to restrict selection to
                    allowedDrawers:   '=?',         // array or single drawer to allow the user to view
                    onSelect:         '&',          // callback for when a file is selected
                    showPreview:      '=?',         // whether or not to show the preview pane
                },

                /**
                 * Link function for the directive
                 *
                 * @param $scope  $scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    function init()
                    {
                        $scope.contents    = [];
                        $scope.audioRepeat = false;

                        $scope.iconLookup =
                        {
                            goUp:      'fa-folder',
                            images:    'fa-file-image-o',
                            audio:     'fa-file-audio-o',
                            movies:    'fa-file-movie-o',
                            documents: 'fa-file-word-o'
                        };

                        function fileAdded(update)
                        {
                            $scope.fileAdded(update);
                        }

                        function fileRemoved(update)
                        {
                            $scope.fileRemoved(update);
                        }

                        applicationService.onServerUpdate(
                            "collection.file-added", $scope, fileAdded);
                        applicationService.onServerUpdate(
                            "collection.file-removed", $scope, fileRemoved);

                        $scope.$watch('collection', function()
                        {
                            $scope.loadCollection();
                        });

                        $scope.$watch('drawer', function()
                        {
                            $scope.loadDrawer();
                        });

                        $scope.$watch('fileType', function()
                        {
                            $scope.filterDrawers();
                        });

                        $scope.$watch('file', function()
                        {
                            $scope.selectFile();
                        });

                        $scope.installDragAndDropSupport();
                    }

                    /**
                     * Load the current collection.  If a drawer is selected, then
                     * it will be loaded.  If not, then the drawer will be loaded
                     * once it is set.
                     *
                     * If there is a current file, it will be selected.  If not
                     */
                    $scope.loadCollection = function()
                    {
                        if ($scope.collection)
                        {
                            collectionService.loadCollection($scope.collection).then(
                                function(loadedCollection)
                                {
                                    var id = loadedCollection._id

                                    $scope.loadedCollection = loadedCollection;
                                    $scope.writable         = applicationService.isAuthorized('manage resources', id);

                                    $scope.filterDrawers();
                                },
                                function(err)
                                {
                                    $scope.items        = [];
                                    $scope.selectedItem = null;

                                    $scope.showView("error", "Failed to load the file collection");
                                }
                            )
                        }
                    }

                    /**
                     * Load the current drawer and display its contents
                     */
                    $scope.loadDrawer = function()
                    {
                        if ( ($scope.loadedDrawer) && ($scope.loadedDrawer.name == $scope.drawer) )
                        {
                            var collDrawer = _.findWhere($scope.loadedCollection.drawers, {name: $scope.drawer});

                            if ($scope.loadedDrawer == collDrawer)
                            {
                                return;
                            }
                        }

                        if ( ($scope.loadedCollection) && (!$scope.loadingDrawer) )
                        {
                            var drawer = _.findWhere($scope.drawers, {name: $scope.drawer});

                            $scope.loadingDrawer = true;

                            if (drawer)
                            {
                                $scope.items = [];

                                collectionService.getContents($scope.collection, $scope.drawer).then(
                                    function(collection)
                                    {
                                        var drawer = _.findWhere(collection.drawers, {name: $scope.drawer});
                                        var icon   = $scope.iconLookup[drawer.contentType];
                                        var path   = $scope.loadedCollection.baseUrl + $scope.drawer + '/';

                                        $scope.loadedDrawer = drawer;

                                        // add an option to present the drawers again
                                        if ( (!$scope.allowedDrawers) ||
                                             ((_.isArray($scope.allowedDrawers)) &&
                                             ($scope.allowedDrawers.length > 1)) )
                                        {
                                            $scope.items.push(
                                            {
                                                text: '.. drawers',
                                                action: 'goUp',
                                                icon: $scope.iconLookup['goUp']
                                            });
                                        }
                                        _.each(drawer.contents, function(file)
                                        {
                                            $scope.items.push(
                                            {
                                                action:      "select",
                                                text:        file,
                                                icon:        icon,
                                                contentType: drawer.contentType,
                                                url:         path + file,
                                                type:        $scope.getFileType(file)
                                            });
                                        });

                                        if ($scope.writable)
                                        {
                                            $scope.addItem =
                                            {
                                                text:   "new...",
                                                icon:   "general-icon fa-plus-square",
                                                action: "upload"
                                            };

                                            $scope.items.push($scope.addItem);
                                        }

                                        $scope.loadingDrawer = false;
                                        $scope.selectFile();
                                    },
                                    function(err)
                                    {
                                        $scope.loadingDrawer = false;
                                        $scope.showView("error", err);
                                    }
                                )

                            }
                        }
                    }

                    /**
                     * Show the drawers as the initial content
                     */
                    $scope.presentDrawers = function()
                    {
                        $scope.items        = [];
                        $scope.loadedDrawer = null;
                        $scope.selectedItem = null;
                        $scope.stopAudio();

                        _.each($scope.drawers, function(drawer)
                        {
                           $scope.items.push(
                           {
                               action: 'drawer',
                               icon:   drawer.icon,
                               data:   drawer,
                               text:   drawer.name
                           });
                        });
                    }

                    /**
                     * Filter the list of drawers by content type
                     */
                    $scope.filterDrawers = function()
                    {
                        var collection     = $scope.loadedCollection;
                        var allowedDrawers = undefined;

                        if ($scope.allowedDrawers)
                        {
                            if (_.isArray($scope.allowedDrawers))
                            {
                                allowedDrawers = $scope.allowedDrawers;
                            }
                            else
                            {
                                allowedDrawers = [$scope.allowedDrawers];
                            }
                        }

                        if (collection)
                        {
                            $scope.drawers = _.filter(collection.drawers, function (drawer)
                            {
                                return ( (!$scope.fileType) || (drawer.contentType == $scope.fileType) );
                            });

                            if (allowedDrawers)
                            {
                                $scope.drawers = _.filter($scope.drawers, function(drawer)
                                {
                                    return (_.indexOf(allowedDrawers, drawer.name) != -1);
                                });
                            }

                            var drawer = _.findWhere($scope.drawers, {name: $scope.drawer});

                            if (drawer)
                            {
                                $scope.loadDrawer();
                            }
                            else if ( (!allowedDrawers) || (allowedDrawers.length > 1) )
                            {
                                $scope.presentDrawers();
                            }
                            else
                            {
                                $scope.drawer = allowedDrawers[0];
                                $scope.loadDrawer();
                            }
                        }
                    }

                    /**
                     * Select the current file if available
                     */
                    $scope.selectFile = function()
                    {
                        if ($scope.selectedItem)
                        {
                            $scope.selectedItem.selected = false;
                            $scope.stopAudio();
                        }

                        $scope.selectedItem = _.findWhere($scope.items, {text: $scope.file});

                        if ($scope.selectedItem)
                        {
                            $scope.fullPath              = $scope.selectedItem.url;
                            $scope.selectedFileType      = $scope.selectedItem.contentType;
                            $scope.selectedItem.selected = true;
                            $scope.initAudio($scope.selectedItem);
                        }
                    }

                    /**
                     * Handle a new file added to a drawer
                     *
                     * @param update The update to process
                     */
                    $scope.fileAdded = function(update)
                    {
                        if ( (!$scope.loadedCollection) ||
                             (!$scope.loadedDrawer)     ||
                             (update.collection._id != $scope.loadedCollection._id) ||
                             ($scope.loadedDrawer.name != update.drawer) )
                        {
                            return;
                        }

                        var drawer = _.findWhere(update.collection.drawers, {name: update.drawer});
                        var path   = update.collection.baseUrl + update.drawer + '/' + update.file;

                        if (!_.findWhere($scope.items, {text: update.file}))
                        {
                            $scope.items = _.without($scope.items, $scope.addItem);

                            $scope.items.push(
                            {
                                action:      "select",
                                text:        update.file,
                                contentType: $scope.loadedDrawer.contentType,
                                url:         path,
                                icon:        $scope.iconLookup[$scope.loadedDrawer.contentType]
                            });

                            $scope.items = _.sortBy($scope.items, 'text');

                            if ($scope.addItem)
                            {
                                $scope.items.push($scope.addItem);
                            }
                        }
                    }

                    /**
                     * Respond to a file being removed from a drawer
                     *
                     * @param update The update to process
                     */
                    $scope.fileRemoved = function(update)
                    {
                        if ( (!$scope.loadedCollection)                             ||
                             (!$scope.loadedDrawer)                                 ||
                             (update.collection._id != $scope.loadedCollection._id) ||
                             ($scope.loadedDrawer.name != update.drawer) )
                        {
                            return;
                        }

                        var delItem  = _.findWhere($scope.items, {text: update.file});

                        if (!delItem)
                        {
                            return;
                        }

                        var newItems = _.without($scope.items, delItem);
                        var index    = _.indexOf($scope.items, delItem);

                        if (index >= newItems.length)
                        {
                            index = newItems.length - 1;
                        }

                        while ( (index >= 0) &&
                                (index < newItems.length) &&
                                (newItems[index].action != "select") )
                        {
                            --index;
                        }

                        if (index < 0)
                        {
                            $scope.file = null;
                        }
                        else
                        {
                            $scope.file = newItems[index].text;
                        }

                        $timeout(
                            function()
                            {
                                $scope.items = _.without($scope.items, delItem);
                            },
                            500
                        );
                    }

                    /**
                     * Respond to an item being clicked
                     *
                     * @param item The item that was clicked
                     */
                    $scope.itemClicked = function(item)
                    {
                        if (item.action == "upload")
                        {
                            $scope.showFileChooser();
                        }
                        else if (item.action == "select")
                        {
                            $scope.file = item.text;
                        }
                        else
                        {
                            $scope.busy = true;
                            $scope.items = [];

                            $timeout(
                                function()
                                {
                                    $scope.busy = false;

                                    if (item.action == "goUp")
                                    {
                                        $scope.presentDrawers();
                                    }
                                    else if (item.action == "drawer")
                                    {
                                        if ($scope.drawer != item.data.name)
                                        {
                                            $scope.drawer = item.data.name;
                                        }
                                        else
                                        {
                                            $scope.loadDrawer();
                                        }
                                    }
                                },
                                600
                            );
                        }
                    }

                    /**
                     * Set up drag-and-drop support for the file browser
                     */
                    $scope.installDragAndDropSupport = function()
                    {
                        $scope.dragLeaveDelay = null;

                        element.bind('dragenter', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            if ($scope.dragLeaveDelay)
                            {
                                $timeout.cancel($scope.dragLeaveDelay);
                                $scope.dragLeaveDelay = null;
                            }

                            element.addClass('active-drop-target');
                        });

                        element.bind('dragover', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            if ($scope.dragLeaveDelay)
                            {
                                $timeout.cancel($scope.dragLeaveDelay);
                                $scope.dragLeaveDelay = null;
                            }

                            $scope.showView('message', 'Drop file to begin upload');
                        });

                        element.bind('dragleave', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            $scope.dragLeaveDelay = $timeout(
                                function()
                                {
                                    element.removeClass('active-drop-target');
                                    $scope.showView('default');
                                },
                                100
                            );
                        });

                        element.bind('drop', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            var file = $scope.validateDndEvent(event);

                            if (file)
                            {
                                $timeout(function ()
                                {
                                    $scope.uploadFile(file);
                                });
                            }

                            element.removeClass('active-drop-target');
                        });
                    }

                    /**
                     * Validate a drag-and-drop file
                     *
                     * @param event The event to validate
                     * @return The file or null if not acceptable
                     */
                    $scope.validateDndEvent = function(event)
                    {
                        var e = event.originalEvent;

                        if ( (e.dataTransfer) && (e.dataTransfer.files) && (e.dataTransfer.files[0]) )
                        {
                            return e.dataTransfer.files[0];
                        }
                    }

                    /**
                     * Show the file chooser
                     */
                    $scope.showFileChooser = function()
                    {
                        var fileChooser = angular.element('[type="file"]', element);

                        if (!$scope.boundChooser)
                        {
                            $scope.boundChooser = true;

                            fileChooser.bind('change', function(event)
                            {
                                var val = fileChooser[0].files[0];

                                $timeout(function ()
                                {
                                    $scope.uploadFile(val);
                                });

                                fileChooser[0].value = null;
                            });
                        }

                        fileChooser.trigger('click');
                    }

                    /**
                     * Upload a new file
                     *
                     * @param file The file to upload
                     */
                    $scope.uploadFile = function(file)
                    {
                        if (!file)
                        {
                            return;
                        }

                        $scope.showView('loading', 'Uploading...');

                        var req = collectionService.uploadFile($scope.loadedCollection, $scope.drawer, file);

                        req.then(
                            function(data)
                            {
                                $timeout(
                                    function()
                                    {
                                        $scope.showView('default');
                                        $scope.file = file.name;
                                    },
                                    100
                                );
                            },
                            function(err)
                            {
                                err = utilsService.getMessageFromError(err, 'File could not be uploaded');

                                $scope.showView('error', err);
                            }
                        );
                    }

                    /**
                     * Import the selected file into another collection/drawer
                     */
                    $scope.import = function()
                    {
                        if ($scope.selectedItem)
                        {
                            collectionService.promptImport($scope.selectedItem.url).then(
                                null,
                                function(err)
                                {
                                    var defaultMsg = "There was a problem importing the file";

                                    $scope.showView(
                                        'error',
                                        utilsService.getMessageFromError(err, defaultMsg))
                                }
                            );
                        }
                    }

                    /**
                     * Get the type for the given file
                     */
                    $scope.getFileType = function(file)
                    {
                        var first  = "audio";
                        var second = "file";

                        if ($scope.loadedDrawer.contentType == "images")
                        {
                            first = "image";
                        }

                        var dotIndex   = file.lastIndexOf(".");

                        if (dotIndex != -1)
                        {
                            var extension = file.substring(dotIndex + 1).trim();

                            second = extension;
                        }

                        return first + "/" + second;
                    }

                    /**
                     * Prompt the user to delete the current slide
                     */
                    $scope.promptDelete = function()
                    {
                        $scope.showView(
                            'prompt',
                            'Permanently delete this file?');
                        $scope.promptAction = "delete";
                    }

                    /**
                     * Respond to the user clicking "Yes" to a prompt
                     */
                    $scope.promptYes = function()
                    {
                        if ($scope.promptAction == "delete")
                        {
                            $scope.doDelete();
                        }
                    }

                    /**
                     * Delete the current slide
                     */
                    $scope.doDelete = function()
                    {
                        $scope.showView('loading', 'Deleting...');

                        var delItem = $scope.selectedItem;

                        var req = collectionService.deleteFile(
                            $scope.loadedCollection, $scope.drawer, $scope.selectedItem.text);

                        req.then(
                            function(data)
                            {
                                $scope.showView('default');
                            },
                            function(err)
                            {
                                err = utilsService.getMessageFromError(
                                    err, 'The image could not be deleted');

                                $scope.showView('error', err);
                            }
                        );
                    }

                    /**
                     * Show a particular view
                     *
                     * @param view The view to show
                     */
                    $scope.showView = function(view, prompt, background)
                    {
                        $timeout(
                            function()
                            {
                                $scope.state =
                                {
                                    view:       view,
                                    prompt:     prompt
                                }
                            }
                        );
                    }

                    /**
                     * Stop any audio that is playing
                     */
                    $scope.stopAudio = function()
                    {
                        $scope.playingAudio = false;

                        var audio = angular.element("audio", element);

                        if ( (audio) && (audio.length) )
                        {
                            audio[0].pause();
                        }
                    }

                    /**
                     * Reset the audio src and position
                     */
                    $scope.initAudio = function(item)
                    {
                        $timeout(function()
                        {
                            var audio = angular.element("audio", element);

                            if ( (audio) && (audio.length) )
                            {
                                var player = audio[0];

                                player.addEventListener('durationchange', function()
                                {
                                    $scope.updateAudioTimeRemaining();
                                });

                                player.addEventListener('timeupdate', function()
                                {
                                    $scope.updateAudioTimeRemaining();
                                });

                                player.addEventListener('ended', function()
                                {
                                    $scope.resetAudio();
                                });

                                player.src         = item.url;
                                player.currentTime = 0;
                                player.loop        = $scope.audioRepeat;
                            }
                        });
                    }

                    /**
                     * Toggle whether or not audio plays on loop
                     */
                    $scope.toggleAudioRepeat = function()
                    {
                        var audio = angular.element("audio", element);

                        $scope.audioRepeat = !$scope.audioRepeat;

                        if ( (audio) && (audio.length) )
                        {
                            var player = audio[0];

                            player.loop        = $scope.audioRepeat;
                        }
                    }

                    /**
                     * Update the time remaining for audio
                     */
                    $scope.updateAudioTimeRemaining = function()
                    {
                        $timeout(function()
                        {
                            var audio = angular.element("audio", element);

                            if ( (audio) && (audio.length) )
                            {
                                var player = audio[0];

                                $scope.audioDuration      = Math.round(player.duration);
                                $scope.audioTimeRemaining = Math.round(player.duration - player.currentTime);
                            }
                        });
                    }

                    /**
                     * Reset the audio to the beginning and allow user to play again
                     */
                    $scope.resetAudio = function()
                    {
                        $timeout(function()
                        {
                            var audio = angular.element("audio", element);

                            if ( (audio) && (audio.length) )
                            {
                                var player = audio[0];

                                $scope.playingAudio = false;
                                $scope.audioTimeRemaining = 0;
                            }
                        });
                    }

                    /**
                     * Toggle whether or not audio is playing
                     */
                    $scope.toggleAudio = function()
                    {
                        $scope.playingAudio = !$scope.playingAudio;

                        var audio = angular.element("audio", element);

                        if ( (audio) && (audio.length) )
                        {
                            if ($scope.playingAudio)
                            {
                                audio[0].play();
                            }
                            else
                            {
                                audio[0].pause();
                            }
                        }
                    }

                    init();
                }
            };

            return directive;
        }
    ]);