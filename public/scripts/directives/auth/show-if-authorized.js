angular.module('d20helper.showIfAuthorized', [])

    /**
     * directive: showIfAuthorized
     *
     * Attribute directive indicating that the given element should be visible if and only if it is authorized
     * according to the following parameters:
     *
     *  authorize-for=<string indicating entitlement>
     *  authorize-on=<optional string indicating object id>
     */
    .directive('showIfAuthorized', ['ngIfDirective', 'applicationService',
        function(ngIfDirective, applicationService)
        {
            var ngIf = ngIfDirective[0];

            var directive =
            {
                /**
                 * Re-use ng-if
                 */
                restrict:   ngIf.restrict,
                transclude: ngIf.transclude,
                priority:   ngIf.priority,
                terminal:   ngIf.terminal,

                /**
                 * Link function for the directive
                 *
                 * @param $scope  scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                     * Initialize the directive on the given element
                     */
                    init = function()
                    {
                        $scope.authorized = false;

                        attrs.$observe('showIfAuthorized', function()
                        {
                            $scope.showIfAuthorized();
                        });

                        attrs.$observe('authorizeOn', function()
                        {
                            $scope.showIfAuthorized();
                        });

                        applicationService.onPermissionChange(function()
                        {
                           $scope.showIfAuthorized();
                        });

                        attrs.ngIf = function()
                        {
                            return $scope.authorized;
                        };
                    }

                    /**
                     * Show or hide the element based on the authorize action and target
                     */
                    $scope.showIfAuthorized = function()
                    {
                        var act = attrs.showIfAuthorized;
                        var on  = attrs.authorizeOn;

                        if ( (act) && ((act != $scope.act) || (on != $scope.on)) )
                        {
                            $scope.act = act;
                            $scope.on  = on;

                            var authorized = applicationService.isAuthorized(act, on);

                            $scope.authorized = authorized;
                        }
                    }

                    init();
                    ngIf.link.apply(ngIf, arguments);
                }
            };

            return directive;
        }
    ]);