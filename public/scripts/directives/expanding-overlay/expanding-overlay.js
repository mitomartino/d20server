angular.module('d20helper.expandingOverlay', [])

    /**
     * directive: expandingOverlay
     *
     * attribute directive that causes an element to overlay another and expand/minimize based on attributes
     */
    .directive('expandingOverlay', ['$timeout', 'constantsService',
        function($timeout, constants)
        {
            var directive =
            {
                /**
                 * attribute only
                 */
                restrict: 'A',

                /**
                 * no isolated scope for this directive
                 */

                /**
                 * Link function for the directive
                 *
                 * @param scope   scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                     * Initialize the directive for this element
                     */
                    function init()
                    {
                        // we need to be absolutely positioned
                        element.css('position', 'absolute');

                        attrs.$set('tabindex', 1);

                        function sizeToTarget()
                        {
                            $scope.findTargetShape();

                            element
                                .width($scope.target.width)
                                .height($scope.target.height);
                        }

                        function onKeydown(event)
                        {
                            if (event.keyCode == constants.KEYS.ESC)
                            {
                                var elScope = element.scope();

                                attrs.$set('expanded', false);
                                elScope.expanded = false;
                            }
                        };

                        angular.element(document).bind('keydown', onKeydown);

                        $scope.$on('$destroy', function()
                        {
                            angular.element(document).unbind('keydown', onKeydown);
                        });

                        // track the element we are supposed to expand over
                        attrs.$observe('expandingOverlay', function(newVal)
                        {
                            if ((newVal) && (newVal.length))
                            {
                                var parent = element.parent();

                                $scope.expandOver = null;

                                if (parent)
                                {
                                    $scope.expandOver = angular.element('#' + newVal, element.offsetParent());
                                }
                            }
                        });

                        // track whether or not the overlay should be expanded
                        attrs.$observe('expanded', function(newVal)
                        {
                            var expand = ( (newVal) && (newVal.length) && (newVal != 'false') );

                            if (($scope.expandOver) && ($scope.expandOver.length))
                            {
                                if (expand)
                                {
                                    if (!$scope.expanded)
                                    {
                                        $scope.findInitialShape();
                                        $scope.findTargetShape();

                                        element.css('visibility', 'initial');

                                        $scope.animateShape($scope.initial, $scope.target, function ()
                                        {
                                            $scope.expanded = true;
                                            angular.element(window).on('resize', sizeToTarget);
                                        });
                                    }
                                }
                                else if ($scope.expanded)
                                {
                                    var parent = element.offsetParent();

                                    $scope.findInitialShape();
                                    $scope.findTargetShape();

                                    $scope.animateShape($scope.target, $scope.initial, function()
                                    {
                                        $scope.expanded = false;
                                        element.hide();

                                        angular.element(window).off('resize', sizeToTarget);
                                    });
                                }
                            }
                        });
                    }

                    /**
                     * Determine the position/width/height of the target object
                     */
                    $scope.findTargetShape = function()
                    {
                        var parent = element.parent();

                        $scope.target =
                        {
                            left:         0,
                            top:          0,
                            width:        angular.element(parent).innerWidth(),
                            height:       angular.element(parent).innerHeight(),
                            marginTop:    0,
                            marginBottom: 0,
                            marginLeft:   0,
                            marginRight:  0
                        };
                    }

                    /**
                     * Determine the position/width/height of the initial object
                     */
                    $scope.findInitialShape = function()
                    {
                        $scope.initial =
                        {
                            width:        $scope.expandOver.innerWidth(),
                            height:       $scope.expandOver.innerHeight(),
                            marginTop:    parseInt($scope.expandOver.css('marginTop')),
                            marginBottom: parseInt($scope.expandOver.css('marginBottom')),
                            marginLeft:   parseInt($scope.expandOver.css('marginLeft')),
                            marginRight:  parseInt($scope.expandOver.css('marginRight'))
                        };

                        angular.extend($scope.initial, $scope.expandOver.position());
                    }

                    /**
                     * Animate from the given position/size to the target position size
                     *
                     * @param from Initial position/size
                     * @param to   Target position/size
                     * @apram callback function to invoke when animation is completed
                     */
                    $scope.animateShape = function(from, to, callback)
                    {
                        element
                            .width(from.width)
                            .height(from.height)
                            .css('top', from.top)
                            .css('left', from.left)
                            .css('display', 'block');

                        element.animate(to, 400, callback);
                    }

                    init();
                }
            };

            return directive;
        }
    ]);