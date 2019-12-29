'use strict';

angular.module('d20helper.socketService', []).

/**
 * Socket connection service
 *
 * Manages connection to the real-time socket stream, event tie-ins, etc
 *
 */
factory('socketService', ['$rootScope', '$q', '$timeout', 'structures',

    function($rootScope, $q, $timeout, structures)
    {
        var service =
        {
            ready:             false,
            connection:        null,
            connectPromise:    null,
            disconnectPromise: null,
            listeners:         new structures.HashList(),
            pendingListeners:  new structures.HashList(),
            rooms:             {},
            sockets:           []
        };

        // ---------------------------------------------------------------------------------------------------
        // Service public interface
        // ---------------------------------------------------------------------------------------------------

        /**
         * Begin the socket connection
         */
        service.begin = function()
        {
            if (service.connectPromise)
            {
                return service.connectPromise;
            }

            return $q(function(resolve, reject)
            {
                if (service.connection)
                {
                    resolve(service.connection);
                    return;
                }

                service.connection = io.connect("/");

                // socket events

                // connected: note that we are connected
                service.connection.on("connected", function(data)
                {
                    console.log("connected");
                });

                // log any connection errors and reject the connection promise
                service.connection.on("connect_error", function(data)
                {
                    console.log("connection error", data);
                    reject(data);
                });

                // ready to subscribe for notifications: apply any pending listeners
                service.connection.on("ready", function(data)
                {
                    console.log("connection ready");

                    service.ready = true;

                    service.pendingListeners.each(function(listener)
                    {
                        service.on(listener.name, listener.scope, listener.origCb);
                    });

                    service.pendingListeners.clear();

                    resolve(service.connection);
                });

                // reconnected: rejoin any rooms we were subscribed to
                service.connection.on("reconnect", function(count) 
                {
                    console.log("connection: reconnect", count);
                    console.log("rejoining room(s)");

                    // get the map of rooms to (re)join
                    var rooms = service.rooms;

                    // cleer the room map so that we don't early out when joining
                    service.rooms = {};

                    // join the rooms
                    _.each(rooms, function(rejoin, room) 
                    {
                        if (rejoin)
                        {
                            service.join(room);
                        }
                    });

                    console.log("completed reconnect");
                });

                // joined a room: update bookkeeping
                service.connection.on("room:joined", function(room)
                {
                    console.log("joined room", room);

                    service.rooms[room] = true;
                });

                // left a room: update bookkeeping
                service.connection.on("room:left", function(room)
                {
                    console.log("left room", room);

                    service.rooms[room] = false;
                });

            });
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * End the socket connection
         */
        service.end = function()
        {
            if (!service.connection)
            {
                service.disconnectPromise = null;
            }
            else
            {
                service.ready            = false;
                service.pendingListeners = service.listeners;
                service.listeners        = new structures.HashList();

                service.connection.disconnect();
                service.connection = null;
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Join a given room
         *
         * @param room The room to join
         */
        service.join = function(room)
        {
            if (!service.rooms[room])
            {
                console.log("joining room: ", room);
                service.connection.emit("room:join", room);
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Leave a given room
         *
         * @param room The room to leave
         */
        service.leave = function(room)
        {
            if (service.rooms[room])
            {
                service.connection.emit("room:left", room);
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Register a callback for a particular type of message
         *
         * @param name     The event name
         * @param scope    The scope to tie the lifetime of the callback to
         * @param callback The callback
         */
        service.on = function(name, scope, callback)
        {
            var def =
            {
                name:   name,
                scope:  scope,
                origCb: callback
            };

            if (!service.ready)
            {
                service.pendingListeners.put(def.name, def);
            }
            else
            {
                var existing = service.listeners.findWhere(name, {origCb: callback});

                if (!existing)
                {
                    // if this callback is tied to a scope, then once the scope is destroyed, automatically
                    // unsubscribe the callback.
                    if (scope) 
                    {
                        scope.$on('$destroy', function() 
                        {
                            console.log("socket: removing callback due to $destroy", name);
                            service.off(name, callback);
                        });
                    }

                    // we will wrap the desired callback inside one of our own for logging/debugging/bookkeeping.
                    // this also allows us to resolve the callback from within an angular context.
                    def.cb = function(data)
                    {
                        $timeout(
                            function()
                            {
                                console.log("socket:", name, data);

                                callback(data);
                            });
                    };

                    service.listeners.put(def.name, def);
                    service.connection.on(name, def.cb);
                }
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * De-register a callback for a particular type of message
         *
         * @param name     The event name
         * @param callback The callback
         */
        service.off = function(name, callback)
        {
            var cb =
            {
                name:   name,
                origCb: callback
            };

            if (!service.ready)
            {
                service.pendingListeners.reject(name, function(obj)
                {
                    return callbacksMatch(cb, obj);
                });
            }
            else
            {
                var def = service.listeners.findWhere(name, {origCb: callback});

                if (def)
                {
                    service.connection.off(name, def.cb);

                    service.listeners = service.listeners.reject(cb.name, function(obj)
                    {
                        return callbacksMatch(cb, obj);
                    });
                }
            }
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Send a message to the real-time connection
         *
         * @param name The event name
         * @param data The event data
         */
        service.emit = function(name, data)
        {
            service.connection.emit(name, data);
        }

        // ---------------------------------------------------------------------------------------------------
        // Service private methods
        // ---------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
        }

        // ---------------------------------------------------------------------------------------------------

        /**
         * Determine whether or not two callback definitions match
         *
         * @param   cb1       The first callback definition
         * @param   cb2       The second callback definition
         * @return  {Boolean} True if they match else false
         */
        function callbacksMatch(cb1, cb2)
        {
            if (cb1.name == cb2.name)
            {
                if (!cb1.origCb)
                {
                    return true;
                }

                if (cb1.origCb == cb2.origCb)
                {
                    return true;
                }
            }

            return false;
        }

        // ---------------------------------------------------------------------------------------------------
        // Main script
        // ---------------------------------------------------------------------------------------------------

        init();

        return service;
    }
]);

// ----------------------------------------------------------------------------------------------------------
// end socket-service.js
// ----------------------------------------------------------------------------------------------------------
