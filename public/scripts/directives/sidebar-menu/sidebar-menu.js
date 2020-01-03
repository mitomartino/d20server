'use strict';

angular.module('d20helper.sidebarMenu', [])

    .directive('sidebarMenu', ['$rootScope', '$state', '$transitions', 'applicationService', 'themeService', 'utilsService', 'constantsService',
        function($rootScope, $state, $transitions, applicationService, themeService, utilsService, constants) {

        var directive =
        {
            /**
             * Element-only matching
             */
            restrict: 'E',

            /**
             * Isolated scope
             */
            scope:
            {
                menuTitle:  '@', // title for the menu
                anchor:     '@', // anchor (left or right)
                options:    '=', // the menu options
                showMenu:   '=', // whether or not menu is visible
                launcher:   '@'  // css selector to locate the launcher element(s)
            },

            /**
             * Template for the sidebar-menu container
             */
            templateUrl: 'scripts/directives/sidebar-menu/sidebar-menu.html',

            /**
             * Directive link  function
             *
             * @param scope       scope variables
             * @param element     element to apply directive to
             * @param attrs       attributes assigned to the element
             * @param controllers the loaded controllers if any
             */
            link: function($scope, element, attrs, controllers)
            {
                function init()
                {
                    $scope.launcherEl = null;

                    if ( (!$scope.anchor) || (!$scope.anchor.length) )
                    {
                        $scope.anchor = 'left';
                    }

                    // close the sidebar when a click lands outside of it
                    angular.element(window).bind('mousedown', function(event) 
                    {
                        if ($scope.showMenu)
                        {
                            // if the target of the click was our launcher, then ignore
                            if ($scope.launcherEl) 
                            {
                                if ( ($scope.launcherEl[0] == event.target) || 
                                     ($scope.launcherEl.find(event.target).length > 0) )
                                {
                                    return;
                                }
                            }

                            // otherwise, if the click landed outside of the menu, then hide it
                            if (!element.find(event.target).length)
                            {
                                $scope.$apply(function()
                                {
                                    $scope.showMenu = false;
                                });
                            }
                        }
                    });

                    // locate the launcher element
                    $scope.$watch('launcher', function(newval)
                    {
                        if (newval)
                        {
                            $scope.launcherEl = angular.element(newval);
                        }
                        else
                        {
                            $scope.launcherEl = null;
                        }
                    });

                    // process options when they are set
                    $scope.$watch('options', function()
                    {
                        $scope.makeOptions();
                        $scope.authorizeOptions();
                    });

                    $rootScope.$on("user.permissionsChanged", function()
                    {
                        $scope.makeOptions();
                        $scope.authorizeOptions();
                    });

                    // close this menu when another opens
                    $rootScope.$watch('currentModal', function()
                    {
                        if ($rootScope.currentModal != element)
                        {
                            $scope.showMenu = false;
                        }
                    });

                    // collapse all submenus whenever the menu is hidden
                    $scope.$watch('showMenu', function()
                    {
                        if ($scope.showMenu)
                        {
                            $scope.processOptions();
                            $scope.menuReady = true;
                            $rootScope.currentModal = element;
                        }
                        else
                        {
                            $scope.menuReady = true;
                            applicationService.setStatusText(null);
                        }
                    });

                    // when user changes views, hide all menus
                    $transitions.onSuccess({}, function()
                    {
                        $scope.showMenu = false;
                    });

                    // hide menu on escape
                    angular.element(window).bind('keydown', function(event)
                    {
                        if (event.which == constants.KEYS.ESC)
                        {
                            event.stopPropagation();

                            $scope.$apply(function()
                            {
                                $scope.showMenu = false;
                            });
                        }
                    });

                    angular.element(element)
                        .addClass('sidebar')
                        .addClass($scope.anchor);
                }

                /**
                 * Generate the options
                 */
                $scope.makeOptions = function()
                {
                    var options = angular.copy($scope.options);

                    if (options)
                    {
                        $scope.menuItems = options;

                        // apply themes to options
                        themeService.theme($scope.menuItems, 'options');

                        this.authorizeOptions();
                        this.processOptions();
                    }
                    else
                    {
                        $scope.menuItems = [];
                    }
                }

                /**
                 * Process a set of options
                 *
                 * Applies theme, etc
                 */
                $scope.processOptions = function()
                {
                    // enable/disable entries based on existence of feature
                    utilsService.nestedForEach($scope.menuItems, 'options', function(option){

                        option.expanded      = false;
                        option.isCurrentPage = false;

                        if ( (option.options) && (option.options.length) )
                        {
                            option.enabled = true;
                        }
                        else
                        {
                            option.isCurrentPage = ($state.current.name == option.target);

                            if (option.isCurrentPage)
                            {
                                var parent = utilsService.findParent($scope.menuItems, option, 'options');

                                while (parent)
                                {
                                    parent.expanded = true;
                                    parent = utilsService.findParent($scope.menuItems, parent, 'options');
                                }
                            }

                            option.enabled = applicationService.stateExists(option.target);
                        }
                    });

                    $scope.menuReady = true;
                }

                /**
                 * Apply authorization to the current menu items
                 */
                $scope.authorizeOptions = function()
                {
                    // enable/disable entries based on existence of feature
                    utilsService.nestedForEach($scope.menuItems, 'options', function(option){

                        option.authorized = true;

                        if (option.auth)
                        {
                            option.authorized = applicationService.isAuthorized(option.auth, option.authTarget);
                        }
                    });

                    $scope.menuItems = _.reject($scope.menuItems, function(item){

                        var hadOptions = (item.options) && (item.options.length > 0);

                        // filter out unauthorized options
                        item.options = _.filter(item.options, function(option) {
                           return (option.authorized);
                        });

                        // if we filtered out all of this item's options, then hide the
                        // item as well
                        return ( (hadOptions) && (item.options.length == 0) );
                    });
                }

                /**
                 * Respond to a clicked item
                 *
                 * @param event The event that triggered the click
                 * @param item  The item that was clicked
                 */
                $scope.menuItemClicked = function(event, item)
                {
                    if (event)
                    {
                        event.stopPropagation();
                    }

                    if ( (!item) || (!item.enabled) )
                    {
                        return;
                    }

                    if ( (item.options) && (item.options.length) )
                    {
                        item.expanded = !item.expanded;

                        if (item.expanded)
                        {
                            _.each($scope.menuItems, function (option) {
                                if (option != item)
                                {
                                    option.expanded = false;
                                }
                            });
                        }
                    }
                    else if (item.target)
                    {
                        try
                        {
                            if ($state.is(item.target))
                            {
                                $scope.showMenu = false;
                            }
                            else
                            {
                                $state.go(item.target);
                            }
                        }
                        catch (error)
                        {
                            $state.go('not-found');
                        }
                    }
                }

                /**
                 * Respond to a hovered item
                 *
                 * @param item The item that was hovered
                 */
                $scope.menuItemHovered = function(item)
                {
                    if ( (!item) || (!item.enabled) )
                    {
                        return;
                    }

                    applicationService.setStatusText(item.tooltip);
                }

                init();
            }
        };

        return directive;

    }]);