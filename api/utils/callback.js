/**
 * **********************************************************************************************************
 * callback.js
 *
 * author: William Martino
 *
 * Utility functions for chaining function calls, managing errors, etc
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var _ = require('underscore');

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------------------------------
// exported api
// ----------------------------------------------------------------------------------------------------------

var api = {};

// ----------------------------------------------------------------------------------------------------------

/**
 * Call a list of functions in sequence
 *
 * Each function should expect to receive a single parameter that is forwarded from the previous function
 * call along with a next function parameter that can be supplied as a callback to mongoose queries, api
 * calls, etc.
 *
 * Alternatively, any of the functions can be an object with the following fields:
 *  func:    the function to invoke
 *  context: the expected "this" parameter
 *
 * @param functions The functions to invoke in order
 * @param callback  The final callback to invoke with success/error
 */
api.sequence = function(functions, callback)
{
    var nFunctions   = functions.length;
    var ii           = 0;
    var result       = null;
    var resultSticky = false;

    var doNext = function(err, data)
    {
        if (err)
        {
            callback(err);
        }
        else
        {
            if (!resultSticky)
            {
                result = data;
            }

            if (ii >= nFunctions)
            {
                callback(null, result);
            }
            else
            {
                var func         = functions[ii++];
                var context      = this;
                var localResult;

                if ( (func.context) && (func.func) )
                {
                    context = func.context;
                    func    = func.func;
                }

                localResult = func.call(context, data);

                if (localResult !== undefined)
                {
                    result       = localResult;
                    resultSticky = true;
                }
            }
        }
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Invoke one function if an error is received, another if not
 *
 * Error appears first in arguments in order to support chaining functions better
 *
 * @param  onError The function to invoke on error
 * @param  onSucces The function to invoke on success
 * @return A function to delegate to one of the above
 */
api.successOrError = function(onError, onSuccess)
{
    return function(err, data)
    {
        if (err)
        {
            onError(err);
        }
        else
        {
            onSuccess(data);
        }
    };
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Invoke one function if objects were received another if no data
 *
 * @param  ifFound    The function to invoke if data was found
 * @param  ifNotFound The function to invoke on data not found
 * @return A function to delegate to one of the above
 */
api.ifNotFound = function(ifFound, ifNotFound)
{
    return function(err, data)
    {
        if (err)
        {
            ifFound(err);
        }
        else
        {
            if (data)
            {
                if (data.length === undefined)
                {
                    ifFound(null, data);
                }
                else if (!data.length)
                {
                    ifNotFound();
                }
                else
                {
                    ifFound(null, data[0]);
                }
            }
        }
    };
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Invoke one function if objects were received another if no data
 *
 * Error appears first in arguments in order to support chaining functions better
 *
 * @param  desired  The number of results desired
 * @param  onError  The function to invoke on error
 * @param  onSucces The function to invoke on success
 * @return A function to delegate to one of the above
 */
api.validateCount = function(desired, onError, onSuccess)
{
    if (!_.isFunction(onSuccess))
    {
        onSuccess = onError;
    }

    return function(err, data)
    {
        if (err)
        {
            onError(err);
        }
        else
        {
            var received = 0;

            if (data)
            {
                if (data.length === undefined)
                {
                    received = 1;
                }
                else
                {
                    received = data.length;
                }
            }

            if (received == desired)
            {
                if (received == 1)
                {
                    if (onSuccess == onError)
                    {
                        onSuccess(null, data[0]);
                    }
                    else if (data.length !== undefined)
                    {
                        onSuccess(data[0]);
                    }
                    else
                    {
                        onSuccess(data);
                    }
                }
                else if (onSuccess == onError)
                {
                    onSuccess(null, data);
                }
                else
                {
                    onSuccess(data);
                }
            }
            else
            {
                onError("Expected " + desired + ", received " + received);
            }
        }
    };
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Forward data to the next callback on success or pass error to error callback on error
 *
 * @param  onError  The function to invoke on error
 * @param  onSucces The function to invoke on success
 * @param  data     The data to forward
 * @return A function to delegate to one of the above
 */
api.forward = function(onError, onSuccess, data)
{
    if (!data)
    {
        if (!_.isFunction(onSuccess))
        {
            data      = onSuccess;
            onSuccess = onError;
        }
    }

    return function(err)
    {
        if (err)
        {
            onError(err);
        }
        else if (onSuccess == onError)
        {
            onSuccess(null, data);
        }
        else
        {
            onSuccess(data);
        }
    }
}

// ----------------------------------------------------------------------------------------------------------

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end collection.js
// ----------------------------------------------------------------------------------------------------------
