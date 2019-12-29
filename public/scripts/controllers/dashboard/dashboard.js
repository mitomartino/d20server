'use strict';

angular.module('d20helper.dashboard', ['ngRoute']).

config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {

    $stateProvider.state('dashboard', {
        url: '/dashboard',
        templateUrl: 'scripts/controllers/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        data:
        {
            title: 'Home',
            status: 'At Home'
        }
    });
}]).

controller('DashboardCtrl', ['$scope', 'themeService', function($scope, themeService) {

}]);