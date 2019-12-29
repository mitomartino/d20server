/**
 * **********************************************************************************************************
 * json-response.js
 *
 * author: William Martino
 *
 * Utility object that generates a json response
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// class definition
// ----------------------------------------------------------------------------------------------------------

/**
 * JsonResponse - common response object
 *
 * @param status  Numerical status 200 for success, etc
 * @param message Message to display
 * @param details Details object (situational)
 *
 * @constructor
 */
function JsonResponse(status, message, details)
{
    this.status  = status;
    this.message = message;
    this.details = details;
};

// ----------------------------------------------------------------------------------------------------------

/**
 * Create a JsonResponse to indicate success
 *
 * @param message (optional) message to display
 *
 * @returns {JsonResponse}
 */
JsonResponse.prototype.success = function(message, details)
{
    if ( (message) && (!details) )
    {
        details = message;
        message = 'success';
    }

    return new JsonResponse(
        200,
        message || 'success',
        details || {}
    );
};

// ----------------------------------------------------------------------------------------------------------

/**
 * Create a JsonResponse to indicate error
 *
 * @param status  (optional) status (defaults to 400)
 * @param message (optional) message to display
 *
 * @returns {JsonResponse}
 */
JsonResponse.prototype.error = function(status, message)
{
    if ( (status) && (!message) )
    {
        message = status;
        status  = 400;
    }

    return new JsonResponse(
        status  || 400,
        message || 'An error occurred',
        {}
    );
};

// ----------------------------------------------------------------------------------------------------------

/**
 * Create a JsonResponse to indicate that the user must login to proceed
 *
 * @returns {JsonResponse}
 */
JsonResponse.prototype.loginRequired = function()
{
    return new JsonResponse(
        401,
        'You need to log in before you can perform this action',
        {
            loggedIn: false
        }
    );
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Create a JsonResponse to indicate that the user is not authorized to perform the
 * given action.
 *
 * @param action The action description string
 * @param object The object that the action is being performed upon
 *
 * @returns {JsonResponse}
 */
JsonResponse.prototype.unauthorized = function(action, object)
{
    return new JsonResponse(
        401,
        'You are not authorized to perform this action',
        {
            action: action,
            object: object
        }
    );
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Submit the json response for the given request/response
 *
 * @param req The request object
 * @param res The response object
 */
JsonResponse.prototype.submit = function(req, res)
{
    // http status is always 200; we encapsulate our own status into the response object
    res.status(200);

    if ( (this.details) && (this.details.password) )
    {
        delete this.details.password;
    }

    if ( (this.details) && (this.details._doc) && (this.details._doc.password) )
    {
        delete this.details._doc.password;
    }

    res.send({
        status:  this.status,
        message: this.message,
        details: this.details
    });
}

// ----------------------------------------------------------------------------------------------------------

module.exports = JsonResponse;

// ----------------------------------------------------------------------------------------------------------
// end json-response.js
// ----------------------------------------------------------------------------------------------------------
