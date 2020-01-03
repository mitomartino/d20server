'use strict';

angular.module('d20helper.chatService', []).

/**
 * chat service
 *
 * Helper methods for managing chat windows
 *
 */
factory('chatService', ['$rootScope', '$q', 'ajaxService', 'applicationService', 'userService', 'modalService', 'socketService', 'cache',

    function($rootScope, $q, ajaxService, applicationService, userService, modalService, socketService, cache)
    {
        var service =
        {
            name: 'chat-service',
            focusedConversation: null,

            model:
            {
                conversations: new cache.AsyncCache("conversations")
            }
        };

        // ------------------------------------------------------------------------------------------------------
        // service interface methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Load all conversations involving the given user
         *
         * @param  user      The user to load conversations for
         * @return {Promise} A promise to track the request
         */
        service.loadUserConversations = function()
        {
            return service.model.conversations.load(
                function(resolve, reject)
                {
                    var req = ajaxService.request(
                    {
                        method: 'get',
                        url:    '/services/chat/conversations/participating'
                    });

                    req.then(
                        function(conversations)
                        {
                            var promises = [];

                            _.each(conversations, function(conversation)
                            {
                                if (conversation.lastUpdated)
                                {
                                    conversation.lastUpdatedDate = new Date(conversation.lastUpdated);
                                }

                                promises.push(processParticipants(conversation));
                            });

                            $q.all(promises).then(function()
                            {
                                resolve(conversations);
                            });
                        },
                        reject
                    );
                });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Load the messages for the given conversation
         *
         * @param   conversation The conversation to load messages for
         * @return  {Promise}    A promise to track the request
         */
        service.loadMessages = function(conversation)
        {
            return $q(function(resolve, reject)
            {
                var messages  = conversation.messages;

                if (!messages)
                {
                    messages              = [];
                    conversation.messages = messages;
                }

                if (conversation.lastMessageTime)
                {
                    var req = ajaxService.request(
                    {
                        method:     'get',
                        url:        '/services/chat/:conversationId/messages/since/:timestamp',
                        pathParams:
                        {
                            conversationId: conversation._id,
                            timestamp:      conversation.lastMessageTime
                        }
                    });

                    req.then(
                        function(update)
                        {
                            // append the new messages
                            processMessages(conversation, update).then(function()
                            {
                                resolve(conversation);
                            });
                        },
                        reject
                    );
                }
                else
                {
                    var req = ajaxService.request(
                    {
                        method:     'get',
                        url:        '/services/chat/:conversationId/messages/all',
                        pathParams:
                        {
                            conversationId: conversation._id
                        }
                    });

                    req.then(
                        function(update)
                        {
                            // append the new messages
                            processMessages(conversation, update).then(function()
                            {
                                resolve(conversation);
                            });
                        },
                        reject
                    );
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Display a modal allowing the user to create a new conversation
         *
         * @param  users     The user to allow conversations to be created with
         * @param  cssClass  The css class name to style the dialog
         * @return {Promise} A promise that will resolve with the new conversation or be rejected on cancel
         */
        service.showNewConversationModal = function(users, cssClass)
        {
            return modalService.open(
            {
                locals:
                {
                    allowedUsers: users
                },
                templateUrl: 'scripts/controllers/chat/new-conversation.html',
                controller:  'NewConversationModalCtrl',
                cssClass:    'new-chat-modal'
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Create a new conversation
         *
         * @param  title        The title for the new conversation
         * @param  participants An optional list of initial participants
         * @return {Promise} a promise
         */
        service.createConversation = function(title, participants)
        {
            return ajaxService.request(
            {
                method: 'post',
                url:    '/services/chat/conversations/create',
                data:
                {
                    title:        title,
                    participants: participants
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Give focus to the conversation with the given id
         * 
         * The focused conversation will receive real-time updates like typing notifications, etc. and will not
         * receive popup notifications for new messages.
         * 
         * @param id The conversation id or false-ish if none
         */
        service.focusConversation = function(id)
        {
            service.focusedConversation = id;

            if (id) 
            {
                socketService.join("chat." + id);
            }
        } 

        // ------------------------------------------------------------------------------------------------------

        /**
         * Post a message to the given conversation
         *
         * @param  conversation The conversation to post a message to
         * @param  text         The text for the message
         * @param  mood         The mood string for the message
         * @param  style        The style string of the message
         * @param  recipients   An optional list of user ids to selectively post to
         *                      if not present or empty, all users will see the message
         * @param  attachments  An optional list of files attached to the message
         * @return {Promise}    A promise to track the request
         */
        service.postMessage = function(conversation, text, mood, style, recipients, attachments)
        {
            return $q(function(resolve, reject)
            {
                var postData =
                {
                    text:  text,
                    mood:  mood,
                    style: style,
                };

                if ( (recipients) && (recipients.length !== 0) )
                {
                    postData.recipients = recipients;
                }

                if ( (attachments) && (attachments.length !== 0) )
                {
                    postData.attachments = attachments;
                }

                var req = ajaxService.request(
                {
                    method: 'post',
                    url:    '/services/chat/:conversationId/messages/add',
                    pathParams:
                    {
                        conversationId: conversation._id
                    },
                    data: postData
                });

                req.then(resolve, reject);
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Add a participant to the given conversation
         *
         * @param  conversation The conversation to add a participant to
         * @param  participant  user object representing the new participant
         * @return {Promise}    A promise to track the request
         */
        service.addParticipant = function(conversation, participant)
        {
            return ajaxService.request(
            {
                method:     'post',
                url:        '/services/chat/:conversationId/participants/add',
                pathParams:
                {
                    conversationId: conversation._id
                },
                data:
                {
                    userId:    participant._id
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Remove a participant from the given conversation
         *
         * @param  conversation The conversation to remove a participant from
         * @param  participant  user object representing the participant to remove
         * @return {Promise}    A promise to track the request
         */
        service.removeParticipant = function(conversation, participant)
        {
            return ajaxService.request(
            {
                method:     'post',
                url:        '/services/chat/:conversationId/participants/remove',
                pathParams:
                {
                    conversationId: conversation._id
                },
                data:
                {
                    userId:    participant._id
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Archive the given conversation
         *
         * @param conversation The conversation to archive
         */
        service.archive = function(conversation)
        {
            return ajaxService.request(
            {
                method:     'get',
                url:        '/services/chat/:conversationId/archive',
                pathParams:
                {
                    conversationId: conversation._id || conversation
                },
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
            var cons = service.model.conversations;
            
            cons.setChangeEvent("chat.conversationsChanged", $rootScope);

            // handle participant status
            applicationService.onServerUpdate("chat.typingStatus", null, function(data)
            {
                var conversation = _.findWhere(cons.data, {_id: data.conversation});

                if (conversation)
                {
                    var participant = _.findWhere(conversation.participants, {userId: data.userId});

                    if (participant)
                    {
                        participant.typingStatus = data;

                        if (data.typing)
                        {
                            if (!conversation.usersTyping)
                            {
                                conversation.usersTyping = [];
                            }
                            conversation.usersTyping.push(participant);
                        }
                        else if (conversation.usersTyping)
                        {
                            conversation.usersTyping = _.without(conversation.usersTyping, participant);
                        }
                    }
                }
            });

            // handle an updated conversation
            applicationService.onServerUpdate("chat.conversationChanged", null, function(data)
            {
                var conversation = _.findWhere(cons.data, {_id: data.conversation._id});

                // if the conversation has been archived, then remove from the list
                if ( (conversation) && (data.conversation.archived) )
                {
                    conversation.archived = 1;

                    service.model.conversations.remove(conversation);
                }
            });

            // handle an incoming chat message
            applicationService.onServerUpdate("chat.message", null, function(data)
            {
                var conversation = _.findWhere(cons.data, {_id: data._id});

                if ( (conversation) && (conversation.messages) )
                {
                    updateConversation(conversation, data).then(function()
                    {
                        conversation.lastUpdatedDate = new Date();
                        conversation.lastUpdated     = conversation.lastUpdatedDate;
                        
                        $rootScope.$broadcast("chat.message", conversation, data);
                    });
                }
            });

            // handle new participants added to a conversation
            applicationService.onServerUpdate("chat.addedParticipants", null, function(data)
            {
                var conversation = _.findWhere(cons.data, {_id: data.conversation._id});
                var currUser     = applicationService.model.currentUser;
                var existed      = !!conversation;

                if (!conversation)
                {
                    conversation = data.conversation;
                }

                conversation.lastUpdatedDate = new Date();
                conversation.lastUpdated     = conversation.lastUpdatedDate;

                _.each(data.participants, function(id)
                {
                    if (!_.findWhere(conversation.participants, {userId: id}))
                    {
                        conversation.participants.push({userId: id});
                    }
                });

                processParticipants(conversation).then(function()
                {
                    // if the new participant is the logged in user, then we should start tracking this conversation
                    if ( (_.indexOf(data.participants, currUser._id) != -1) && (!existed) )
                    {
                        service.model.conversations.append(conversation).then(function()
                        {
                            $rootScope.$broadcast("chat.addedParticipants", conversation, data);
                        });
                    }
                    else
                    {
                        $rootScope.$broadcast("chat.addedParticipants", conversation, data);
                    }
                });
            });

            // handle removed participants
            applicationService.onServerUpdate("chat.removedParticipants", null, function(data)
            {
                var conversation = _.findWhere(cons.data, {_id: data.conversation._id});

                if (conversation)
                {
                    var currUser = applicationService.model.currentUser;

                    conversation.lastUpdatedDate = new Date();
                    conversation.lastUpdated     = conversation.lastUpdatedDate;

                    conversation.participants = _.reject(conversation.participants, function(participant)
                    {
                        return (_.indexOf(data.participants, participant.userId) != -1);
                    });

                    // if we removed the logged in user, then we cut this conversation from our list
                    if (_.indexOf(data.participants, currUser._id) != -1)
                    {
                        service.model.conversations.remove(conversation);
                    }
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Update the given conversation
         *
         * @param conversation The conversation to update
         * @param update       The update to apply
         */
        function updateConversation(conversation, update)
        {
            var messages = conversation.messages;

            if (messages)
            {
                // append the new messages
                if (update.newMessages)
                {
                    processMessages(conversation, update.newMessages);
                }
            }

            if (update.lastUpdated)
            {
                update.lastUpdatedDate = new Date(update.lastUpdated);
            }

            angular.extend(conversation, update);

            // update participants
            return processParticipants(conversation);
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Process the participants for the given conversation
         *
         * @param  conversation The conversation to modify
         * @return {Promise}    A promise to track the progress
         */
        function processParticipants(conversation)
        {
            return $q(function(resolve, reject)
            {
                userService.loadUsers().then(function(users)
                {
                    if ( (conversation.owner) && (!conversation.owner.nickname) )
                    {
                        conversation.owner = _.findWhere(users, {_id: conversation.owner});
                    }

                    conversation.participants = _.filter(conversation.participants, function(participant)
                    {
                        if (!participant.user)
                        {
                            participant.user = _.findWhere(users, {_id: participant.userId});
                        }

                        return participant.user;
                    });

                    resolve(conversation);
                });
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Process the given list of messages within the given conversation
         * 
         * This method resolves attachments, associates user id's with actual user information, and consolidates
         * message blocks when a single user repeatedly posts messages.  It also tracks the time of the most
         * recent message in the conversation to allow future message loads to retrieve only the messages not
         * yet viewed by the current user.
         *
         * @param conversation The conversation to update
         * @param messages     The list of messages to process
         */
        function processMessages(conversation, messages)
        {
            var currUser = applicationService.model.currentUser;

            return $q(function(resolve, reject)
            {
                userService.loadUsers().then(function(users)
                {
                    var last = null;

                    if ( (conversation.messages) && (conversation.messages.length) )
                    {
                        last = conversation.messages[conversation.messages.length - 1];
                    }
                
                    messages = _.filter(messages, function(message)
                    {
                        // this wil track whether this message is appeneded as a new message or whether its
                        // text is simply added to the most recent message received
                        var needed = true;

                        // track the receive time of the message for future message loads
                        conversation.lastMessageTime = message.received;

                        // process attachments
                        if (message.attachments)
                        {
                            if (!message.attachments.length)
                            {
                                delete message.attachments;
                            }
                            else
                            {
                                // this allows the view to present the appropriate viewer for the
                                // given content type
                                _.each(message.attachments, function(attachment)
                                {
                                    if (attachment.contentType == "images")
                                    {
                                        message.attachedImage = attachment.url;
                                    }
                                    else if (attachment.contentType == "audio")
                                    {
                                        message.attachedAudio = attachment.url;
                                    }
                                });
                            }
                        }

                        // determine if this is a new block or if it can be added to the most recent
                        // block of messages (separate users get their own blocks and messages separated
                        // by more than 5 minutes get their own visual blocks)
                        message.from = _.findWhere(users, {_id: message.from});

                        if ( (last != null)                                   &&
                             (last.from     == message.from)                  &&
                             (last.mood     == message.mood)                  &&
                             (last.style    == message.style)                 &&
                             (message.received - last.received < (5 * 60000)) &&
                             (angular.equals(last.to, message.to))            &&
                             (!last.attachments)                              &&
                             (!message.attachments) )
                        {
                            needed = false;
                        }

                        // create a new message block if required
                        if (needed)
                        {
                            message.receivedDate = new Date(message.received);

                            if (message.from == currUser)
                            {
                                message.ours = true;
                            }

                            if (message.mood == "system")
                            {
                                message.text = "*** " + message.text + " ***";
                            }

                            if ( (message.to) && (message.to.length) )
                            {
                                message.text = "*whispering* " + message.text;
                            }

                            last = message;

                            return true;
                        }

                        // otherwise, simply append the text
                        last.text += '\n\n' + message.text;

                        return false;
                    });

                    conversation.messages.push.apply(conversation.messages, messages);

                    resolve(messages);
                });
            });
        }

        init();

        return service;
    }
]);
