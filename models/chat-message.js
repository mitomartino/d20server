/**
 * **********************************************************************************************************
 * models/chat-message.js
 *
 * author: William Martino
 *
 * Mongoose binding for messages associated with a conversation
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var mongoose = require("mongoose");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

/**
 * One message
 */
var ChatMessage = new mongoose.Schema(
{
    /**
     * The conversation that this message belongs to
     */
    conversation:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'conversations'
    },

    /**
     * Message text
     */
    text:  String,

    /**
     * Font-size/color/bg-color/etc
     */
    style: String,

    /**
     * Mood for morphing the avatar
     */
    mood:  String,

    /**
     * Date received (defaults to when the message is created)
     */
    received: Number,

    /**
     * User/table/character sending the message
     */
    from: mongoose.Schema.Types.ObjectId,

    /**
     * Optional list of recipients (for whispering to one party in a conversation)
     */
    to:
    [
        mongoose.Schema.Types.ObjectId
    ],

    /**
     * Optional list of files to attach to the message
     */
    attachments:
    [
        {
            url:         String,
            contentType: String
        }
    ]
});

/**
 * We are going to do a lot of searching by conversation and then by time
 */
ChatMessage.index(
{
    conversation: 1,
    received:     1
});

module.exports = mongoose.model('chat_messages', ChatMessage);

// ----------------------------------------------------------------------------------------------------------
// end models/message-log.js
// ----------------------------------------------------------------------------------------------------------
