/**
 * **********************************************************************************************************
 * socket.js
 *
 * author: William Martino
 *
 * socket.io connection and utilities
 *
 * Exports: The socket connection api
 *
 * **********************************************************************************************************
 */

// ----------------------------------------------------------------------------------------------------------
// dependencies
// ----------------------------------------------------------------------------------------------------------

var _    = require("underscore");

// ----------------------------------------------------------------------------------------------------------
// main script
// ----------------------------------------------------------------------------------------------------------

var api =
{
    _io:                 null,
    _connections:        {},
    _connectionHandlers: [],
    _roomHandlers:       {}
};

// ----------------------------------------------------------------------------------------------------------

/**
 * Initialize socket handling for this server instance
 */
api.init = function(io, auth)
{
    api._io   = io;
    api._auth = auth;

    io.on("connection", function(socket)
    {
        var user = api.getUser(socket);

        if (user)
        {
            // notify other users that this user is online
            socket.broadcast.emit("user.online", user);

            // manage user-socket lookups
            api._connections[user._id] = socket;

            _.each(api._connectionHandlers, function(hook)
            {
                hook(socket);
            });

            socket.on("disconnect", function(data)
            {
                delete api._connections[user._id];
                socket.disconnect(true);

                // notify other users that this user is no longer
                api.emitAll("user.offline", null, user);
            });

            // handle entering rooms
            socket.on("room:join", function(room)
            {
                api.joinRoom(socket, room);
            });

            // handle exiting rooms
            socket.on("room:leave", function(room)
            {
                api.leaveRoom(room);
            });

            // inform the user that we are ready to go
            socket.emit("ready");

            var usersOnline = [];

            // inform the new user which other users are online
            for (var userId in api._connections)
            {
                usersOnline.push(userId);
            }

            socket.emit("user.online", usersOnline);
        }
    });
};

// ----------------------------------------------------------------------------------------------------------

/**
 * Get the user object for the given connection
 *
 * @param  socket The socket to find the user for
 * @return {User} The user object
 */
api.getUser = function(socket)
{
    var session = socket.handshake.session;

    if (session)
    {
        return session.user;
    }

    return null;
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Add a handler for the given event
 *
 * @param event   The event to handle
 * @param handler The handler
 */
api.on = function(event, handler)
{
    api._io.on(event, handler);
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Add a socket connection handler to this server instance
 *
 * The connection handler will be invoked on connect with the socket as a parameter
 */
api.addConnectionHandler = function(callback)
{
    api._connectionHandlers.push(callback);
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Add a room manager for rooms in a given context
 *
 * The room manager will be invoked whenever a client attempts to join a room in the given context.  It should
 * have the following signature:
 *      function(socket, context, room, callback)
 *
 * The handler should determine if the given socket can join the given room and invoke the callback function
 * with a falsey value if so.  If not, the callback should be invoked with an error string/object.
 *
 * @param context The room context to manage
 * @param handler The handler to invoke
 */
api.addRoomManager = function(context, handler)
{
    if (!api._roomHandlers[context])
    {
        api._roomHandlers[context] = [];
    }

    api._roomHandlers[context].push(handler);
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Initialize the given request
 *
 * Sets the global io object and the request-specific socket as ioGlobal and ioSocket
 *
 * @param req The request to modify
 */
api.initRequest = function(req)
{
    if ( (req.session) && (req.session.user) )
    {
        req.ioGlobal = api._io;
        req.ioSocket = api._connections[req.session.user._id];
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Emit an event to all connected users
 *
 * @param name The event name
 * @param data The data
 */
api.emitAll = function(name, room, data)
{
    if (room)
    {
        api._io.to(api.objectToRoom(room)).emit(name, data);
    }
    else
    {
        api._io.emit(name, data);
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Emit an event to all connected, authorized users
 *
 * @param name        The event name
 * @param entitlement The entitlement to authorize against
 * @param object      The optional object to authorize on
 * @param room        The optional room to emit to
 * @param data        The data
 */
api.emitAuthorized = function(name, entitlement, object, room, data)
{
    api._auth.listAuthorizedUsers(entitlement, object, function(err, users)
    {
        if (room)
        {
            var roomName = objectToRoom(room);

            _.each(users, function(userId)
            {
                var sock = api._connections[userId];

                if (sock)
                {
                    sock.to(roomName).emit(name, data);
                }
            });
        }
        else
        {
            _.each(users, function(userId)
            {
                var sock = api._connections[userId];

                if (sock)
                {
                    sock.emit(name, data);
                }
            });
        }
    });
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Convert a room name into a context + room name object
 *
 * Room names are of the form <context>.<room>
 *
 * @param room The room
 */
api.roomToObject = function(room)
{
    var context;

    if (_.isString(room))
    {
        var dotIndex = room.indexOf(".");

        if (dotIndex == -1)
        {
            context  = "global";
            roomName = room;
        }
        else
        {
            context  = room.substr(0, dotIndex);
            roomName = room.substr(dotIndex + 1);
        }

        roomObj =
        {
            context: context,
            room:    roomName
        }
    }
    else
    {
        roomObj = room;
    }

    return roomObj;
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Convert a room's context plus name object to a room name
 *
 * @param  roomObj  context object
 * @return {String} the room name
 */
api.objectToRoom = function(roomObj)
{
    var context = roomObj.context;

    if (!context)
    {
        context = "global";
    }

    var room = roomObj.room;

    if ( (!room) && (_.isString(roomObj)) )
    {
        var dotIndex = roomObj.indexOf(".");

        if (dotIndex != -1)
        {
            return roomObj;
        }
        else
        {
            room = roomObj;
        }
    }

    return context + "." + room;
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Attempt to join a given room
 *
 * Invoke all handlers for the context that the room belongs to in order to determine if the socket is
 * authorized for the given room.
 *
 * @param socket The socket attempting to join a room
 * @param room   The room that the socket is joining ( should
 */
api.joinRoom = function(socket, room)
{
    var allow     = true;
    var obj       = api.roomToObject(room);
    var handlers  = api._roomHandlers[obj.context];
    var ii        = 0;
    var nHandlers = handlers ? handlers.length : 0;

    var processNext = function(err)
    {
        if (!err)
        {
            if (ii >= nHandlers)
            {
                var fullRoom = obj.context + "." + obj.room;

                socket.join(fullRoom);
                socket.emit("room:joined", fullRoom);
            }
            else
            {
                handlers[ii++](socket, obj.context, obj.room, processNext);
            }
        }
    }

    processNext();
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Have the given socket leave the given room
 *
 * @param socket The socket to leave
 * @param room   The room to leave
 */
api.leaveRoom = function(socket, room)
{
    var fullRoom = api.objectToRoom(room);

    socket.leave(fullRoom);
    socket.emit("room:left", fullRoom);
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Emit an event to the given connected user
 *
 * @param user The user id to emit to
 * @param name The event name
 * @param room The room to emit to
 * @param data The data
 */
api.emitOne = function(user, name, room, data)
{
    var sock = api._connections[user];

    if (sock)
    {
        if (room)
        {
            sock.to(api.objectToRoom(room)).emit(name, data);
        }
        else
        {
            sock.emit(name, data);
        }
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Emit an event to each of the connected users
 *
 * @param users The list of user ids to emit to
 * @param name  The event name
 * @param room  The room to emit to
 * @param data  The data
 */
api.emitEach = function(users, name, room, data)
{
    for (var ii in users)
    {
        api.emitOne(users[ii], name, room, data);
    }
}

// ----------------------------------------------------------------------------------------------------------

/**
 * Emit an event to all connected users except for the given one
 *
 * @param user The user id to exclude
 * @param name The event name
 * @param room The room to emit to
 * @param data The data
 */
api.emitOthers = function(user, name, room, data)
{
    var sock = api._connections[user._id || user];

    if (sock)
    {
        if (room)
        {
            sock.broadcast.to(api.objectToRoom(room)).emit(name, data);
        }
        else
        {
            sock.broadcast.emit(name, data);
        }
    }
    else
    {
        api.emitAll(name, room, data);
    }
}

// ----------------------------------------------------------------------------------------------------------

module.exports = api;

// ----------------------------------------------------------------------------------------------------------
// end socket.js
// ----------------------------------------------------------------------------------------------------------
