angular.module('d20helper.notifications', [])

/**
 * directive: notificationPopup
 *
 * popup panel that shows the current notification
 */
.directive('notificationPopup', [

    '$timeout', '$rootScope', 'utilsService', "notificationService",

    function($timeout, $rootScope, utilsService, notificationService)
    {
        var directive =
        {
            /**
             * Element-only matching
             */
            restrict: 'E',

            /**
             * Isolated scope
             */
            scope   :
            {
                timeToLive:   "=?",           // how long until the popup disappears
                notification: "=?"            // notification to display
            },

            /**
             * Template for the sidebar-menu container
             */
            templateUrl: 'scripts/directives/notifications/notification-popup.html',

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
                    $scope.history          = [];
                    $scope.notifications    = [];

                    $scope.$watch("notification", function(newVal)
                    {
                        if (newVal)
                        {
                            $scope.history.push(newVal);
                            $scope.showNextNotification();
                        }
                    });

                    element
                        .css("position", "absolute")
                        .css("bottom",   "0")
                        .css("right",    "0")
                        .css("zIndex",   "99");
                }

                /**
                 * Handle mouse entering the panel
                 *
                 * @param notification The notification handling the event
                 */
                $scope.mouseOver = function(notification)
                {
                    if (notification.hideTimeout)
                    {
                        notification.resumeOnExit = true;

                        $timeout.cancel(notification.hideTimeout);
                        notification.hideTimeout  = null;
                    }
                }

                /**
                 * Handle mouse exiting the panel
                 *
                 * @param notification The notification handling the event
                 */
                $scope.mouseOut = function(notification)
                {
                    if (notification.resumeOnExit)
                    {
                        notification.resumeOnExit = false;
                        $scope.scheduleHide(notification);
                    }
                }

                /**
                 * Handle the user clicking on the notification panel
                 *
                 * @param notification The notification handling the event
                 */
                $scope.clickThrough = function(notification)
                {
                    if (_.isString(notification.click))
                    {
                        $state.go(notification.click);
                    }
                    else if (notification.click)
                    {
                        notification.click();
                    }
                }

                /**
                 * Show the next notification
                 */
                $scope.showNextNotification = function()
                {
                    var notification = $scope.notification;

                    if (notification)
                    {
                        notification.showNotification = true;

                        $scope.notifications.push(notification);

                        if (notification.hideTimeout)
                        {
                            $timeout.cancel(notification.hideTimeout);
                            notification.hideTimeout = null;
                        }

                        $scope.scheduleHide(notification);
                    }
                }

                /**
                 * Schedule the panel to hide itself
                 *
                 * @param notification The notification to hide
                 */
                $scope.scheduleHide = function(notification)
                {
                    notification.hideTimeout = $timeout(
                        function()
                        {
                            $scope.hideNotification(notification);
                        },
                        $scope.timeToLive || 5000
                    );
                }

                /**
                 * Hide the given notification
                 *
                 * @param notification The notification to hide
                 */
                $scope.hideNotification = function(notification)
                {
                    notification.showNotification = false;
                    notification.hideTimeout      = null;
                    $scope.notifications          = _.without($scope.notifications, notification);
                }

                init();
            }
        };

        return directive;
    }
]).

/**
 * Notification service:
 *
 */
factory("notificationService", [

    "$rootScope", "$timeout", "$state", "applicationService", "constantsService", "chatService",

    function($rootScope, $timeout, $state, applicationService, constants, chatService)
    {
        var service =
        {
            name: "notification-service",
            model:
            {
                notification: null
            }
        };

        // ------------------------------------------------------------------------------------------------------
        // service public interface
        // ------------------------------------------------------------------------------------------------------

        /**
         * Display a notification
         *
         * clickThrough can be a state name or a function
         *
         * @param iconType     The type of icon ("fa", "image", etc)
         * @param icon         The icon
         * @param title        The title of the notification
         * @param message      The notification message
         * @param clickThrough How to handle the user clicking on the notification
         */
        service.notify = function(iconType, icon, title, message, click)
        {
            service.model.lastNotification =
            {
                iconType: iconType,
                icon:     icon,
                title:    title,
                message:  message,
                click:    click
            };

            $rootScope.notification = service.model.lastNotification;
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Notify that the current user has gained a privilege
         *
         * @param entitlement The privilege to notify
         */
        service.notifyGainedPrivilege = function(entitlement)
        {
            entitlement = entitlement.entitlement || entitlement;

            constants.lookup("permissions").then(function(permissions)
            {
                var permission = _.findWhere(permissions, {entitlement: entitlement});

                if (permission)
                {
                    var text = "You have received " + permission.description;

                    var click = function()
                    {
                        if (permission.routeState)
                        {
                            var name = permission.routeState.name;
                            var data = permission.routeState.data;

                            if (data)
                            {
                                data = angular.fromJson(data);
                            }

                            if (name)
                            {
                                $state.go(name, data);
                            }
                        }
                    };

                    service.notify("fa", permission.icon + " general-icon", "Permissions", text, click);
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Notify that the current user has lost a privilege
         *
         * @param entitlement The privilege to notify
         */
        service.notifyLostPrivilege = function(entitlement)
        {
            entitlement = entitlement.entitlement || entitlement;

            constants.lookup("permissions").then(function(permissions)
            {
                var permission = _.findWhere(permissions, {entitlement: entitlement});

                if (permission)
                {
                    var text = "You have lost " + permission.description;

                    service.notify("fa", permission.icon + " general-icon", "Permissions", text, null);
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------
        // private methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
            $rootScope.$on("user.permissionsChanged", function(event, update)
            {
                if (update.type == "permitted")
                {
                    service.notifyGainedPrivilege(update);
                }
                else
                {
                    service.notifyLostPrivilege(update);
                }
            });

            applicationService.onServerUpdate("notifications.notify", null, function(data)
            {
                service.notify(data.iconType, data.icon, data.title, data.text);
            });

            applicationService.onServerUpdate("user.online", null, function(user)
            {
                var title = "Users";

                if (_.isArray(user))
                {
                    var users = _.reject(user, function(userId)
                    {
                        return (userId == applicationService.model.currentUser._id);
                    });

                    service.notify("fa", "fa-user-plus general-icon", title, users.length + " other(s) online");
                }
                else if (user._id != applicationService.model.currentUser._id)
                {
                    service.notify("fa", "fa-user-plus general-icon", title, user.nickname + " is available");
                }
            });

            applicationService.onServerUpdate("user.offline", null, function(user)
            {
                if (user._id != applicationService.model.currentUser._id)
                {
                    service.notify("fa", "fa-user-times general-icon", "Users", user.nickname + " is no longer available");
                }
            });

            $rootScope.$on("chat.message", function(event, conversation, update)
            {
                chatService.loadUserConversations().then(function(conversations)
                {
                    var conversation = _.findWhere(conversations, {_id: update._id});
                    var msg          = update.newMessages[0];

                    if ( (msg) && (msg.from != applicationService.model.currentUser) && (chatService.focusedConversation !== update._id) )
                    {
                        var clickThrough = function()
                        {
                            $state.go("chat", {conversationId: update._id});
                        }

                        if (conversation)
                        {
                            var participant  = _.findWhere(conversation.participants, {userId: msg.from});

                            if ( (participant) && (participant.user) )
                            {
                                service.notify("image", participant.user.avatar, conversation.title, msg.text, clickThrough);
                            }
                            else
                            {
                                service.notify("fa", "fa-envelope", conversation.title, msg.text, clickThrough);
                            }
                        }
                    }
                });
            });

            // notify when this user is added to a conversation
            $rootScope.$on("chat.addedParticipants", function(event, conversation, update)
            {
                var currUser     = applicationService.model.currentUser;

                var clickThrough = function()
                {
                    $state.go("chat", {conversationId: conversation._id});
                }

                // if the new participant is the logged in user, then notify
                if ( (_.indexOf(update.participants, currUser._id) != -1) )
                {
                    var title = conversation.title;
                    var msg   = update.by.nickname + " added you to the conversation \"" + conversation.title + "\"";

                    service.notify("image", update.by.avatar, "Conversations", msg, clickThrough);
                }
            });

            $rootScope.$on("notify", function(event, data)
            {
                $rootScope.notification = data;
            });
        }

        init();


        return service;
    }
]);