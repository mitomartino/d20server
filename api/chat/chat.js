/**
 * **********************************************************************************************************
 * chat.js
 *
 * author: William Martino
 *
 * Chat api
 *
 * Provides methods for creating/updating/archiving conversations, managing participants, etc
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var Conversation = require("../../models/conversation");
var ChatMessage  = require("../../models/chat-message");
var _            = require('underscore');
var socketIo     = require("../socket/socket");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// private functions
// ----------------------------------------------------------------------------------------------------------

/**
 * Save the given conversation and forward it to the given callback while adding the given message
 *
 * @param conversation  The conversation to save and forward
 * @param message       The message to add
 * @param clientUpdates List of client updates to make on success
 * @param callback      The callback to forward success/error to
 */
function forwardWithMessage(conversation, message, clientUpdates, callback)
{
    conversation.lastUpdated = new Date().getTime();

    conversation.save(function(err, saved)
    {
        message.conversation = saved._id;

        if (err)
        {
            callback(err);
        }
        else
        {
            message.received = new Date().getTime();

            message.save(function(err)
            {
                if (err)
                {
                    callback(err);
                }
                else
                {
                    Conversation.findByIdAndUpdate(saved._id, {$inc: {messageCount: 1}}, function(err, saved)
                    {
                        if (err)
                        {
                            callback(err);
                        }
                        else
                        {
                            saved._doc.newMessages = [message];

                            _.each(clientUpdates, function(update)
                            {
                                // replace conversation object with updated one
                                if (update.data.conversation)
                                {
                                    update.data.conversation = saved;
                                }

                                socketIo.emitAll(update.type, null, update.data);
                            });

                            socketIo.emitAll("chat.message", chatRoom(conversation._id), saved);

                            callback(null, saved);
                        }
                    });
                }
            });
        }
    });
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Get the name of the socket room for the given chat conversation
 *
 * @param   id       The conversation id
 * @returns {string} The name of the socket.io room for the conversation
 */
function chatRoom(id)
{
    return "chat." + id;
}

// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api =
{
    /**
     * Initialize the chat API
     */
    init: function()
    {
        socketIo.addRoomManager("chat", function(socket, context, room, callback)
        {
            if (context == "chat")
            {
                var user = socketIo.getUser(socket);

                if (user)
                {
                    api.conversations.isParticipant(room, user._id, callback);

                    socket.on("chat.typingStatus", function(data)
                    {
                        data.userId = user._id;

                        socketIo.emitOthers(user, "chat.typingStatus", chatRoom(data.conversation), data);
                    });
                }
            }
        });

    },

    // --------------------------------------------------------------------------------------------------

    /**
     * Participant-level methods
     */
    participants:
    {
        /**
         * Remove the given user as a participant from all conversations
         *
         * @param user     The user object
         * @param callback The callback to invoke with success or failure
         */
        removeFromAllConversations: function(user, callback)
        {
            var searchFor =
            {
                "participants.userId": user._id,
            };

            var pull =
            {
                $pull:
                {
                    participants:
                    {
                        userId: user._id
                    }
                }
            };

            Conversation.find(searchFor, function(err, conversations)
            {
                if (err)
                {
                    callback(err);
                }
                else if (!conversations.length)
                {
                    callback('Conversation or participant not found');
                }
                else
                {
                    var nConversations = conversations.length;
                    var ii             = 0;

                    function nextConversation(err, data)
                    {
                        if (ii >= nConversations)
                        {
                            callback(null, data);
                            return;
                        }

                        var conversation = conversations[ii++];

                        conversation.update(pull, function(err)
                        {
                            if (err)
                            {
                                callback(err);
                            }
                            else
                            {
                                var updates =
                                [{
                                    type: "chat.removedParticipants",
                                    data: {conversation: conversation, participants: [user._id]}
                                }];

                                var message = new ChatMessage(
                                {
                                    mood: 'system',
                                    text: user.nickname + ' left the conversation',
                                    to:   undefined
                                });

                                forwardWithMessage(conversation, message, updates, nextConversation);
                            }
                        });
                    }

                    nextConversation();
                }
            });
        }
    },

    // --------------------------------------------------------------------------------------------------

    /**
     * Conversation-level methods
     */
    conversations:
    {
        /**
         * List all conversations
         *
         * @param callback The callback to receive the list of conversations
         */
        listAll: function(callback)
        {
            Conversation.find({archived: 0}, callback);
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * List all conversations in which the given user participates
         *
         * @param userId   The id of the user to list conversations for
         * @param callback The callback to receive the list of conversations
         */
        listParticipating: function(userId, callback)
        {
            Conversation.find({'participants.userId': userId, archived: 0}, callback);
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Create a new conversation
         *
         * @param title        The title for the conversation
         * @param user         The user starting the conversation
         * @param participants An optional list of user ids to add as additional participants
         * @param callback To receive success/error
         */
        create: function(title, user, participants, callback)
        {
            var conversation = new Conversation();
            var now          = new Date().getTime();

            if ( (participants) && (!_.isArray(participants)) )
            {
                participants = [participants];
            }

            if (participants)
            {
                participants = _.without(participants, user._id);
            }

            var message = new ChatMessage(
            {
                mood:         'system',
                text:         user.nickname + ' got the conversation started',
                to:           undefined
            });

            conversation.title   = title;
            conversation.owner   = user._id;
            conversation.started = now;
            conversation.participants.push({userId: user._id});

            _.each(participants, function(participant)
            {
                conversation.participants.push({userId: participant});
            });

            var updates =
            [{
                type: "chat.addedParticipants",
                data: {conversation: conversation, by: user, participants: _.pluck(conversation.participants, "userId")}
            }];

            forwardWithMessage(conversation, message, updates, callback);
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Determine if a given user id participates in the given conversation
         *
         * @param conversationId id of the conversation to test
         * @param userId         id of the user to search for
         * @param callback       function to call with success or failure
         */
        isParticipant: function(conversationId, userId, callback)
        {
            var searchFor =
            {
                _id:                   conversationId,
                "participants.userId": userId
            };

            Conversation.find(searchFor, function(err, conversations)
            {
                if (err)
                {
                    callback(err);
                }
                else if ( (!conversations) || (conversations.length == 0) )
                {
                    callback('User is not a part of this conversation');
                }
                else
                {
                    callback(null, conversations);
                }
            });
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Invite a new participant to the given conversation
         *
         * @param id           The id of the conversation to modify
         * @param user         The user adding participants
         * @param participant  The user to add as a participant
         * @param callback     The callback to receive the modified conversation
         */
        addParticipant: function(id, user, participant, callback)
        {
            var searchFor =
            {
                _id:                   id,
                'participants.userId': user._id
            };

            Conversation.find(searchFor, function(err, conversations)
            {
                if (err)
                {
                    callback(err);
                }
                else if (!conversations.length)
                {
                    callback('Conversation not found or user is not a participant');
                }
                else
                {
                    var conversation = conversations[0];

                    conversation.participants.push({userId: participant._id});

                    var updates =
                    [{
                        type: "chat.addedParticipants",
                        data: {conversation: conversation, by: user, participants: [participant._id]}
                    }];

                    var message = new ChatMessage(
                    {
                        mood:         'system',
                        text:         participant.nickname + ' was added to the conversation',
                        to:           undefined
                    });

                    forwardWithMessage(conversation, message, updates, callback);
                }
            });
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Remove a participant from the given collection
         *
         * @param id           The id of the conversation to modify
         * @param user         The user removing participants
         * @param participant  The user to remove as a participant
         * @param callback     The callback to receive the modified conversation
         */
        removeParticipant: function(id, user, participant, callback)
        {
            var searchFor =
            {
                _id:                   id,
                "participants.userId": user._id,
                "participants.userId": participant._id
            };

            var pull =
            {
                $pull:
                {
                    participants:
                    {
                        userId: participant._id
                    }
                }
            };

            Conversation.find(searchFor, function(err, conversations)
            {
                if (err)
                {
                    callback(err);
                }
                else if (!conversations.length)
                {
                    callback('Conversation or participant not found');
                }
                else
                {
                    var conversation = conversations[0];

                    conversation.update(pull, function(err)
                    {
                        if (err)
                        {
                            callback(err);
                        }
                        else
                        {
                            conversation._doc.removedParticipants = [participant._id];

                            var updates =
                            [{
                                type: "chat.removedParticipants",
                                data: {conversation: conversation, by: user, participants: [participant._id]}
                            }];

                            var message = new ChatMessage(
                                {
                                    mood: 'system',
                                    text: participant.nickname + ' left the conversation',
                                    to:   undefined
                                });

                            forwardWithMessage(conversation, message, updates, callback);
                        }
                    });
                }
            });
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Archive the given conversation
         *
         * @param id       The conversation's id
         * @param user     The archiving the conversation
         * @param callback To receive success/error
         */
        archive: function(id, user, callback)
        {
            Conversation.findById(id, function(err, conversation)
            {
                if (err)
                {
                    callback(err);
                }
                else if (!conversation)
                {
                    callback('Conversation not found');
                }
                else if (conversation.archived == 1)
                {
                    callback(null, conversation);
                }
                else if ( (!user.isAdmin) && (conversation.owner != user._id) )
                {
                    callback('You are not the owner of this conversation');
                }
                else
                {
                    var updates =
                    [{
                        type: "chat.conversationChanged",
                        data: { conversation: conversation }
                    }];

                    conversation.archived = 1;

                    var message = new ChatMessage(
                    {
                        mood:         'system',
                        text:         user.nickname + ' closed the conversation',
                        to:           undefined
                    });

                    forwardWithMessage(conversation, message, updates, callback);
                }
            });
        }
    },

    // ------------------------------------------------------------------------------------------------------

    /**
     * Message-level methods
     */
    messages:
    {
        /**
         * Fetch all messages from the given conversation
         *
         * @param user         The user querying for messages
         * @param conversation id of the conversation to fetch messages from
         * @param callback     callback to receive data/errors
         */
        all: function(user, conversation, callback)
        {
            var searchFor =
            {
                conversation: conversation,
                $or:
                [
                    {
                        to: { $exists: false }
                    },
                    {
                        to: { $size: 0 }
                    },
                    {
                        from: user._id
                    },
                    {
                        to: user._id
                    }
                ]
            };

            ChatMessage.find(searchFor, callback);
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Find all messages received after a certain timestamp
         *
         * @param user         The user querying for messages
         * @param conversation The conversation to query
         * @param ts           The timestamp
         * @param callback     Callback to receive data/error
         */
        since: function(user, conversation, ts, callback)
        {
            var searchFor =
            {
                conversation: conversation,
                received:
                {
                    $gt: ts
                },
                $or:
                [
                    {
                        to: { $exists: false }
                    },
                    {
                        to: { $size: 0 }
                    },
                    {
                        from: user._id
                    },
                    {
                        to: user._id
                    }
                ]
            };

            ChatMessage.find(searchFor, callback);
        },

        // --------------------------------------------------------------------------------------------------

        /**
         * Post a new message to the given conversation
         *
         * @param id           The id of the conversation to post to
         * @param user         The user posting the message
         * @param text         The message text
         * @param mood         The mood string
         * @param style        The style string (font-size, color, bg-color, etc)
         * @param recipients   The recipients or all if null/undefined
         * @param attachments  The attachments to add to the message
         * @param callback     The callback to receive the update conversation
         */
        post: function(id, user, text, mood, style, recipients, attachments, callback)
        {
            var searchFor =
            {
                _id:                   id,
                "participants.userId": user._id
            };

            Conversation.find(searchFor, function(err, conversations)
            {
                if (err)
                {
                    callback(err);
                }
                else if (!conversations.length)
                {
                    callback('Conversation not found or user is not a participant');
                }
                else
                {
                    var opts =
                    {
                        from:        user._id,
                        text:        text,
                        mood:        mood,
                        style:       style,
                        to:          recipients,
                        attachments: attachments
                    };

                    var message = new ChatMessage(opts);

                    forwardWithMessage(conversations[0], message, null, callback);
                }
            });
        }
    }
};

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end chat.js
// ----------------------------------------------------------------------------------------------------------
