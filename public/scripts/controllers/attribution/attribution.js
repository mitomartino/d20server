'use strict';

angular.module('d20helper.attribution', ['ngRoute']).

config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {

    $stateProvider.state('attribution', {
        url: '/credits',
        templateUrl: 'scripts/controllers/attribution/attribution.html',
        controller: 'AttributionCtrl',
        data:
        {
            title:  'Credits',
            status: 'Viewing credits'
        }
    });
}]).

controller('AttributionCtrl', ['$scope', 'themeService', function($scope, themeService) {

}]);