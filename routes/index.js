var express = require('express');
var router = express.Router();

var appInfo =
{
    title:          "D20 Helper Suite",
    description:    "Series of tools for the DM",
    mainController: "MainCtrl",
    viewport:       "width=device-width, initial-scale=1",

    stylesheets:
    [
        "node_modules/html5-boilerplate/dist/css/normalize.css",
        "node_modules/html5-boilerplate/dist/css/main.css",
        "node_modules/font-awesome/css/font-awesome.min.css",
        "node_modules/angular-material/angular-material.min.css",
        "css/app.css",
        "css/animate.css",
        "css/animations.css",
        "themes/default/theme.css"
    ],

    scripts:
    [
        "node_modules/html5-boilerplate/dist/js/vendor/modernizr-3.8.0.min.js",
        "node_modules/jquery/dist/jquery.min.js",
        "node_modules/angular/angular.js",
        "node_modules/angular-route/angular-route.js",
        "node_modules/angular-animate/angular-animate.js",
        "node_modules/angular-messages/angular-messages.min.js",
        "node_modules/angular-aria/angular-aria.min.js",
        "node_modules/angular-material/angular-material.min.js",
        "node_modules/angular-ui-router/release/angular-ui-router.min.js",
        "node_modules/moment/min/moment-with-locales.min.js",
        "node_modules/angular-momentjs/angular-momentjs.min.js",
        "node_modules/underscore/underscore-min.js",
        "/socket.io/socket.io.js",

        "app.js",

        "scripts/classes/data/cache.js",
        "scripts/classes/data/structures.js",

        "scripts/directives/keyboard/keyboard.js",
        "scripts/directives/notifications/notifications.js",
        "scripts/directives/sidebar-menu/sidebar-menu.js",
        "scripts/directives/focus/focus.js",
        "scripts/directives/user-tile/user-tile.js",
        "scripts/directives/expanding-overlay/expanding-overlay.js",
        "scripts/directives/files/collection-browser/collection-browser.js",
        "scripts/directives/files/collection-file-chooser/collection-file-chooser.js",
        "scripts/directives/files/attachments/attachments.js",
        "scripts/directives/files/image-chooser/image-chooser.js",
        "scripts/directives/auth/show-if-authorized.js",
        "scripts/directives/chat/chat.js",

        "scripts/controllers/login/login.js",
        "scripts/controllers/oops/oops.js",
        "scripts/controllers/main/main.js",
        "scripts/controllers/dashboard/dashboard.js",
        "scripts/controllers/user/profile.js",
        "scripts/controllers/user/calendar.js",
        "scripts/controllers/attribution/attribution.js",
        "scripts/controllers/admin/users/users.js",
        "scripts/controllers/admin/users/add-user.js",
        "scripts/controllers/games/matchmaker.js",
        "scripts/controllers/games/my-games.js",
        "scripts/controllers/games/new-game.js",
        "scripts/controllers/chat/chat.js",
        "scripts/controllers/chat/new-conversation.js",

        "scripts/services/theme-service.js",
        "scripts/services/utils-service.js",
        "scripts/services/constants-service.js",
        "scripts/services/ajax-service.js",
        "scripts/services/collection-service.js",
        "scripts/services/application-service.js",
        "scripts/services/modal-service.js",
        "scripts/services/user-service.js",
        "scripts/services/game-service.js",
        "scripts/services/chat-service.js",
        "scripts/services/socket-service.js",

        "scripts/filters/numeric.js"
    ]
};

/* GET home page. */
router.get('/', function(req, res, next)
{
    res.render('index',
    {
        appInfo: appInfo
    });
});

module.exports = router;
