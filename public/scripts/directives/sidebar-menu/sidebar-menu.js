'use strict';

angular.module('d20helper.sidebarMenu', [])

    .directive('sidebarMenu', ['$rootScope', '$state', 'applicationService', 'themeService', 'utilsService', 'constantsService',
        function($rootScope, $state, applicationService, themeService, utilsService, constants) {

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
                showMenu:   '='  // whether or not menu is visible
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
                    if ( (!$scope.anchor) || (!$scope.anchor.length) )
                    {
                        $scope.anchor = 'left';
                    }

                    // process options when they are set
                    $scope.$watch('options', function(){
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
                    $rootScope.$on('$stateChangeSuccess', function()
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