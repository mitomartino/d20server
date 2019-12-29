/**
 * **********************************************************************************************************
 * mailer.js
 *
 * author: William Martino
 *
 * api for sending emails
 *
 * This file exports a singleton mailer object, which loads config from the static config/mail.js or from the
 * system settings table.
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var util           = require("util");
var nodemailer     = require("nodemailer");
var templates      = require("email-templates");
var EmailTemplate  = templates.EmailTemplate;
var xoauth2        = require("xoauth2");
var mailConfig     = require("../../config/mail");
var SystemSettings = require("../../models/system-settings");
var _              = require("underscore");
var path           = require("path");

// ----------------------------------------------------------------------------------------------------------
// class definition
// ----------------------------------------------------------------------------------------------------------

/**
 * Mailer
 *
 * Object which authenticates against a gmail account and can send notification emails to users
 */
function Mailer()
{
    this.from          = null;
    this.transport     = null;
    this.generator     = null;
    this.templates     = {};
    this.initCallbacks = [];
    this.templateDir   = path.join(__dirname, "../../private/mail/templates");

    this.bannerAttachment =
    {
        cid:      "banner@mail.d20server",
        filename: "banner.png",
        path:     path.join(__dirname, "../../public/images/mailer/banner.png"),
    };
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Initialize the mailer
 *
 * Fetch configuration, init authorization, etc
 */
Mailer.prototype.initialize = function()
{
    var self = this;

    self.initializing = true;

    SystemSettings.find({}, function(err, rows)
    {
        // create the xoauth2 token generator for authorization

        // default options to the static config
        var opts = util._extend({}, mailConfig.authData);

        // overwrite with database-stored settings if present
        if ( (!err) && (rows.length) && (rows[0].mailer) )
        {
            opts.user         = rows[0].mailer.user         || opts.user;
            opts.clientId     = rows[0].mailer.clientId     || opts.clientId;
            opts.clientSecret = rows[0].mailer.clientSecret || opts.clientSecret;
            opts.refreshToken = rows[0].mailer.refreshToken || opts.refreshToken;
            opts.accessToken  = rows[0].mailer.accessToken  || opts.accessToken;
            opts.displayName  = rows[0].mailer.displayName  || opts.displayName;

            self.baseUrl = rows[0].server.url;
        }

        self.from = opts.user;

        if (opts.displayName)
        {
            self.from = "\"" + opts.displayName + "\" <" + self.from + ">";
        }

        // ensure that the database settings exist
        if (rows.length)
        {
            rows[0].mailer = opts;
            rows[0].save(function(err, settings)
            {
            });
        }

        self.generator = xoauth2.createXOAuth2Generator(opts);

        // store the access token whenever it is retrieved
        self.generator.on("token", function(token)
        {
            var update =
            {
                mailer:
                {
                    accessToken: token.accessToken
                }
            };

            SystemSettings.find({}).update(update, function(err, settings)
            {

            });
        });

        // create the transport for sending emails
        self.transport = nodemailer.createTransport(
        {
            service: 'gmail',
            auth:
            {
                xoauth2: self.generator
            }
        });

        self.initializing = false;

        _.each(self.initCallbacks, function(callback)
        {
            callback();
        });
    });
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Verify that the mailer is ready
 *
 * @param callback The callback to invoke on error or success
 */
Mailer.prototype.whenReady = function(callback)
{
    var self = this;
    
    if (self.transport)
    {
        self.transport.verify(callback);
    }
    else if (self.initializing)
    {
        self.initCallbacks.push(function()
        {
            self.whenReady(callback);
        });
    }
    else
    {
        callback("Failed to create a transport for mail");
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Send a test email
 *
 * @param to       Recipient for the test email
 * @param callback The callback to invoke with success/error
 */
Mailer.prototype.test = function(to, callback)
{
    var opts =
    {
        from:     this.from,
        to:       to,
        subject:  "Permission granted",
        template: "permission_granted",
        context:
        {
            user_nickname:      "Big Chief",
            permission_short:   "the ability to manage files",
            link_back:          path.join(this.baseUrl, "login"),
            permission_details: "You can now upload files to your personal file space to use as avatars, attachments, or assets " +
                                "for your personal adventures."
        }
    };

    this.send(opts, callback);
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Send an email
 *
 * @param opts     The send options
 * @param callback The callback to invoke with success/error
 */
Mailer.prototype.send = function(opts, callback)
{
    var sender = this.transport.sendMail;
    var self   = this;

    if (!opts.from)
    {
        opts.from = this.from;
    }

    if ( (opts.template) && (opts.context) )
    {
        var template = self.templates[opts.template];

        if (!template)
        {
            template = new EmailTemplate(path.join(self.templateDir, opts.template));
            self.templates[opts.template] = template;
        }

        if (!opts.attachments)
        {
            opts.attachments = [];
        }

        opts.attachments.push(self.bannerAttachment);

        sender = self.transport.templateSender(template, {from: self.from});

        sender(opts, opts.context, callback);
    }
    else
    {
        sender(opts, callback);
    }
}

// ----------------------------------------------------------------------------------------------------------

module.exports = Mailer;

// ----------------------------------------------------------------------------------------------------------
// end mailer.js
// ----------------------------------------------------------------------------------------------------------
