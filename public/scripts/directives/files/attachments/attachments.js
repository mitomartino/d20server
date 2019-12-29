angular.module('d20helper.attachments', [])

    /**
     * directive: imageAttachment
     *
     * Element directive for viewing an image attachment
     */
    .directive(

        'imageAttachment',

        ['$q', '$timeout', 'collectionService', 'applicationService',

        function($q, $timeout, collectionService, applicationService)
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
                templateUrl: 'scripts/directives/files/attachments/image-attachment.html',

                /**
                 * No isolated scope for this directive
                 */

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
                        $scope.url = attrs.url;
                    }


                    /**
                     * Import the attachment into one of the current user's managed collections
                     */
                    $scope.import = function()
                    {
                        collectionService.promptImport($scope.url);
                    }

                    $timeout(init, 10);
                }
            };

            return directive;

        }]
    )

    /**
     * directive: imagAttachment
     *
     * Element directive for viewing an audio attachment
     */
    .directive(

        'audioAttachment',

        ['$q', '$timeout', 'collectionService', 'applicationService',

        function($q, $timeout, collectionService, applicationService)
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
                templateUrl: 'scripts/directives/files/attachments/audio-attachment.html',

                /**
                 * No isolated scope for this directive
                 */

                /**
                 * Link function for the directive
                 *
                 * @param $scope  $scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                     * Initialize the directive
                     */
                    function init()
                    {
                        $scope.error       = null;
                        $scope.url         = attrs.url;
                        $scope.fileName    = $scope.getFileNameFromUrl($scope.url);
                        $scope.audioRepeat = false;
                        $scope.audio       = angular.element("audio", element);

                        if ( ($scope.audio) && ($scope.audio.length) )
                        {
                            $scope.audio = $scope.audio[0];
                            $scope.initAudio();
                        }
                        else
                        {
                            $scope.audio = null;
                        }
                    }

                    /**
                     * Get the file name for the given url
                     */
                    $scope.getFileNameFromUrl = function(url)
                    {
                        var slashIndex = url.lastIndexOf("/");

                        if ( (slashIndex == -1) || (slashIndex >= (url.length - 1)) )
                        {
                            return "<unknown>";
                        }

                        return url.substring(slashIndex + 1);
                    }

                    /**
                     * Import the attachment into one of the current user's managed collections
                     */
                    $scope.import = function()
                    {
                        collectionService.promptImport($scope.url);
                    }

                    /**
                     * Stop any audio that is playing
                     */
                    $scope.stopAudio = function()
                    {
                        $scope.playingAudio = false;
                        
                        if ($scope.audio)
                        {
                            $scope.audio.pause();
                        }
                    }

                    /**
                     * Reset the audio src and position
                     */
                    $scope.initAudio = function()
                    {
                        if ($scope.audio)
                        {
                            var player = $scope.audio;

                            player.addEventListener('error', function(e)
                            {
                                $timeout(function()
                                {
                                    $scope.error = 'This file may have been moved or deleted';
                                });
                            });

                            player.addEventListener('durationchange', function()
                            {
                                $scope.loaded = true;

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

                            player.src         = $scope.url;
                            player.currentTime = 0;
                            player.loop        = $scope.audioRepeat;
                        }
                    }

                    /**
                     * Toggle whether or not audio plays on loop
                     */
                    $scope.toggleAudioRepeat = function()
                    {
                        $scope.audioRepeat = !$scope.audioRepeat;

                        if ($scope.audio)
                        {
                            var player = $scope.audio;

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
                            if ($scope.audio)
                            {
                                var player = $scope.audio;

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
                            if ($scope.audio)
                            {
                                var player = $scope.audio;

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

                        if ($scope.audio)
                        {
                            if ($scope.playingAudio)
                            {
                                $scope.audio.play();
                            }
                            else
                            {
                                $scope.audio.pause();
                            }
                        }
                    }

                    $timeout(init, 10);
                }
            };

            return directive;

        }]
    );
