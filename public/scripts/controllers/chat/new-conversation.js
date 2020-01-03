'use strict';

angular.module('d20helper.newConversationModal', ['ngRoute']).

/**
 * Controller for creating new conversations
 */
controller('NewConversationModalCtrl', [
    '$scope', '$mdDialog', 'allowedUsers', 'constantsService', 'applicationService', 'chatService',

    function($scope, $mdDialog, allowedUsers, constants, applicationService, chatService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.allowedUsers = allowedUsers;
            $scope.conversation =
            {
                title: '',
                users: []
            };
        }

        /**
         * Attempt to create the conversation
         *
         * Validates the input and makes the request to create a new conversation if
         * applicable.
         */
        $scope.ok = function()
        {
            if (!$scope.validate())
            {
                return;
            }

            $scope.busy = true;

            var users = $scope.conversation.users;

            if (!users.length)
            {
                users = [users];
            }

            var req = chatService.createConversation($scope.conversation.title, users);

            var onSuccess = function(response)
            {
                $scope.busy = false;
                $mdDialog.hide(response);
            };

            var onError = function(response)
            {
                $scope.busy = false;

                $scope.errors =
                {
                    server: response.data.message
                };
            };

            req.then(onSuccess, onError);
        }

        /**
         * Validate the input
         */
        $scope.validate = function()
        {
            var valid  = true;

            $scope.errors = {};

            if ( (!$scope.conversation.title) || (!$scope.conversation.title.length) )
            {
                valid = false;
                $scope.errors.title = 'Title must be at least one character in length';
            }

            if ( (!$scope.conversation.users) || ($scope.conversation.users.length == 0) )
            {
                if ( (!$scope.allowedUsers) ||
                     ( (_.isArray($scope.conversation.users)) && ($scope.allowedUsers.length < 2)) )
                {
                    valid = false;
                    $scope.errors.users = 'You must add at least one participant';
                }
            }

            return valid;
        }

        init();
    }

]);
