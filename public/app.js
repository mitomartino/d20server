'use strict';

// Declare app level module which depends on views, and components
angular.module('d20helper', [
    'ngRoute',
    'ngAnimate',
    'ui.router',
    'angular-moment',
    'ngMaterial',

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

/**
 * Application configuration
 */
config(['$urlRouterProvider', '$mdThemingProvider', function($urlRouterProvider, $mdThemingProvider) {

    // configure default routes
    $urlRouterProvider.when('',  '/login');
    $urlRouterProvider.when('/', '/login');
    $urlRouterProvider.otherwise('/not-found');

    // configure theming: palettte generated via
    // http://http://mcg.mbitson.com/
    $mdThemingProvider.definePalette('d20basic',
    {
        '50': 'e6edf3',
        '100': 'bfd1e1',
        '200': '95b3cd',
        '300': '6b94b8',
        '400': '4b7da9',
        '500': '2b669a',
        '600': '265e92',
        '700': '205388',
        '800': '1a497e',
        '900': '10386c',
        'A100': 'a1c5ff',
        'A200': '6ea6ff',
        'A400': '3b86ff',
        'A700': '2277ff',

        'contrastDefaultColor': 'light',

        'contrastDarkColors':
         [
          '50',
          '100',
          '200',
          '300',
          'A100',
          'A200'
        ],

        'contrastLightColors': 
        [
          '400',
          '500',
          '600',
          '700',
          '800',
          '900',
          'A400',
          'A700'
        ]
      });
    
      $mdThemingProvider.theme('default')
        .primaryPalette('d20basic');      
}]);
