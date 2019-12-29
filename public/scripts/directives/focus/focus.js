angular.module('d20helper.focus', [])

.directive('autoFocus', ['$timeout',
    function($timeout)
    {
        var directive =
        {
            restrict: 'AC',

            link: function(_scope, _element)
            {
                $timeout(
                    function()
                    {
                        _element[0].focus();
                    },
                    0
                );
            }
        };

        return directive;
    }
]);