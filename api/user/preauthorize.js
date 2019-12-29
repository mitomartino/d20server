/**
 * **********************************************************************************************************
 * api/user/preauthorize.js
 *
 * author: William Martino
 *
 * Middleware that enforces authorization
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var express          = require('express');
var auth             = require('./auth');

// ----------------------------------------------------------------------------------------------------------
// api definition
// ----------------------------------------------------------------------------------------------------------

/**
 * Middleware
 *
 * @param entitlement The entitlement to authorize
 * @param target The target to authorize
 */
module.exports = function(entitlement, target)
{
    return function(req, res, next)
    {
        var ent = entitlement;
        var tgt = target;
        
        if (ent.indexOf('req.') != -1)
        {
            var parts = ent.split('.');

            if (parts.length)
            {
                var obj = req;

                if (parts[0] == 'req')
                {
                    parts.shift(1);
                }

                for (var ii in parts)
                {
                    if (obj)
                    {
                        obj = obj[parts[ii]];
                    }
                }

                ent = obj;
            }
            else
            {
                ent = null;
            }
        }

        if ( (tgt) && (tgt.indexOf('req.') != -1) )
        {
            var parts = tgt.split('.');

            if (parts.length)
            {
                var obj = req;

                if (parts[0] == 'req')
                {
                    parts.shift(1);
                }

                for (var ii in parts)
                {
                    if (obj)
                    {
                        obj = obj[parts[ii]];
                    }
                }

                tgt = obj;
            }
            else
            {
                tgt = null;
            }
        }

        if ( (!ent) || (ent == req) )
        {
            ent = null;
        }
        
        if ( (!tgt) || (tgt == req) )
        {
            tgt = null;
        }

        auth.authorize(req, ent, tgt, function(error, permission)
        {
            if (error)
            {
                res.error(401, 'You do not have the necessary privileges for this action');
            }
            else
            {
                next();
            }
        });
    }
};

// ----------------------------------------------------------------------------------------------------------
// end services/upload.js
// ----------------------------------------------------------------------------------------------------------
