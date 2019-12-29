angular.module("d20helper.keyboard", [])

/**
 * directive: enterKey
 *
 * Attribute directive for handling enter key-presses
 */
.directive("enterKey", [

    "constantsService",

    function(constants)
    {
        var directive =
        {
            /**
             * Attribute only
             */
            restrict: "A",

            /**
             * No template for this directive
             */


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
                    // listen for key pressed
                    element.bind("keydown", function(ev)
                    {
                        if (ev.keyCode == constants.KEYS.ENTER)
                        {
                            ev.preventDefault();

                            $scope.$apply(function()
                            {
                                $scope.$eval(attrs.enterKey, {"event": ev});
                            });
                        }
                    });
                }

                init();
            }
        };

        return directive;
    }
])

/**
 * directive: escapeKey
 *
 * Attribute directive for handling escape key-presses
 */
.directive("escapeKey", [

    "constantsService",

    function(constants)
    {
        var directive =
        {
            /**
             * Attribute only
             */
            restrict: "A",

            /**
             * No template for this directive
             */


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
                    // listen for key pressed
                    element.bind("keydown", function(ev)
                    {
                        if (ev.keyCode == constants.KEYS.ESC)
                        {
                            ev.preventDefault();

                            $scope.$apply(function()
                            {
                                $scope.$eval(attrs.escapeKey, {"event": ev});
                            });
                        }
                    });
                }

                init();
            }
        };

        return directive;
    }
]);