/**
 * **********************************************************************************************************
 * models/conversation.js
 *
 * author: William Martino
 *
 * Mongoose binding for conversations between users
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

var Conversation = new mongoose.Schema(
{
    /**
     * Creator of the conversation
     */
    owner:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },

    /**
     * Title for the conversation
     */
    title:         String,

    /**
     * When the conversation started
     */
    started:       Number,

    /**
     * When the conversation was last updated
     */
    lastUpdated:   Number,

    /**
     * Whether or not the conversation has been archived
     */
    archived:      { type: Number, default: 0},

    /**
     * Number of messages in the conversation
     */
    messageCount: Number,

    /**
     * The participants in the conversation
     */
    participants:
    [
        {
            userId:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'users'
            },
            lastRead: Number
        }
    ],

    /**
     * Messages are in the chat-message model foreign keyed by conversation._id
     */

});

module.exports = mongoose.model('conversations', Conversation);

// ----------------------------------------------------------------------------------------------------------
// end models/conversation.js
// ----------------------------------------------------------------------------------------------------------
