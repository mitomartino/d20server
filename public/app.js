'use strict';

// Declare app level module which depends on views, and components
angular.module('d20helper', [
    'ngRoute',
    'ngAnimate',
    'ui.router',
    'ui.bootstrap',
    'angular-moment',

    'd20helper.data.cache',
    'd20helper.data.structures',

    'd20helper.notifications',
    'd20helper.keyboard',
    'd20helper.userTile',
    'd20helper.expandingOverlay',
    'd20helper.imageChooser',
    'd20helper.attachments',
    'd20helper.collectionBrowser',
    'd20helper.collectionFileChooser',
    'd20helper.focus',
    'd20helper.sidebarMenu',
    'd20helper.showIfAuthorized',
    'd20helper.chatComponents',

    'd20helper.applicationService',
    'd20helper.constantsService',
    'd20helper.utilsService',
    'd20helper.themeService',
    'd20helper.ajaxService',
    'd20helper.userService',
    'd20helper.collectionService',
    'd20helper.modalService',
    'd20helper.gameService',
    'd20helper.chatService',
    'd20helper.socketService',

    'd20helper.filters.numeric',

    'd20helper.main',
    'd20helper.login',
    'd20helper.chat',
    'd20helper.attribution',
    'd20helper.dashboard',
    'd20helper.oops',
    'd20helper.user.calendar',
    'd20helper.user.profile',
    'd20helper.admin.users',
    'd20helper.admin.addUser',
    'd20helper.games.myGames',
    'd20helper.games.matchmaker',
    'd20helper.games.newGame',
    'd20helper.newConversationModal'
]).
config(['$urlRouterProvider', '$stateProvider', function($urlRouterProvider, $stateProvider) {
    $urlRouterProvider.when('',  '/login');
    $urlRouterProvider.when('/', '/login');
    $urlRouterProvider.otherwise('/not-found');
}]);
