angular.module('d20helper.userTile', [])

    /**
     * directive: userPermissions
     *
     * Element directive allowing for the management of permissions for a given user within a given
     * context.
     */
    .directive('userPermissions', ['applicationService', 'userService', 'constantsService',
        function(applicationService, userService, constantsService)
        {
            var directive =
            {
                /**
                 * Element only
                 */
                restrict: 'E',

                /**
                 * Template file for this directive
                 */
                templateUrl: 'scripts/directives/user-tile/user-permissions.html',

                /**
                 * Isolated scope for this directive
                 */
                scope:
                {
                    user:    '=',      // user whose permissions should be modified
                    target:  '=?',     // target object
                    context: '@',      // context to modify permissions under
                },

                /**
                 * Link function for the directive
                 *
                 * @param $scope  scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    $scope.currentUser       = applicationService.model.currentUser;
                    $scope.permissionTargets = {};

                    constantsService.lookup('permissions').then(function(permissions)
                    {
                        $scope.allPermissions = _.sortBy(permissions, 'order');
                        $scope.updatePermissions();
                    });

                    $scope.$watch('user.files', function()
                    {
                        if ( ($scope.user.files) && (!$scope.user.lastDrawer) )
                        {
                            $scope.user.lastDrawer = null;
                        }
                    });

                    $scope.$watch('currentUser.permissionTargets', function()
                    {
                        $scope.updatePermissions();
                    });

                    $scope.$watch('user.permissionTargets', function()
                    {
                        $scope.updatePermissions();
                    });

                    /**
                     * Generate the list of permissions to manage
                     */
                    $scope.updatePermissions = function()
                    {
                        var targetId = $scope.target;
                        var canEdit  = $scope.user.isManaged;

                        if ( (targetId) && (targetId.id) )
                        {
                            targetId = targetId.id;
                        }

                        if (!targetId)
                        {
                            targetId = 'global';
                        }

                        var dirUser  = $scope.user.permissionTargets[targetId];

                        $scope.permissions = [];
                        $scope.editable    = [];
                        $scope.enabled     = [];

                        _.each($scope.allPermissions, function(perm) {

                            var target = perm.targets || 'global';

                            if ($scope.context == 'global' || (target == $scope.context) )
                            {
                                $scope.permissions.push(perm);

                                // do not allow the current user to remove her own administrator status
                                if ( (perm.entitlement == 'administrator') &&
                                     ($scope.user      == applicationService.model.currentUser) )
                                {
                                    $scope.editable.push(false);
                                }
                                else
                                {
                                    $scope.editable.push(
                                        (canEdit) && (applicationService.isAuthorized(perm.entitlement, targetId)));
                                }

                                $scope.enabled.push(
                                    (dirUser) && (dirUser[perm.entitlement]));
                            }
                        });
                    }

                    /**
                     * Toggle permissions for the current user in the current context
                     *
                     * @param index The index of the permission to toggle
                     */
                    $scope.togglePermission = function(index)
                    {
                        if ( ($scope.user) && ($scope.editable[index]) )
                        {
                            var entitlement = $scope.permissions[index].entitlement;

                            if ($scope.enabled[index])
                            {
                                userService.denyUser($scope.user, entitlement, $scope.context);
                            }
                            else
                            {
                                userService.permitUser($scope.user, entitlement, $scope.context);
                            }
                        }
                    }

                }
            };

            return directive;
        }
    ])

    /**
     * directive: userSelect
     *
     * Element directive allowing for the selection of one or more users
     */
    .directive('userSelect', [

        '$timeout', 'applicationService', 'userService', 'constantsService',

        function($timeout, applicationService, userService, constantsService)
        {
            var directive =
            {
                /**
                 * Element only
                 */
                restrict: 'E',

                /**
                 * Template file for this directive
                 */
                templateUrl: 'scripts/directives/user-tile/user-select.html',

                /**
                 * Isolated scope for this directive
                 */
                scope:
                {
                    selection:       '=?',      // selected user(s)
                    allowedUsers:    '=?',      // list of allowed users or falsey for all
                    disallowedUsers: '=?',      // list of disallowed users or falsey for all allowed
                    allowSelf:       '@',       // whether or not the logged in user should be displayed
                    multiSelect:     '@',       // whether to allow multiple selections
                },

                /**
                 * Link function for the directive
                 *
                 * @param $scope  scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function ($scope, element, attrs)
                {
                    /**
                     * Initialize the directive on this element
                     */
                    function init()
                    {
                        $scope.filterCount     = 1;
                        $scope.filterText      = '';
                        $scope.selectionLookup = {};
                        $scope.userModel       = userService.model.users;

                        $scope.multiSelect = ( ($scope.multiSelect) && ($scope.multiSelect != "false") );
                        $scope.allowSelf   = ( ($scope.allowSelf)   && ($scope.allowSelf   != "false") );

                        $scope.$watch("selection", function()
                        {
                            $scope.updateSelectionLookup();
                        });

                        $scope.applyFilter();
                    }

                    /**
                     * Filter the user-list based on the current filter text,
                     * the list of allowed users, etc
                     */
                    $scope.applyFilter = function()
                    {
                        var self = applicationService.model.currentUser;

                        if ($scope.allowedUsers)
                        {
                            $scope.filteredUsers = $scope.allowedUsers;

                            if (!_.isArray($scope.allowedUsers))
                            {
                                if ($scope.multiSelect)
                                {
                                    $scope.selection = [$scope.allowedUsers];
                                }
                                else
                                {
                                    $scope.selection = $scope.allowedUsers;
                                }
                            }
                            else if ($scope.allowedUsers.length == 1)
                            {
                                if ($scope.multiSelect)
                                {
                                    $scope.selection = $scope.allowedUsers;
                                }
                                else
                                {
                                    $scope.selection = $scope.allowedUsers[0];
                                }
                            }
                        }
                        else
                        {
                            $scope.filteredUsers = $scope.userModel.data;
                        }

                        if ($scope.filterText.length)
                        {
                            $scope.filteredUsers = _.filter($scope.filteredUsers, function(user)
                            {
                                if ($scope.selectionLookup[user._id])
                                {
                                    return true;
                                }

                                if (user.nickname.indexOf($scope.filterText) == -1)
                                {
                                    return false;
                                }

                                return true;
                            });
                        }

                        if ( ($scope.disallowedUsers) && ($scope.disallowedUsers.length) )
                        {
                            $scope.filteredUsers = _.reject($scope.filteredUsers, function(user)
                            {
                                return (_.indexOf($scope.disallowedUsers, user) != -1);
                            });
                        }

                        if (!$scope.allowSelf)
                        {
                            $scope.filteredUsers = _.without($scope.filteredUsers, self);
                        }
                    }

                    /**
                     * Update the selection lookup based on the current selection
                     */
                    $scope.updateSelectionLookup = function()
                    {
                        $scope.selectionLookup = {};

                        if (_.isArray($scope.selection))
                        {
                            _.each($scope.selection, function(user)
                            {
                                $scope.selectionLookup[user._id] = true;
                            });
                        }
                        else if ($scope.selection)
                        {
                            $scope.selectionLookup[$scope.selection._id] = true;
                        }
                    }

                    /**
                     * Toggle whether or not the given user is selected
                     *
                     * @param user The user to toggle selection for
                     */
                    $scope.toggleSelect = function(user)
                    {
                        if ($scope.multiSelect)
                        {
                            if ($scope.selectionLookup[user._id])
                            {
                                delete $scope.selectionLookup[user._id];
                                $scope.selection = _.without($scope.selection, user);
                            }
                            else
                            {
                                $scope.selectionLookup[user._id] = true;

                                if (!$scope.selection)
                                {
                                    $scope.selection = [];
                            }
                                $scope.selection.push(user);
                            }
                        }
                        else if (!$scope.selectionLookup[user._id])
                        {
                            $scope.selectionLookup = {};
                            $scope.selectionLookup[user._id] = true;
                            $scope.selection = user;
                        }
                    }

                    // invoke init once interpolation has been applied to the isolate scope
                    $timeout(init, 10);
                }
            };

            return directive;
        }
    ])

    /**
     * directive: userTile
     *
     * Element presenting a tile to represent a given user and any actions that may be performed on him/her
     */
    .directive('userTile', [

        '$q', '$timeout', 'applicationService', 'userService', 'constantsService', 'modalService', 'collectionService',

        function($q, $timeout, applicationService, userService, constantsService, modalService, collectionService)
        {
            var directive =
            {
                /**
                 * Element only
                 */
                restrict: 'E',

                /**
                 * Template file for this directive
                 */
                templateUrl: 'scripts/directives/user-tile/user-tile.html',

                /**
                 * Isolated scope for this directive
                 */
                scope:
                {
                    user:     '=',      // user whose tile this is
                    border:   '=?',     // whether or not to present a border
                },

                /**
                 * Link function for the directive
                 *
                 * @param $scope  scope for the element
                 * @param element element that we are linking the directive to
                 * @param attrs   element attributes
                 */
                link: function($scope, element, attrs)
                {
                    /**
                     * Initialize the directive for this element
                     */
                    function init()
                    {
                        $scope.userModel            = userService.model.users;
                        $scope.percentDiskFreeClass = 'success';
                        $scope.hasBorder            = true;

                        if ( (!$scope.border) && ($scope.border !== undefined) )
                        {
                            $scope.hasBorder = false;
                        }

                        // intiialize views
                        $scope.views =
                        [
                            {
                                name:    'activity',
                                title:   'Activity',
                                icon:    'fa-bicycle',
                                visible: true
                            },
                            {
                                name:    'details',
                                title:   'Details',
                                icon:    'fa-binoculars',
                                visible: true
                            },
                            {
                                name:    'avatar',
                                title:   'Avatar',
                                icon:    'fa-image',
                                visible: true
                            },
                            {
                                name:    'files',
                                title:   'Files',
                                icon:    'fa-folder-open',
                                visible: true
                            },
                            {
                                name:    'chat',
                                title:   'Conversations',
                                icon:    'fa-comments',
                                visible: true
                            }
                        ];

                        $scope.view =
                        {
                            name: 'activity'
                        };

                        $scope.$watch('user', function()
                        {
                            $scope.reset();
                        });

                        attrs.$observe('expanded', function(newVal)
                        {
                            if ( ((!attrs.expanded) || (attrs.expanded == "false")) )
                            {
                                userService.hideUserDetails($scope.user);
                            }
                        });

                        $scope.$watch(
                            function()
                            {
                                if ( ($scope.user) && ($scope.user.files) )
                                {
                                    var coll = $scope.user.files;

                                    return coll.quota - coll.bytesUsed;
                                }

                                return 0;
                            },
                            function(newVal)
                            {
                                $scope.bytesRemaining = newVal;

                                if (newVal)
                                {
                                    $scope.percentDiskFree = Math.floor(
                                        (newVal / $scope.user.files.quota) * 100);

                                    if ($scope.percentDiskFree == 0)
                                    {
                                        $scope.percentDiskFree = 1;
                                    }
                                }
                                else
                                {
                                    $scope.percentDiskFree = 0;
                                }

                                if ($scope.percentDiskFree < 25)
                                {
                                    $scope.percentDiskFreeClass = 'danger';
                                }
                                else
                                {
                                    $scope.percentDiskFreeClass = 'success';
                                }

                                $scope.maxPercent = 100;
                            }
                        );

                        attrs.$observe('readOnly', function()
                        {
                            if (!attrs.readOnly)
                            {
                                $scope.readOnly = false;
                            }
                            else if (attrs.readOnly == 'false')
                            {
                                $scope.readOnly = false;
                            }
                            else
                            {
                                $scope.readOnly = true;
                            }
                        });
                    }

                    /**
                     * Reset the tile for a new user
                     */
                    $scope.reset = function()
                    {
                        $scope.view.name = 'activity';

                        if ($scope.user)
                        {
                            collectionService.urlToCollection($scope.user.avatar).then(
                                function (info)
                                {
                                    $scope.avatarInfo = info;
                                },
                                function(error)
                                {
                                    console.log($scope.user, error);
                                });

                            var view = _.findWhere($scope.views, {name: 'chat'});

                            if (view)
                            {
                                view.visible = $scope.user != applicationService.model.currentUser;
                            }

                            view = _.findWhere($scope.views, {name: 'files'});

                            if (view)
                            {
                                view.visible = !!$scope.user.files;
                            }
                        }
                    }

                    /**
                     * Toggle display of the details view for the current user
                     *
                     * @param user The user to toggle details view for
                     */
                    $scope.toggleDetails = function()
                    {
                        var user = $scope.user;

                        if (user.showingDetails)
                        {
                            userService.hideUserDetails(user);
                        }
                        else
                        {
                            userService.showUserDetails(user);
                        }
                    }
                    
                    /**
                     * Prompt and then delete the current user
                     */
                    $scope.deleteUser = function()
                    {
                        var user = $scope.user;

                        var promise = modalService.openOkCancel(
                            'Delete User',
                            'This operation cannot be undone.  Permanently delete user "' + user.nickname +
                            '" from the server?',
                            function(option)
                            {
                                if (option.text == 'OK')
                                {
                                    return userService.deleteUser(user);
                                }
                            });
                    }

                    /**
                     * Prompt and then ban the current user
                     */
                    $scope.banUser = function()
                    {
                        var user = $scope.user;

                        if (user.isBanned)
                        {
                            modalService.openOkCancel(
                                'Lift User Ban',
                                'The user will once again be able to log in and join game tables.  ' +
                                'The user can be banned again at any time. Lift ban on "' + user.nickname +
                                '"?',
                                function(option)
                                {
                                    if (option.text == 'OK')
                                    {
                                        return userService.unbanUser($scope.user);
                                    }
                                }
                            );
                        }
                        else
                        {
                            modalService.openOkCancel(
                                'Ban User',
                                'The user will not be able to log in or join any tables.  ' +
                                'This operation can be undone. Temporarily ban "' + user.nickname +
                                '" from the server?',
                                function(option)
                                {
                                    if (option.text == 'OK')
                                    {
                                        return userService.banUser($scope.user);
                                    }
                                }
                            );
                        }
                    }

                    /**
                     * Create a file collection for this user
                     */
                    $scope.makeFileCollection = function()
                    {
                        collectionService.makeUserCollection($scope.user);
                    }

                    /**
                     * Set the avatar for this user
                     *
                     * @param avatarInfo object with collection/drawer/file
                     */
                    $scope.setAvatar = function(avatarInfo)
                    {
                        userService.setAvatar($scope.user, avatarInfo.url);
                    }

                    init();
                }

            };

            return directive;
        }
    ]);