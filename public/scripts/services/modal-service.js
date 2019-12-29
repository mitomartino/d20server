'use strict';

angular.module('d20helper.modalService', []).

/**
 * Controller for basic modal dialogs
 */
controller('OptionsModalCtrl', ['$scope', 'utilsService', 'options', 'title', 'prompt', 'callback', 'cssClass',
    function($scope, utilsService, options, title, prompt, callback, cssClass)
    {
        $scope.init = function()
        {
            $scope.options  = options;
            $scope.title    = title;
            $scope.prompt   = prompt;
            $scope.callback = callback;
            $scope.cssClass = cssClass;
        }

        /**
         * Respond to an option selection
         *
         * @param option The selected option
         */
        $scope.optionSelected = function(option)
        {
            $scope.errorMessage = null;

            if (!$scope.callback)
            {
                if (option.reject)
                {
                    $scope.$dismiss(option);
                }
                else
                {
                    $scope.$close(option);
                }
            }
            else
            {
                $scope.working = true;

                var result = $scope.callback.call(this, option);

                if ( (!result) || (!result.then) )
                {
                    $scope.working = false;

                    if (option.reject)
                    {
                        $scope.$dismiss(option);
                    }
                    else
                    {
                        $scope.$close(option);
                    }
                }
                else
                {
                    result.then(
                        function()
                        {
                            $scope.working = false;
                            $scope.$close(option);
                        },
                        function(err)
                        {
                            $scope.working = false;
                            $scope.errorMessage = utilsService.getMessageFromError(err, 'An error occurred');
                        }
                    );
                }
            }
        }

        /**
         * Respond to the user pressing enter while the dialog is displayed
         */
        $scope.ok = function()
        {
            var option = _.findWhere($scope.options, {enter: true});

            if (option)
            {
                $scope.optionSelected(option);
            }
        }

        /**
         * Respond to the user pressing escape while the dialog is displayed
         */
        $scope.cancel = function()
        {
            var option = _.findWhere($scope.options, {escape: true});

            if (option)
            {
                $scope.optionSelected(option);
            }
        }

        $scope.init();
    }
]).

/**
 * Controller for user-selection dialog
 */
controller('UserSelectModalCtrl', [

    '$scope', 'utilsService', 'title', 'prompt', 'allowedUsers', 'disallowedUsers', 'selectedUsers', 'allowSelf', 'multiSelect', 'callback', 'cssClass',

    function($scope, utilsService, title, prompt, allowedUsers, disallowedUsers, selectedUsers, allowSelf, multiSelect, callback, cssClass)
    {
        $scope.init = function()
        {
            $scope.title           = title;
            $scope.prompt          = prompt;
            $scope.allowedUsers    = allowedUsers;
            $scope.disallowedUsers = disallowedUsers;
            $scope.selectedUsers   = selectedUsers;
            $scope.allowSelf       = allowSelf;
            $scope.multiSelect     = multiSelect;
            $scope.callback        = callback;
            $scope.cssClass        = cssClass;
        }

        /**
         * Respond to a user selection
         */
        $scope.ok = function()
        {
            if ( ($scope.selectedUsers) && ((!_.isArray($scope.selectedUsers)) || ($scope.selectedUsers.length)) )
            {
                var result = $scope.callback.call(this, $scope.selectedUsers);

                if ( (!result) || (!result.then) )
                {
                    $scope.working = false;
                    $scope.$close($scope.selectedUsers);
                }
                else
                {
                    result.then(
                        function()
                        {
                            $scope.working = false;
                            $scope.$close($scope.selectedUsers);
                        },
                        function(err)
                        {
                            $scope.working = false;
                            $scope.errorMessage = utilsService.getMessageFromError(err, 'An error occurred');
                        }
                    );
                }
            }
        }

        /**
         * Respond to the user pressing escape while the dialog is displayed
         */
        $scope.cancel = function()
        {
            $scope.$dismiss('cancel');
        }

        $scope.init();
    }
]).

/**
 * Controller for file-chooser dialogs
 */
controller('FileChooserModalCtrl', ['$scope', 'collectionService', 'title', 'cssClass', 'collection', 'userCollection', 'gameCollection', 'systemCollection', 'allowedDrawers', 'drawer', 'file', 'callback', 'showPreview',
    function($scope, collectionService, title, cssClass, collection, userCollection, gameCollection, systemCollection, allowedDrawers, drawer, file, callback, showPreview)
    {
        /**
         * Initialization function
         */
        function init()
        {
            $scope.collections =
            {
                game:
                {
                    name:   gameCollection,
                    exists: false
                },
                user:
                {
                    name:      userCollection,
                    exists:    false,
                    isDefault: true
                },
                system:
                {
                    name:   systemCollection,
                    exists: false
                }
            };

            $scope.title             = title;
            $scope.initialCollection = collection;
            $scope.collection        = collection;
            $scope.cssClass          = cssClass || 'default-file-chooser';
            $scope.drawer            = drawer;
            $scope.file              = file;
            $scope.allowedDrawers    = allowedDrawers;
            $scope.callback          = callback;
            $scope.showPreview       = (showPreview === undefined ? true : false);

            // attempt to load each category of collection.  if successful, ensure that we have
            // at least one viable collection selected
            _.each($scope.collections, function(collDef)
            {
                if (collDef.name)
                {
                    collectionService.loadCollection(collDef.name).then(function()
                    {
                        if ( (!$scope.collection) && (collDef.isDefault) )
                        {
                            $scope.collection = collDef.name;
                        }
                        else if (!$scope.initialCollection)
                        {
                            $scope.collection = collDef.name;
                        }

                        collDef.exists = true;
                    });
                }
            });
        }

        /**
         * Show the given collection type
         *
         * @param type One of "user", "game" or "system"
         */
        $scope.showCollection = function(type)
        {
            $scope.collection = $scope.collections[type].name;
        }

        /**
         * Respond to a file selection
         */
        $scope.fileSelected = function()
        {
            var selection =
            {
                collection: $scope.collection,
                drawer:     $scope.drawer,
                file:       $scope.file,
                fullPath:   $scope.fullPath,
                type:       $scope.selectedFileType
            };

            $scope.errorMessage = null;

            if (!$scope.callback)
            {
                $scope.$close(selection);
            }
            else
            {
                $scope.working = true;

                var result = $scope.callback.call(this, selection);

                if ( (!result) || (!result.then) )
                {
                    $scope.working = false;

                    $scope.$close(selection);
                }
                else
                {
                    result.then(
                        function()
                        {
                            $scope.working = false;
                            $scope.$close(selection);
                        },
                        function(err)
                        {
                            $scope.working = false;
                            $scope.errorMessage = utilsService.getMessageFromError(err, 'An error occurred');
                        }
                    );
                }
            }
        }

        $scope.cancel = function()
        {
            $scope.$dismiss('User canceled');
        }

        init();
    }
]).

/**
 * modal dialog service
 *
 * Provides helper functions and hooks for generating common modal dialogs, ensuring mutual exclusivity,
 * and querying current modal.
 *
 */
factory('modalService', ['$rootScope', '$q', '$timeout', '$uibModal', '$uibModalStack', 'constantsService',

    function($rootScope, $q, $timeout, $uibModal, $uibModalStack, constants)
    {
        var service =
        {
            model:
            {
                modalStack:
                    [

                    ],

                pendingModals:
                    [

                    ]
            },

            nextModalId: 1,
            inputSelector: 'input[type=text], input[type=password], textarea, select'
        };

        var model = service.model;

        // ------------------------------------------------------------------------------------------------------
        // service public interface methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Open a new modal dialog
         *
         * @param  config The modal config (see angular bootstrap)
         * @return The modal instance
         */
        service.open = function(config)
        {
            var modalClass = 'modal-' + model.nextModalId;

            // we want to install our own hooks on escape key, so disable the default
            if (!config.keyboard)
            {
                config.keyboard = false;
            }

            // tag this modal with its modal id, so that we can find it later
            if (config.windowClass)
            {
                config.windowClass += ' ' + modalClass;
            }
            else
            {
                config.windowClass = modalClass;
            }

            config.backdrop = 'static';

            // open the modal
            var modal = $uibModal.open(config);

            // modal is pending but belongs to the modal stack
            model.pendingModals.push(modal);
            model.modalStack.push(modal);

            // once the modal is rendered for the first time, it will no longer be pending and
            // we will be able to access the DOM
            modal.rendered.then(function()
            {
                var modalElement = angular.element('.' + modalClass);

                // no longer pending
                model.pendingModals = _.without(model.pendingModals, modal);

                if ( (modalElement) && (modalElement.length) )
                {
                    var scope = modalElement.scope();

                    // apply focus to first focusable element if none is found, then apply to
                    // modal div
                    $timeout(function()
                    {
                        var firstInput = angular.element(service.inputSelector, modalElement).filter(':visible:first');

                        firstInput.focus();
                    },
                    500);

                    if (scope)
                    {
                        if (!scope.ok)
                        {
                            scope.ok = function()
                            {
                                modal.close();
                            }
                        }
                        if (!scope.cancel)
                        {
                            scope.cancel = function()
                            {
                                modal.dismiss('esc');
                            }
                        }
                    }
                    // add hooks for enter/escape key press
                    modalElement.bind('keydown', function(event)
                    {
                        if (event.keyCode == constants.KEYS.ENTER)
                        {
                            if ( (scope) && (scope.ok) )
                            {
                                event.stopPropagation();

                                scope.$apply(function()
                                {
                                    scope.ok(document.activeElement);
                                });
                            }
                        }
                        else if (event.keyCode == constants.KEYS.ESC)
                        {
                            event.stopPropagation();

                            if ( (scope) && (scope.cancel) )
                            {
                                scope.$apply(function()
                                {
                                    scope.cancel(document.activeElement);
                                });
                            }
                            else
                            {
                                modal.dismiss('esc');
                            }
                        }
                    });
                }
            });

            // however the modal is closed, track it so that we can remove it from the modal stack(s)
            modal.result.finally(function()
            {
                model.modalStack    = _.without(model.modalStack,    modal);
                model.pendingModals = _.without(model.pendingModals, modal);
            });

            // return the modal so that the call can
            return modal;
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Open a basic message modal
         *
         * @param title    The title of the dialog
         * @param prompt   The user prompt
         * @param callback Callback for the response or null
         * @param cssClass CSS class for the dialog
         */
        service.openMessageModal = function(title, prompt, callback, cssClass)
        {
            return service.openOptionsModal(
                title,
                prompt,
                [
                    {
                        text:     'OK',
                        icon:     'fa-check',
                        enter:    true,
                        callback: callback,
                        cssClass: 'option-button-fixed'
                    }
                ],
                callback,
                cssClass
            );
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Open a basic ok/cancel modal
         *
         * @param title    The title of the dialog
         * @param prompt   The user prompt
         * @param callback Callback for the response or null
         * @param cssClass CSS class for the dialog
         */
        service.openOkCancel = function(title, prompt, callback, cssClass)
        {
            return service.openOptionsModal(
                title,
                prompt,
                [
                    {
                        text:     'OK',
                        icon:     'fa-check',
                        enter:    true,
                        cssClass: 'option-button-fixed'
                    },
                    {
                        text:   'Cancel',
                        icon:   'fa-close',
                        escape: true,
                        reject: true,
                        cssClass: 'option-button-fixed'
                    }
                ],
                callback,
                cssClass
            );
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Open a basic ok/cancel modal
         *
         * @param title    The title of the dialog
         * @param prompt   The user prompt
         * @param callback Callback for the response or null
         * @param cssClass CSS class for the dialog
         */
        service.openYesNo = function(title, prompt, callback, cssClass)
        {
            return service.openOptionsModal(
                title,
                prompt,
                [
                    {
                        text: 'Yes',
                        icon: 'fa-check',
                        enter: true,
                        cssClass: 'option-button-fixed'
                    },
                    {
                        text:   'No',
                        icon:   'fa-close',
                        escape: true,
                        reject: true,
                        cssClass: 'option-button-fixed'
                    }
                ],
                callback,
                cssClass
            );
        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Open a basic modal with buttons representing various options
         *
         * @param title    The title of the dialog
         * @param prompt   The user prompt
         * @param options  The options to display
         * @param callback Callback for the response or null
         * @param cssClass CSS class for the dialog
         */
        service.openOptionsModal = function(title, prompt, options, callback, cssClass)
        {
            return service.open(
                {
                    templateUrl: 'views/modals/options-modal.html',
                    controller: 'OptionsModalCtrl',
                    resolve:
                    {
                        title: function()
                        {
                            return title;
                        },
                        prompt: function()
                        {
                            return prompt;
                        },
                        options:  function()
                        {
                            return options;
                        },
                        callback: function()
                        {
                            return callback;
                        },
                        cssClass: function()
                        {
                            return cssClass;
                        }
                    }
                }
            );
        }

        /**
         * Show a file chooser dialog
         *
         * Available options:
         *  title            - title for the modal
         *  cssClass         - css class to style the modal
         *  collection       - initial collection to display (defaults to userCollection)
         *  userCollection   - collection associated with the user if available
         *  gameCollection  - collection associated with the current game is available
         *  systemCollection - shared collection if available
         *  drawer           - initial drawer to select
         *  file             - initial file to select
         *  showPreview      - whether or not to show the preview pane (defaults to true)
         *  allowedDrawers   - optional list of drawers to allow user to select from
         *  callback         - optional callback to invoke once a file is selected
         *
         * @param options The options
         */
        service.openFileChooserModal = function(options)
        {
            return service.open(
            {
                resolve:
                {
                    title: function()
                    {
                        return options.title || 'File Chooser';
                    },
                    callback: function()
                    {
                        return options.callback;
                    },
                    cssClass: function()
                    {
                        return options.cssClass;
                    },
                    collection: function()
                    {
                        return options.collection;
                    },
                    userCollection: function()
                    {
                        return options.userCollection;
                    },
                    gameCollection: function()
                    {
                        return options.gameCollection;
                    },
                    systemCollection: function()
                    {
                        return options.systemCollection;
                    },
                    drawer: function()
                    {
                        return options.drawer;
                    },
                    file: function()
                    {
                        return options.file;
                    },
                    allowedDrawers: function()
                    {
                        return options.allowedDrawers;
                    },
                    showPreview: function()
                    {
                        return options.showPreview;
                    }
                },
                templateUrl: 'views/modals/file-chooser-modal.html',
                controller:  'FileChooserModalCtrl',
                size:        'lg'
            });

        }

        // ------------------------------------------------------------------------------------------------------

        /**
         * Show a user-selection dialog
         *
         * Available options:
         *  title            - title for the modal
         *  prompt           - prompt for the user to select users
         *  cssClass         - css class to style the modal
         *  allowedUsers     - list of allowed users
         *  disallowedUsers  - list of disallowed users
         *  selectedUsers    - list of initially selected users
         *  allowSelf        - allow the user to select himself
         *  multiSelect      - true if multiple users may be selected
         *  callback         - optional callback to invoke once a file is selected
         *
         * @param options The options
         */
        service.openUserSelectModal = function(options)
        {
            return service.open(
                {
                    resolve:
                    {
                        title: function()
                        {
                           return options.title || 'File Chooser';
                        },
                        prompt: function()
                        {
                            return options.prompt;
                        },
                        callback: function()
                        {
                                   return options.callback;
                        },
                        cssClass: function()
                        {
                                   return options.cssClass;
                        },
                        allowedUsers: function()
                        {
                            return options.allowedUsers;
                        },
                        disallowedUsers: function()
                        {
                            return options.disallowedUsers;
                        },
                        allowSelf: function()
                        {
                            return options.allowSelf;
                        },
                        selectedUsers: function()
                        {
                            return options.selectedUsers;
                        },
                        multiSelect: function()
                        {
                            return options.multiSelect;
                        },
                    },
                    templateUrl: 'views/modals/user-select-modal.html',
                    controller:  'UserSelectModalCtrl'
                }
            );

        }

        // ------------------------------------------------------------------------------------------------------
        // private methods
        // ------------------------------------------------------------------------------------------------------

        /**
         * Service initialization
         */
        function init()
        {

        }

        init();

        return service;

    }
]);
