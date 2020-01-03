angular.module('d20helper.imageChooser', [])

    /**
     * directive: image-chooser
     *
     * Element directive for selecting/uploading images
     */
    .directive('imageChooser', ['$q', '$timeout', 'collectionService', 'applicationService', 'ajaxService', 'utilsService',
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
                templateUrl: 'scripts/directives/files/image-chooser/image-chooser.html',

                /**
                 * Isolated $scope for this directive
                 */
                scope:
                {
                    collection:   '@',          // the collection to pull manage images from
                    drawer:       '@',          // the drawer to manage images from
                    image:        '=?',         // the selected image
                    onSelect:     '&',          // callback for when an image is selected
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
                        $scope.showTransitions = true;

                        $scope.$watch('collection', function()
                        {
                            $scope.loadImageList();
                        });
                        
                        $scope.$watch('drawer', function()
                        {
                            $scope.loadImageList();
                        });

                        $scope.$watch('image', function()
                        {
                            if ($scope.image)
                            {
                                var slide = _.findWhere($scope.slides, {image: $scope.image});
                                var currSlide = _.findWhere($scope.slides, {active: true});

                                if (currSlide)
                                {
                                    currSlide.active = false;
                                    $scope.activeSlide = null;
                                }

                                if (slide)
                                {
                                    slide.active = true;
                                    $scope.activeSlide = slide;
                                }
                            }
                        });

                        $scope.$watch(function()
                        {
                            var i = null;
                            var currSlide = _.findWhere($scope.slides, {active: true});

                            if (currSlide)
                            {
                                i = currSlide.name;
                            }

                            return i;
                        },
                        function()
                        {
                            var currSlide = _.findWhere($scope.slides, {active: true});

                            if (currSlide)
                            {
                                $scope.image = currSlide.image;
                            }
                            else
                            {
                                $scope.image = null;
                            }
                        });

                        $scope.installDragAndDropSupport();
                        $scope.showView('slides');
                    }

                    /**
                     * Set up drag-and-drop support for the image chooser
                     */
                    $scope.installDragAndDropSupport = function()
                    {
                        element.bind('dragenter', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            element.addClass('active-drop-target');
                        });

                        element.bind('dragover', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            $scope.showView('message', 'Drop file to begin upload');
                        });

                        element.bind('dragleave', function(event)
                        {
                            event.stopPropagation();
                            event.preventDefault();

                            element.removeClass('active-drop-target');
                            $scope.showView('slides');
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
                                    $scope.uploadImage(file);
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
                     * Load the list of images of the current collection
                     *
                     * Invoked whenever the image type changes
                     */
                    $scope.loadImageList = function()
                    {
                        $scope.slides       = [];
                        $scope.errorMessage = null;

                        if ( ($scope.collection) && ($scope.collection.length) )
                        {
                            $scope.loadedCollection = null;
                            $scope.busy             = true;

                            collectionService.getContents($scope.collection, $scope.drawer).then(
                                function(data)
                                {
                                    $scope.makeSlides(data);
                                    $scope.busy = false;
                                },
                                function(err)
                                {
                                    $scope.errorMessage = err;
                                }
                            )

                            $scope.showView('slides');
                        }
                    }

                    /**
                     * Make the slides out of the given collection
                     *
                     * @param collection The loaded collection
                     */
                    $scope.makeSlides = function(collection)
                    {
                        var ii     = 0;
                        var drawer = _.findWhere(collection.drawers, {name: $scope.drawer});

                        $scope.loadedCollection = collection;
                        $scope.slides           = [];
                        $scope.errorMessage     = null;

                        _.each(drawer.contents, function(file)
                        {
                            $scope.slides.push(
                                {
                                    index:  ii++,
                                    active: false,
                                    text:   file,
                                    name:   file,
                                    image:  $scope.loadedCollection.baseUrl + $scope.drawer + '/' + file
                                });
                        });

                        if ($scope.slides.length)
                        {
                            $scope.setActiveSlide();
                        }
                    }

                    /**
                     * Set the active slide based on the image scope property
                     */
                    $scope.setActiveSlide = function()
                    {
                        var selectSlide = _.findWhere($scope.slides, {image: $scope.image});

                        // clear previous selection
                        _.each($scope.slides, function(slide)
                        {
                            slide.active = false;
                        });
                        $scope.activeSlide = null;

                        if ( (!selectSlide) && ($scope.slides) && ($scope.slides.length) )
                        {
                            selectSlide = $scope.slides[0];
                        }

                        if (selectSlide)
                        {
                            selectSlide.active = true;
                            $scope.activeSlide = selectSlide;
                        }
                    }

                    /**
                     * Show the file chooser
                     * 
                     * @param $event - The event to stop propagation to the carousel
                     */
                    $scope.showFileChooser = function($event)
                    {
                        $event.stopPropagation();

                        var fileChooser = angular.element('[type="file"]', element);

                        if (!$scope.boundChooser)
                        {
                            $scope.boundChooser = true;

                            fileChooser.bind('change', function(event)
                            {
                                var val = fileChooser[0].files[0];

                                $timeout(function ()
                                {
                                    $scope.uploadImage(val);
                                });

                                fileChooser[0].value = null;
                            });
                        }

                        fileChooser.trigger('click');
                    }

                    /**
                     * Upload a new file
                     */
                    $scope.uploadImage = function(file)
                    {
                        if (!file)
                        {
                            return;
                        }

                        if (!collectionService.isValidFileType($scope.loadedCollection, $scope.drawer, file.name))
                        {
                            $scope.showView('error', 'That file type is not supported by this drawer');
                            return;
                        }

                        var formData = new FormData();

                        formData.append('file', file);

                        $scope.showView('loading', 'Uploading...');

                            var req = ajaxService.request(
                                {
                                    method:           'post',
                                    url:              '/services/upload/to/:collection/:drawer',
                                    data:             formData,
                                    headers:          {'Content-Type': undefined },
                                    transformRequest: angular.identity,
                                    pathParams:
                                    {
                                        collection: $scope.loadedCollection._id,
                                        drawer: $scope.drawer
                                    }
                                });

                            req.then(
                                function(data)
                                {
                                    $timeout(
                                        function()
                                        {
                                            var path = $scope.loadedCollection.baseUrl + $scope.drawer + '/' + file.name;

                                            if (!_.findWhere($scope.slides, {text: file.name}))
                                            {
                                                $scope.slides.push(
                                                {
                                                    index:  $scope.slides.length,
                                                    active: false,
                                                    text:   file.name,
                                                    name:   file.name,
                                                    image:  path
                                                });
                                            }

                                            $scope.image = path;
                                            $scope.setActiveSlide();
                                            $scope.showSlides();
                                        },
                                        500
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
                     * Prompt the user to delete the current slide
                     * 
                     * @param $event - The event to stop propagation to the carousel
                     */
                    $scope.promptDelete = function($event)
                    {
                        $event.stopPropagation();

                        $scope.showView(
                            'prompt',
                            'Permanently delete this image?');
                    }

                    /**
                     * Delete the current slide
                     */
                    $scope.doDelete = function()
                    {
                        $scope.showView('loading', 'Deleting...');

                        var req = ajaxService.request(
                        {
                            method: 'post',
                            url:    '/services/upload/delete/from/:collection/:drawer',
                            pathParams:
                            {
                                collection: $scope.loadedCollection._id,
                                drawer:     $scope.drawer
                            },
                            data:
                            {
                                file: $scope.activeSlide.name
                            }
                        });

                        req.then(
                            function(data)
                            {
                                // we are deleting the active slide, so we need to identify the new active slide
                                // (the slide directly after the one we deleted if possible)
                                if ($scope.activeSlide)
                                {
                                    var formerActive = $scope.activeSlide;
                                    var lastSlide    = null;
                                    var newActive    = null;
                                    var index        = 0;

                                    // we will filter and select the next slide in one step
                                    $scope.slides = _.filter($scope.slides, function(slide)
                                    {
                                        // filter out the deleted slide
                                        if (slide == $scope.activeSlide)
                                        {
                                            return false;
                                        }

                                        // we want to select the first slide after the deleted one
                                        if ( (lastSlide) && (lastSlide.index < $scope.activeSlide.index) )
                                        {
                                            newActive = slide;
                                        }

                                        lastSlide = slide;

                                        // keep indexes valid 
                                        slide.index = index;
                                        index += 1;

                                        return true;
                                    });

                                    $scope.activeSlide = newActive;

                                    if ($scope.activeSlide) 
                                    {
                                        $scope.activeSlide.active = true;
                                    }
                                }

                                $scope.showView('slides');
                            },
                            function(err)
                            {
                                err = utilsService.getMessageFromError(err, 'The image could not be deleted');

                                $scope.showView('error', err);
                            }
                        );
                    }

                    /**
                     * Show the next slide in the slide list
                     */
                    $scope.showNextSlide = function()
                    {
                        if ( ($scope.slides) && ($scope.slides.length > 1) )
                        {
                            if ($scope.activeSlide)
                            {
                                $scope.activeSlide.active = false;

                                if ($scope.activeSlide.index < $scope.slides.length - 1)
                                {
                                    $scope.activeSlide = $scope.slides[$scope.activeSlide.index + 1];
                                }
                                else
                                {
                                    $scope.activeSlide = $scope.slides[0];
                                }
                            }
                            else
                            {
                                $scope.activeSlide = $scope.slides[0];
                            }

                            $scope.activeSlide.active = true;
                        }
                    }

                    /**
                     * Show the previous slide in the slide list
                     */
                    $scope.showPreviousSlide = function()
                    {
                        if ( ($scope.slides) && ($scope.slides.length > 1) )
                        {
                            if ($scope.activeSlide)
                            {
                                $scope.activeSlide.active = false;

                                if ($scope.activeSlide.index > 0)
                                {
                                    $scope.activeSlide = $scope.slides[$scope.activeSlide.index - 1];
                                }
                                else
                                {
                                    $scope.activeSlide = $scope.slides[$scope.slides.length - 1];
                                }
                            }
                            else
                            {
                                $scope.activeSlide = $scope.slides[$scope.slides.length - 1];
                            }

                            $scope.activeSlide.active = true;
                        }
                    }

                    /**
                     * Return to the slideshow view
                     */
                    $scope.showSlides = function()
                    {
                        $scope.showView('slides');
                    }

                    /**
                     * Show a particular view
                     *
                     * @param view The view to show
                     * @param bg   Background image or current slide image if false
                     */
                    $scope.showView = function(view, prompt, background)
                    {
                        $scope.showTransitions = false;

                        $scope.activeSlide = _.findWhere($scope.slides, {active: true});

                        $timeout(
                            function()
                            {
                                $scope.state =
                                {
                                    view:       view,
                                    prompt:     prompt,
                                    panelImage: background || $scope.image
                                }

                                $timeout(
                                    function()
                                    {
                                        $scope.showTransitions = true;
                                    },
                                    100
                                );
                            }
                        );
                    }

                    init();
                }
            };

            return directive;
        }
    ]);