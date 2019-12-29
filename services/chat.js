/**
 * **********************************************************************************************************
 * services/lookup.js
 *
 * author: William Martino
 *
 * Backend services for the node.js app
 *
 * Implements the services that serve lookup table data
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express          = require('express');
var chat             = require('../api/chat/chat');
var preauthorize     = require('../api/user/preauthorize');
var User             = require('../models/user');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var router  = express.Router();

chat.init();

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: all
 *
 * Get all of the existing conversations
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  conversations
 */
router.get('/conversations/all', function(req, res, next)
{
    chat.conversations.listAll(res.chain());
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: participating
 *
 * Get all of the existing conversations in which the logged in user participates
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  conversations
 */
router.get('/conversations/participating', function(req, res, next)
{
    chat.conversations.listParticipating(req.session.user._id, res.chain());
});

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: :userId/participating
 *
 * Get all of the existing conversations in which the given user participates
 *
 * path params:
 *  userId the user to fetch conversations for
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the list of available
 *  conversations
 */
router.get('/conversations/:userId/participating',
    preauthorize('manage users', 'req.params.userId'),
    function(req, res, next)
    {
        chat.conversations.listParticipating(req.params.userId, res.chain());
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: create
 *
 * Create a new conversation with the given title
 *
 * post params:
 *  title: title of the new conversation
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the new conversation
 */
router.post('/conversations/create',
    function(req, res, next)
    {
        var title = 'Conversation';

        if ( (req.body.title) && (req.body.title.length) )
        {
            title = req.body.title;
        }

        chat.conversations.create(title, req.session.user, req.body.participants, res.chain());
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: participants/remove
 *
 * Remove a participant from the given conversation
 *
 * path params:
 *  conversationId - the conversation to modify
 *
 * post params:
 *  userId: user id of the participant to remove
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the updated conversation
 */
router.post('/:conversationId/participants/remove',
    function(req, res, next)
    {
        if ( (!req.body.userId) || (!req.body.userId.length) )
        {
            res.error('No participant id provided');
        }
        else
        {
            User.findById(req.body.userId, res.chain(function(participant)
            {
                chat.conversations.removeParticipant(
                    req.params.conversationId,
                    req.session.user,
                    participant,
                    res.chain());
            }));
        }
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: participants/add
 *
 * Add a participant to the given conversation
 *
 * path params:
 *  conversationId - the conversation to modify
 *
 * post params:
 *  userId: user id of the new participant
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the updated conversation
 */
router.post('/:conversationId/participants/add',
    function(req, res, next)
    {
        if ( (!req.body.userId) || (!req.body.userId.length) )
        {
            res.error('No participant id provided');
        }
        else
        {
            User.findById(req.body.userId, res.chain(function(participant)
            {
                chat.conversations.addParticipant(
                    req.params.conversationId,
                    req.session.user,
                    participant,
                    res.chain());
            }));
        }
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: archive
 *
 * Archive the given conversation
 *
 * path params:
 *  conversationId - the conversation to archive
 *
 * output:
 *  a standard response containing success/failure and the updated conversation
 */
router.get('/:conversationId/archive',
    function(req, res, next)
    {
        chat.conversations.archive(req.params.conversationId, req.session.user, res.chain());
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: messages/all
 *
 * Load all messages for the given conversation
 *
 * path params:
 *  conversationId - the conversation to load messages for
 *
 * output:
 *  a standard response containing success/failure and the list of messages if any
 */
router.get('/:conversationId/messages/all',
    function(req, res, next)
    {
        chat.conversations.isParticipant(req.params.conversationId, req.session.user._id, res.chain(
            function(conversation)
            {
                chat.messages.all(req.session.user, req.params.conversationId, res.chain());
            })
        );
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: messages/since/:timestamp
 *
 * Load all messages for the given conversation
 *
 * path params:
 *  conversationId - the conversation to load messages for
 *  timestamp      - epoch time to fetch messages after
 *
 * output:
 *  a standard response containing success/failure and the list of messages if any
 */
router.get('/:conversationId/messages/since/:timestamp',
    function(req, res, next)
    {
        var ts = parseInt(req.params.timestamp);

        if (isNaN(ts))
        {
            res.error('Bad timestampt: ' + req.params.timestamp);
        }
        else
        {
            chat.conversations.isParticipant(req.params.conversationId, req.session.user._id, res.chain(
                function(conversation)
                {
                    chat.messages.since(req.session.user, req.params.conversationId, ts, res.chain());
                })
            );
        }
    }
);

// ----------------------------------------------------------------------------------------------------------

/**
 * Service: messages/add
 *
 * Post a message to the given conversation
 *
 * path params:
 *  conversationId - the conversation to modify
 *
 * post params:
 *  text       - text for the message
 *  mood       - optional mood string for the message
 *  style      - css style options string
 *  recipients - a list of recipients or all table participants if not present
 *
 * output:
 *  standard Response wrapper indicating success or failure with details containing the updated conversation
 */
router.post('/:conversationId/messages/add',
    function(req, res, next)
    {
        var body = req.body;

        if ( (!req.body.text) || (!req.body.text.length) )
        {
            res.error('No text was provided');
        }
        else
        {
            chat.messages.post(
                req.params.conversationId,
                req.session.user,
                body.text,
                body.mood,
                body.style,
                body.recipients,
                body.attachments,
                res.chain());
        }
    }
);

// ----------------------------------------------------------------------------------------------------------

module.exports = router;

// ----------------------------------------------------------------------------------------------------------
// end services/chat.js
// ----------------------------------------------------------------------------------------------------------
