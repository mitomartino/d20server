angular.module('d20helper.chatComponents', [])

    /**
     * directive: chatPanel
     *
     * Element directive that allows a user to open/leave conversations
     */
    .directive('chatPanel',

        ['$rootScope', '$timeout', '$q', 'constantsService', 'applicationService', 'chatService', 'modalService', 'socketService',

        function($rootScope, $timeout, $q, constants, applicationService, chatService, modalService, socketService)
        {
            /**
             * Directive definition object
             */
            var directive =
            {
                /**
                 * Element only
                 */
                restrict: 'E',

                /**
                 * Template for this directive
                 */
                templateUrl: 'scripts/directives/chat/chat-panel.html',

                /**
                 * Isolated scope for this directive
                 */
                scope:
                {
                    with:           '=?',     // optional recipient filter list
                    conversation:   '=?',     // optional conversation to load
                    onSelect:       '&',      // callback for when a conversation is selected
                    onExit:         '&',      // callback for when a conversation is exited
                    showSideBySide: '=?'      // whether to show conversation list as sidebar
                },

                /**
                 * Link function for the directive
                 *
                 * @param scope   scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                     * Initialize the directive for this element
                     */
                    function init()
                    {
                    }

                    /**
                     * Select the given conversation
                     *
                     * @param conversation The conversation to select
                     */
                    $scope.selectConversation = function(conversation)
                    {
                        var delegate = null;

                        if ($scope.onSelect)
                        {
                            delegate = $scope.onSelect();
                        }

                        if (delegate)
                        {
                            delegate(conversation);
                        }
                        else
                        {
                            $scope.conversation = conversation;
                        }
                    }

                    /**
                     * Return to the conversation list
                     */
                    $scope.unselectConversation = function()
                    {
                        var delegate = null;

                        if ($scope.onExit)
                        {
                            delegate = $scope.onExit();
                        }

                        if (delegate)
                        {
                            delegate();
                        }
                        else
                        {
                            $scope.conversation = null;
                        }
                    }

                    // call init once interpolation has occurred at least once
                    $timeout(init, 10);
                }
            };

            return directive;
        }
    ])

    /**
     * directive: chatConversationsList
     *
     * Element directive that allows a user to view the list of conversations
     */
    .directive('chatConversationsList',

        ['$rootScope', '$timeout', '$q', 'constantsService', 'applicationService', 'chatService', 'modalService', 'socketService',

        function($rootScope, $timeout, $q, constants, applicationService, chatService, modalService, socketService)
        {
            /**
             * Directive definition object
             */
            var directive =
            {
                /**
                 * Element only
                 */
                restrict: 'E',

                /**
                 * Template for this directive
                 */
                templateUrl: 'scripts/directives/chat/chat-conversations-list.html',

                /**
                 * Isolated scope for this directive
                 */
                scope:
                {
                    onlyWith:         '=?',    // optional recipient filter list
                    onSelect:         '&'      // callback for when a conversation is selected
                },

                /**
                 * Link function for the directive
                 *
                 * @param scope   scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                     * Initialize the directive for this element
                     */
                    function init()
                    {
                        $scope.filterText = '';

                        $scope.$watch('onlyWith', function(newVal, oldVal)
                        {
                            $scope.loadConversations();
                        });

                        $rootScope.$on("chat.conversationsChanged", function(event, manager)
                        {
                            if (!manager.isInitialData())
                            {
                                $scope.allConversations = manager.data;

                                $scope.filterConversations();
                            }
                        });

                        $scope.loadConversations();
                    }

                    /**
                     * Allow the user to create a new conversation
                     */
                    $scope.newConversation = function()
                    {
                        chatService.showNewConversationModal($scope.onlyWith);
                    }

                    /**
                     * Prompt the user to add a participant to the given conversation
                     *
                     * @param conversation The conversation to modify
                     */
                    $scope.addParticipant = function(conversation)
                    {
                        var participants = _.pluck(conversation.participants, 'user');

                        var callback = function(users)
                        {
                            return chatService.addParticipant(conversation, users);
                        }

                        var options =
                        {
                            title:           'Add User To Conversation',
                            prompt:          'Select a user to add to the conversation',
                            disallowedUsers: participants,
                            callback:        callback,
                            allowSelf:       false,
                            multiSelect:     false
                        };

                        modalService.openUserSelectModal(options);
                    }

                    /**
                     * Archive the given conversation
                     *
                     * @param conversation The conversation to archive
                     */
                    $scope.archive = function(conversation)
                    {
                        var callback = function(option)
                        {
                            if (option.text == "Yes")
                            {
                                return chatService.archive(conversation);
                            }
                        };

                        modalService.openYesNo(
                            "Archive Conversation",
                            "Once archived, the conversation will become read-only.  Archive this conversation?",
                            callback);
                    }

                    /**
                     * Load and present a list of conversations
                     */
                    $scope.loadConversations = function()
                    {
                        chatService.loadUserConversations().then(function(conversations)
                        {
                            $scope.allConversations = conversations;
                            $scope.filterConversations();
                        });
                    }

                    /**
                     * Select the first conversation in the list
                     */
                    $scope.selectFirstConversation = function()
                    {
                        if ( ($scope.conversations) && ($scope.conversations.length) )
                        {
                            $scope.selectConversation($scope.conversations[0]);
                        }
                    }

                    /**
                     * Select the given conversation
                     *
                     * @param conversation The conversation to select
                     */
                    $scope.selectConversation = function(conversation)
                    {
                        if ($scope.onSelect)
                        {
                            $scope.onSelect()(conversation);
                        }
                    }

                    /**
                     * Filter the conversations that the current user does not belong to
                     */
                    $scope.filterConversations = function()
                    {
                        $scope.conversations = $scope.allConversations;

                        var search = $scope.onlyWith;

                        if ( ($scope.onlyWith) && (!_.isArray(search)) )
                        {
                            search = [search];
                        }

                        $scope.conversations = _.filter($scope.conversations, function(conversation)
                        {
                            // filter on our filter text if necessary
                            if ( ($scope.filterText) && ($scope.filterText.length) )
                            {
                                var match = false;

                                // match on title
                                if (conversation.title.indexOf($scope.filterText) != -1)
                                {
                                    match = true;
                                }

                                // match on participant nickname
                                if (!match)
                                {
                                    var ii    = 0;
                                    var count = conversation.participants.length;

                                    while ( (ii < count) && (!match) )
                                    {
                                        var participant = conversation.participants[ii].user;

                                        if (participant.nickname.indexOf($scope.filterText) != -1)
                                        {
                                            match = true;
                                        }

                                        ++ii;
                                    }
                                }

                                if (!match)
                                {
                                    return false;
                                }
                            }

                            // if the target user is a part of the conversation, then include it
                            if (!search)
                            {
                                return true;
                            }

                            for (var ii in search)
                            {
                                if (_.findWhere(conversation.participants, {userId: search[ii]._id}))
                                {
                                    return true;
                                }
                            }

                            // otherwise exclude it
                            return false;
                        });

                        $scope.conversations = _.sortBy($scope.conversations, "lastUpdated");
                        $scope.conversations.reverse();
                    }

                    // call init once interpolation has occurred at least once
                    $timeout(init, 10);
                }
            };

            return directive;
        }
    ])

    /**
     * directive: chatConversation
     *
     * Element directive that allows a user to participate in a single conversation
     */
    .directive('chatConversation',

        ['$rootScope', '$timeout', '$q', 'constantsService', 'applicationService', 'chatService', 'modalService', 'socketService',

        function($rootScope, $timeout, $q, constants, applicationService, chatService, modalService, socketService)
        {
            /**
             * Directive definition object
             */
            var directive =
            {
                /**
                 * Element only
                 */
                restrict: 'E',

                /**
                 * Template for this directive
                 */
                templateUrl: 'scripts/directives/chat/chat-conversation.html',

                /**
                 * Isolated scope for this directive
                 */
                scope:
                {
                    showConversation: '=conversation', // the conversation to load
                    onlyWith:         '=?',            // optional recipient filter list
                    onExit:           '&'              // callback for when a conversation is exited
                },

                /**
                 * Link function for the directive
                 *
                 * @param scope   scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                    * Initialize the directive for this element
                    */
                    function init()
                    {
                        $scope.currentUser = applicationService.model.currentUser;
                        $scope.multiline   = false;

                        $scope.typingStatus =
                        {
                            timer:  null,
                            typing: false
                        };

                        $scope.newMessage =
                        {
                            text:        '',
                            mood:        'default',
                            style:       '',
                            attachments: []
                        };

                        $scope.lastAttach =
                        {
                            file:       null,
                            drawer:     null,
                            collection: null
                        };

                        $scope.error = "Select a conversation to display";

                        $rootScope.$on("chat.conversationsChanged", function(event, manager)
                        {
                            if (!manager.isInitialData())
                            {
                                $scope.exitIfNotParticipating();
                            }
                        });

                        $scope.$watch('showConversation', function(oldval, newval)
                        {
                            if ($scope.showConversation)
                            {
                                var timeout = 0;

                                if ($scope.conversation)
                                {
                                    $scope.conversation = null;
                                    timeout             = 500;
                                }

                                $timeout(
                                    function()
                                    {
                                        $scope.loadConversation();
                                    },
                                    timeout
                                );
                            }
                            else
                            {
                                $scope.conversation = null;
                                $scope.error        = "Select a conversation to display";
                            }
                        });

                        applicationService.onServerUpdate("chat.message", $scope, function(data)
                        {
                            if ( ($scope.conversation) && ($scope.conversation._id == data._id) )
                            {
                                $timeout(
                                    function()
                                    {
                                        $scope.scrollToBottom(true);
                                    },
                                    50
                                );
                            }

                        },);
                    }

                    /**
                     * Load the current conversation
                     */
                    $scope.loadConversation = function()
                    {
                        $scope.newMessage =
                        {
                            text:        '',
                            mood:        'default',
                            style:       '',
                            attachments: []
                        };

                        if ($scope.showConversation)
                        {
                            chatService.loadMessages($scope.showConversation).then(
                                function(conversation)
                                {
                                    $scope.conversation = conversation;

                                    chatService.focusConversation($scope.conversation._id);

                                    $timeout(
                                        function()
                                        {
                                            $scope.scrollToBottom();
                                        }
                                    );

                                    $scope.error = null;
                                },
                                function(err)
                                {
                                    $scope.error = err;
                                }
                            );
                        }
                    }

                    /**
                     * Scroll to the bottom of the chat message panel
                     *
                     * @param animateIt Whether to animate the scroll or just jump
                     */
                    $scope.scrollToBottom = function(animateIt)
                    {
                        var chatPanel    = element.find('.messages');
                        var scrollHeight = chatPanel.prop('scrollHeight');

                        if (animateIt)
                        {
                            chatPanel.animate({scrollTop: scrollHeight}, 750);
                        }
                        else
                        {
                            chatPanel.prop('scrollTop', scrollHeight);
                        }
                    }

                    /**
                     * Respond to a keypress
                     *
                     * May toggle multiline editing or submit the keypress
                     *
                     * @param $event The key press event
                     */
                    $scope.keyDown = function($event)
                    {
                        if ($event.keyCode == constants.KEYS.ESC)
                        {
                            $event.preventDefault();
                            $event.stopPropagation();
                            $scope.done();
                        }
                        else if ($event.keyCode == constants.KEYS.ENTER)
                        {
                            if ($event.ctrlKey)
                            {
                                $event.preventDefault();
                                $scope.multiline = !$scope.multiline;

                                $timeout($scope.scrollToBottom);
                            }
                            else if ($event.shiftKey)
                            {
                                if ($scope.multiline)
                                {
                                    $scope.postMessage();
                                    $event.preventDefault();
                                }
                                else
                                {
                                    $scope.multiline = !$scope.multiline;
                                }
                            }
                            else if (!$scope.multiline)
                            {
                                $event.preventDefault();
                                $scope.postMessage();
                            }
                        }
                        else if ($scope.conversation)
                        {
                            if ($scope.typingStatus.timer)
                            {
                                $timeout.cancel($scope.typingStatus.timer);
                            }
                            else
                            {
                                applicationService.sendServerUpdate(
                                    "chat.typingStatus",
                                    {
                                        conversation: $scope.conversation._id,
                                        typing:       true
                                    }
                                );
                            }

                            $scope.typingStatus.timer = $timeout(
                                function()
                                {
                                    applicationService.sendServerUpdate(
                                        "chat.typingStatus",
                                        {
                                            conversation: $scope.conversation._id,
                                            typing:       false
                                        }
                                    );

                                    $scope.typingStatus.timer = null;
                                },
                                750
                            );
                        }
                    }

                    /**
                     * Prompt the user for a targeted list of recipients
                     */
                    $scope.setWhisper = function()
                    {
                        var conversation = $scope.conversation;

                        if (conversation)
                        {
                            var participants = _.pluck(conversation.participants, 'user');

                            var callback = function(users)
                            {
                            }

                            var modal = modalService.openUserSelectModal(
                                {
                                    title:           'Whisper',
                                    prompt:          'Select users to receive this whisper',
                                    allowedUsers:    participants,
                                    callback:        callback,
                                    allowSelf:       false,
                                    multiSelect:     true,
                                    selectedUsers:   $scope.newMessage.recipients
                                });

                            modal.result.then(
                                function(users)
                                {
                                    $scope.newMessage.recipients = users;
                                },
                                function()
                                {
                                    $scope.newMessage.recipients = null;
                                }
                            )
                        }
                    }

                    /**
                     * Attach a new file to the next message
                     */
                    $scope.attachFile = function()
                    {
                        if ($scope.newMessage.attachments.length)
                        {
                            $scope.newMessage.attachments = [];
                        }
                        else
                        {
                            var options =
                            {
                                title:            "Attach File",
                                prompt:           "Choose a file to attach to the outgoing message",
                                systemCollection: "system",
                                userCollection:   applicationService.model.currentUser._id,
                                collection:       $scope.lastAttach.collection,
                                drawer:           $scope.lastAttach.drawer,
                                file:             $scope.lastAttach.file
                            };

                            options.callback = function(selection)
                            {
                                $scope.newMessage.attachments.push(
                                    {
                                        url:         selection.fullPath,
                                        contentType: selection.type
                                    });

                                $scope.lastAttach = selection;
                            }

                            modalService.openFileChooserModal(options).then(null, function()
                            {
                                $scope.newMessage.attachments = [];
                            });
                        }
                    }

                    /**
                     * Post a new message to the current conversation
                     */
                    $scope.postMessage = function()
                    {
                        if ($scope.conversation)
                        {
                            var len = $scope.newMessage.text.trim().length;

                            if ((len) && (len < 1024))
                            {
                                var msg = $scope.newMessage;

                                $scope.posting = true;

                                var promise = chatService.postMessage(
                                    $scope.conversation, msg.text, msg.mood, msg.style, msg.recipients, msg.attachments);

                                promise.finally(function ()
                                {
                                    $scope.newMessage.text        = '';
                                    $scope.newMessage.attachments = [];
                                    $scope.posting                = false;
                                });
                            }
                        }
                    }

                    /**
                     * Exit this view if we are no longer participating in the conversation
                     */
                    $scope.exitIfNotParticipating = function()
                    {
                        if ($scope.conversation)
                        {
                            var currUser = applicationService.model.currentUser;
                            var thisUser = _.findWhere($scope.conversation.participants, {userId: currUser._id});

                            if (!thisUser)
                            {
                                $scope.done();
                            }
                        }
                    }

                    /**
                     * Exit this view
                     */
                    $scope.done = function()
                    {
                        chatService.focusConversation(null);

                        if ($scope.onExit)
                        {
                            $scope.onExit()();
                        }
                    }

                    /**
                     * Leave the current conversation
                     */
                    $scope.leaveConversation = function()
                    {
                        var callback = function(option)
                        {
                            if (option.text == "Yes")
                            {
                                return chatService.removeParticipant($scope.conversation, $scope.currentUser);
                            }
                        };

                        modalService.openYesNo(
                            "Leave Conversation",
                            "Once you leave the conversation, you will not be able to join again until invited.  Leave now?",
                            callback);
                    }

                    /**
                     * Once this view is destroyed, we are not focusing on a conversation.
                     */
                    $scope.$on("$destroy", function() 
                    {
                        chatService.focusConversation(null);
                    });

                    // call init once interpolation has occurred at least once
                    $timeout(init, 10);
                }
            };

            return directive;
        }
    ]);


