'use strict';

angular.module('d20helper.chat', ['ngRoute']).

config(['$stateProvider', function($stateProvider)
{
    // state definitions
    $stateProvider.state("chat",
    {
        url:         "/chat/{conversationId}",
        controller:  "ChatCtrl",
        templateUrl: "scripts/controllers/chat/chat.html",
        params:
        {
            conversationId: null
        },
        data:
        {
            title:   'Conversations',
            status:  'In Chat'
        }
    });

}]).

/**
 * Controller for viewing conversations
 */
controller('ChatCtrl', [

    '$transitions', '$scope', '$state', '$stateParams', 'chatService', 'applicationService',

    function($transitions, $scope, $state, $stateParams, chatService, applicationService)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            // when the state changes, we want to try to update our message
            $transitions.onSuccess({}, function(transition)
            {
                $scope.setConversationFromState();
            });

            $scope.$watch("conversation", function(newVal)
            {
                if (newVal)
                {
                    applicationService.setTitle(newVal.title);
                }
                else
                {
                    applicationService.setTitle("Conversations");
                }
            });

            // initialize the message now
            $scope.setConversationFromState();
        }

        /**
         * Set the current conversation from the current state
         */
        $scope.setConversationFromState = function()
        {
            if ( ($state.current) && ($state.current.data) )
            {
                chatService.loadUserConversations().then(function(conversations)
                {
                    $scope.conversation = _.findWhere(conversations, {_id: $stateParams.conversationId});
                });
            }
            else
            {
                $scope.conversation = null;
            }
        }

        /**
         * Select the given conversation
         *
         * @param conversation The conversation to select
         */
        $scope.selectConversation = function(conversation)
        {
            $state.go("chat", {conversationId: conversation._id}, {notify: false});
            $scope.conversation = conversation;
        }

        /**
         * Clear out the current conversation
         */
        $scope.exitConversation = function()
        {
            $state.go("chat", {conversationId: null}, {notify: false});
            $scope.conversation = false;
        }

        init();
    }

]);
