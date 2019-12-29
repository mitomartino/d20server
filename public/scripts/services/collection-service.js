'use strict';

angular.module('d20helper.collectionService', []).

controller('ImportFileIntoCollectionCtrl', [

    "$scope", "ajaxService", "collectionService", "utilsService", "importData", "systemCollection", "userCollection", "gameCollection",

    function($scope, ajaxService, collectionService, utilsService, importData, systemCollection, userCollection, gameCollection)
    {
        /**
         * Initialize the controller
         */
        function init()
        {
            $scope.importData = importData;

            $scope.opts =
            {
                collections:
                [
                ],
                drawers:
                [
                ]
            };

            var defaultCollection = null;

            if (systemCollection)
            {
                $scope.opts.collections.push(
                {
                    text:  "System Files",
                    value: systemCollection
                });

                defaultCollection = $scope.opts.collections[$scope.opts.collections.length - 1];
            }

            if (userCollection)
            {
                $scope.opts.collections.push(
                {
                    text:  "My Files",
                    value: userCollection
                });

                defaultCollection = $scope.opts.collections[$scope.opts.collections.length - 1];
            }

            if (gameCollection)
            {
                $scope.opts.collections.push(
                {
                    text:  "Current Game",
                    value: gameCollection
                });

                defaultCollection = $scope.opts.collections[$scope.opts.collections.length - 1];
            }

            var baseFile  = importData.file;
            var dotIndex  = importData.file.lastIndexOf(".");
            var extension = null;

            if (dotIndex != -1)
            {
                extension = baseFile.substr(dotIndex + 1);
                baseFile  = baseFile.substr(0, dotIndex);
            }

            $scope.importData.file      = baseFile;
            $scope.importData.extension = extension;

            $scope.selection =
            {
                collection: defaultCollection,
                drawer:     null,
                file:       baseFile
            };

            $scope.collectionSelected();
        }

        /**
         * Load the drawers for the selected collection
         */
        $scope.collectionSelected = function()
        {
            if ($scope.selection.collection)
            {
                var coll   = $scope.selection.collection.value;
                var url    = $scope.importData.url;

                if (coll)
                {
                    var drawerName = null;

                    $scope.opts.drawers = [];

                    if ($scope.selection.drawer)
                    {
                        drawerName = $scope.selection.drawer.text;
                    }
                    else if ($scope.importData.drawer)
                    {
                        drawerName = $scope.importData.drawer;
                    }

                    _.each(coll.drawers, function(drawer)
                    {
                        if (collectionService.isValidFileType(coll, drawer.name, url))
                        {
                            $scope.opts.drawers.push(
                            {
                                text:  drawer.name,
                                value: drawer
                            });
                        }
                    });


                    var selDrawer = _.findWhere($scope.opts.drawers, {text: drawerName});

                    if (selDrawer)
                    {
                        $scope.selection.drawer = selDrawer;
                    }
                    else if ($scope.opts.drawers.length)
                    {
                        $scope.selection.drawer = $scope.opts.drawers[0];
                    }
                    else
                    {
                        $scope.selection.drawer = null;
                    }
                }
            }
        }

        /**
         * Determine if the current selection is valid
         *
         * @return {Boolean} true if valid else false
         */
        $scope.validate = function()
        {
            if ( ($scope.selection.collection)      &&
                 ($scope.selection.drawer)          &&
                 ($scope.selection.file.length)     &&
                 ($scope.selection.file.indexOf("." == -1)) )
            {
                var coll   = $scope.selection.collection.value.name;
                var drawer = $scope.selection.drawer.value.name;
                var other  = $scope.importData;
                var file   = $scope.selection.file;

                if ( (coll   == other.collection) &&
                     (drawer == other.drawer)   &&
                     (file   == other.file) )
                {
                    return false;
                }

                return true;
            }

            return false;
        }

        /**
         * Perform the import
         */
        $scope.ok = function()
        {
            if ($scope.validate())
            {
                var sel     = $scope.selection;
                var newName = $scope.selection.file;
                var ext     = $scope.importData.extension;

                if ( (ext) && (ext.length) )
                {
                    newName += "." + ext;
                }

                var req = ajaxService.request(
                {
                    method: "post",
                    url:    "/services/upload/import/:collectionId/:drawer",
                    pathParams:
                    {
                        collectionId: sel.collection.value._id,
                        drawer:       sel.drawer.value.name
                    },
                    data:
                    {
                        file: $scope.importData.url,
                        rename: newName
                    }

                });

                req.then(
                    function(result)
                    {
                        $scope.$close(result);
                    },
                    function(err)
                    {
                        var defaultMsg = "Import into new folder failed";

                        $scope.errorMessage = utilsService.getMessageFromError(err, defaultMsg);
                    }
                )
            }
        }

        /**
         * Cancel the import
         */
        $scope.cancel = function()
        {
            $scope.$dismiss("cancel");
        }

        init();
    }
]).

/**
 * Collection management service
 *
 * Provides helper functions for common tasks
 *
 */
factory('collectionService', ['$q', 'ajaxService', 'applicationService', 'modalService', 'utilsService', 'cache',

    function($q, ajaxService, applicationService, modalService, utilsService, cache)
    {
        var service = {};

        // ------------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {
            service.cache = new cache.AsyncCache("collections");

            function updateBytesUsed(update)
            {
                var collection = service.cache.find({_id: update.collection._id});

                if (collection)
                {
                    // update quota and bytes used
                    collection.bytesUsed = update.collection.bytesUsed;
                    collection.quota     = update.collection.quota;
                }
            }

            applicationService.onServerUpdate("collection.created", null, function(data)
            {
                if (service.cache.hasData())
                {
                    service.cache.append(data);
                }
            });

            applicationService.onServerUpdate("collection.file-updated", null, function(data)
            {
                updateBytesUsed(data);
            });

            applicationService.onServerUpdate("collection.file-added", null, function(data)
            {
                updateBytesUsed(data);
            });

            applicationService.onServerUpdate("collection.file-removed", null, function(data)
            {
                var collection = service.cache.find({_id: data.collection._id});

                if ( (collection) && (collection.contents) )
                {
                    collection.contents = _.without(collection.content, data.file);
                }

                updateBytesUsed(data)
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Load all collections in the system
         *
         * @return {Promise} A promise that will resolve with the data
         */
        service.loadCollections = function()
        {
            return service.cache.load(function(resolve, reject)
            {
                var req = ajaxService.request(
                {
                    method: 'get',
                    url:    '/services/lookup/collections'
                });

                req.then(
                    function(collections)
                    {
                        var system = _.findWhere(collections, {type: "system"});

                        if (system)
                        {
                            service.systemCollection = system;
                        }

                        resolve(collections);
                    },
                    reject
                );
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Load the collection with the given name
         *
         * @param  name The name of the collection to load
         * @return A promise that will resolve with the user's collection
         */
        service.loadCollection = function(name)
        {
            return $q(function(resolve, reject)
            {
                service.loadCollections().then(
                    function(collections)
                    {
                        var collection = _.findWhere(collections, {name: name});

                        if (collection)
                        {
                            resolve(collection);
                        }
                        else
                        {
                            reject("Collection not found");
                        }
                    },
                    function(err)
                    {
                        reject(err);
                    }
                )
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * List the contents of the given collection
         *
         * @param  collection The name of the collection to list or the collection object to list
         * @param  drawer     The drawer to list contents for
         * @return {Promise}  A promise to track success/failure
         */
        service.getContents = function(collection, drawer)
        {
            return $q(function(resolve, reject)
            {
                var req = ajaxService.request({
                    method:     'get',
                    url:        '/services/upload/list/:name/:drawer',
                    pathParams:
                    {
                        name:   collection.name   || collection,
                        drawer: collection.drawer || drawer
                    }
                });

                req.then(resolve, reject);
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Determine if the given path is a valid file for the given collection / drawer
         *
         * @param  collection The collection object loaded from the server
         * @param  drawer     The name of the drawer to query
         * @param  path       The file path to test
         * @return true if valid false if not acceptable
         */
        service.isValidFileType = function(collection, drawer, path)
        {
            var drawer = _.findWhere(collection.drawers, {name: drawer});

            if (drawer)
            {
                var lastDotIndex = path.lastIndexOf('.');

                if (lastDotIndex != -1)
                {
                    var extension       = path.substring(lastDotIndex + 1);
                    var validExtensions = drawer.accept.split(';');

                    return (_.indexOf(validExtensions, extension) != -1);
                }
            }

            return false;
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Load the collection for the current user
         *
         * @return A promise that will resolve with the user's collection
         */
        service.loadUserCollection = function()
        {
            var userId = applicationService.model.currentUser._id;

            return service.loadCollection(userId);
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Create a user collection for the given user
         *
         * @param  user The user / user id of the user to create a file collection for
         * @return A promise that will resolve with the user's new collection
         */
        service.makeUserCollection = function(user)
        {
            var userId = user._id || user;

            return $q(function(resolve, reject)
            {
                service.loadCollection(user._id).then(
                    function(collection)
                    {
                        resolve(collection);
                    },
                    function(err)
                    {
                        var req = ajaxService.request(
                            {
                                method:     'get',
                                url:        '/services/upload/user/:userId/makeCollection',
                                pathParams:
                                {
                                    userId: userId
                                }
                            });

                        req.then(
                            function(collection)
                            {
                                // new collection was added
                                service.cache.append(collection);

                                resolve(collection);
                            },
                            function(err)
                            {
                                var defaultMsg = "Could not allocate file space for that user";

                                modalService.openMessageModal(
                                    "An error occurred...",
                                    utilsService.getMessageFromError(err, defaultMsg));
                            }
                        );
                    }
                );

            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Get the url for the given combination of collection/drawer/file
         *
         * @param collection The collection
         * @param drawer     The drawer
         * @param file       The file
         */
        service.getUrl = function(collection, drawer, file)
        {
            return $q(function(resolve, reject)
            {
                var promise = service.loadCollection(collection);

                promise.then(
                    function(collObj)
                    {
                        resolve(collObj.baseUrl + drawer + '/' + file);
                    },
                    reject
                );
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Deconstruct a url into a collection/drawer/file
         *
         * The promise will resolve with an object with the following fields:
         *  collection - the collection name
         *  drawer     - the name of the drawer
         *  file       - the name of the file
         *
         * @param  url       The url to deconstruct
         * @return {Promise} A promise to track the request
         */
        service.urlToCollection = function(url)
        {
            return $q(function(resolve, reject)
            {
                service.loadCollections().then(
                    function(collections)
                    {
                        var remain    = url;
                        var lastSlash = remain.lastIndexOf('/');
                        var base;
                        var drawer;
                        var file;

                        if ( (lastSlash != -1) && (lastSlash < remain.length - 1) )
                        {
                            file      = remain.substr(lastSlash + 1);
                            remain    = remain.substr(0, lastSlash);
                            lastSlash = remain.lastIndexOf('/');
                        }

                        if ( (lastSlash != -1) && (lastSlash < remain.length - 1) )
                        {
                            drawer = remain.substr(lastSlash + 1);
                            remain = remain.substr(0, lastSlash);
                            base   = remain + '/';
                        }

                        if ( (!base) || (!drawer) || (!file) )
                        {
                            reject('Bad url: ' + url);
                        }
                        else
                        {
                            var collection = _.findWhere(collections, {baseUrl: base});

                            if (!collection)
                            {
                                reject('No collection with base url ' + base);
                            }
                            else
                            {
                                resolve(
                                {
                                    collection: collection.name,
                                    drawer:     drawer,
                                    file:       file,
                                    url:        url
                                });
                            }
                        }
                    },
                    function(err)
                    {
                        reject(err);
                    }
                );
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Upload a file to the given collection / drawer
         *
         * @param   collection The collection to upload to or its name
         * @param   drawer     The name of the drawer
         * @param   fileInfo   The file information from the file input
         * @return  {Promise}  A promise to track the request
         */
        service.uploadFile = function(collection, drawer, fileInfo)
        {
            return $q(function(resolve, reject)
            {
                var formData = new FormData();

                formData.append('file', fileInfo);

                function uploadToCollection(collectionObj)
                {
                    if (!service.isValidFileType(collectionObj, drawer, fileInfo.name))
                    {
                        reject('That file type is not supported by this drawer');
                    }
                    else
                    {
                        var req = ajaxService.request(
                            {
                                method:           'post',
                                url:              '/services/upload/to/:collection/:drawer',
                                data:             formData,
                                headers:          {'Content-Type': undefined },
                                transformRequest: angular.identity,
                                pathParams:
                                {
                                    collection: collectionObj._id,
                                    drawer:     drawer
                                }
                            });

                        req.then(
                            function(result)
                            {
                                var ourDrawer = _.findWhere(collectionObj.drawers, {name: drawer});
                                var resDrawer = _.findWhere(result.drawers,        {name: drawer});

                                // update quota and bytes used
                                collectionObj.bytesUsed = result.bytesUsed;
                                collectionObj.quota     = result.quota;

                                if ( (ourDrawer) && (resDrawer) )
                                {
                                    ourDrawer.contents = resDrawer.contents;
                                }

                                resolve(result, reject);
                            },

                            reject
                        );
                    }
                }

                // load the collection if one was not specified
                if (!collection._id)
                {
                    service.loadCollection(collection).then(uploadToCollection);
                }
                else
                {
                    uploadToCollection(collection);
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Prompt the user to import a file into a collection
         *
         * url must be localized onto this server
         *
         * @param url The url of the file to import
         */
        service.promptImport = function(url)
        {
            return $q(function(resolve, reject)
            {
                service.urlToCollection(url).then(function(importData)
                {
                    var userCollection   = applicationService.model.currentUser.files;
                    var systemCollection = service.systemCollection;
                    var gameCollection  = service.gameCollection;

                    return modalService.open(
                    {
                        resolve:
                        {
                            importData: function()
                            {
                                return importData;
                            },
                            userCollection: function()
                            {
                                return userCollection;
                            },
                            systemCollection: function()
                            {
                                return systemCollection;
                            },
                            gameCollection: function()
                            {
                                return gameCollection;
                            }
                        },
                        templateUrl: 'views/modals/import-into-collection.html',
                        controller:  'ImportFileIntoCollectionCtrl'
                    });
                });
            });
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Delete the given file from the given drawer
         *
         * @param   collection The collection object or its name
         * @param   drawer     The name of the drawer to delete from
         * @param   file       The file to delete
         * @return  {Promise}  A promise to track this
         */
        service.deleteFile = function(collection, drawer, file)
        {
            return $q(function(resolve, reject)
            {
                function deleteFromCollection(collectionObj, drawer, file)
                {
                    var req = ajaxService.request(
                    {
                        method: 'post',
                        url: '/services/upload/delete/from/:collection/:drawer',
                        pathParams:
                        {
                            collection: collectionObj._id,
                            drawer:     drawer
                        },
                        data:
                        {
                            file: file
                        }
                    });

                    req.then(resolve, reject);
                }

                if (!collection._id)
                {
                    service.loadCollection(collection).then(deleteFromCollection, reject);
                }
                else
                {
                    deleteFromCollection(collection, drawer, file);
                }
            });
        }

        // ------------------------------------------------------------------------------------------------------

        init();

        return service;
    }
]);
