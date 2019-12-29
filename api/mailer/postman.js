/**
 * **********************************************************************************************************
 * postman.js
 *
 * author: William Martino
 *
 * api for sending emails
 *
 * This file exports a singleton postman object, which provides a layer
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var Mailer = require("./mailer");
var _      = require("underscore");

// ----------------------------------------------------------------------------------------------------------
// class definition
// ----------------------------------------------------------------------------------------------------------

/**
 * Postman
 *
 * Object which authenticates against a gmail account and can send notification emails to users
 */
function Postman()
{
    var self = this;

    self.queue  = [];
    self.mailer = new Mailer();

    self.mailer.initialize();

    // create a worker to actually send mail
    self.mailer.whenReady(function(err)
    {
        if (err)
        {
            self.error = err;
            self.queue = [];

            return;
        }

        _.each(self.queue, function(mail)
        {
            self.send(mail);
        });

        self.queue = [];

        self.ready = true;
    });
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Send an email
 *
 * @param opts     The send options
 * @param callback The callback to invoke with success/error
 */
Postman.prototype.send = function(opts)
{
    if (this.ready)
    {
        this.mailer.send(opts);
    }
    else if (this.error)
    {
        return this.error;
    }
    else
    {
        this.queue.push(opts);
    }
}

// ----------------------------------------------------------------------------------------------------------

module.exports = new Postman();

// ----------------------------------------------------------------------------------------------------------
// end postman.js
// ----------------------------------------------------------------------------------------------------------
