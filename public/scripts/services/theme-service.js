'use strict';

angular.module('d20helper.themeService', []).

/**
 * Theme service
 *
 * Manages current theme, theme selection, etc
 *
 * Provides helper methods for locating assets based on theme
 *  theme(obj)
 *  getImageUrl(context, image)
 *  getCssClass(context, cssClass)
 *
 *
 */
factory('themeService', ['$rootScope', function($rootScope) {

    var service = {};

    /**
     * Service initialization
     */
    function init()
    {
        service.currentTheme = 'default';
        service.allThemes    =
            [
                'default',
                'modern',
                'clean',
                'future'
            ];
    }

    /**
     * Theme the given object
     *
     * Looks for specific fields in the object and converts them to their themed versions
     *
     *  icon:     replaced by getImageUrl
     *  image:    replaced by getImageUrl
     *  cssClass: replaced by getCssClass
     *
     *  Additionally, if obj is an array, then it will be recursively iterated over
     *
     *  if nestField is specified, then the nested field will be iterated over recursively
     *  as an array.
     */
    service.theme = function(obj, nestField)
    {
        if (_.isArray(obj))
        {
            _.each(obj, function(oneObj){
               service.theme(oneObj, nestField);
            });
        }
        else if (_.isObject(obj))
        {
            for (var field in obj)
            {
                if ( (field == 'icon') || (field == 'image') )
                {
                    var val = obj[field];

                    if ( (val) && (val.length) )
                    {
                        var splits = val.split('/');

                        if (splits.length == 2)
                        {
                            obj[field] = service.getImageUrl(splits[0], splits[1]);
                        }
                    }
                }
            }

            if ( (nestField) && (obj[nestField]) && (obj[nestField].length) )
            {
                _.each(obj[nestField], function(oneObj) {
                   service.theme(oneObj, nestField);
                });
            }
        }
    }

    /**
     * Find the location of the given image url
     *
     * @param context The image context (main-menu, frame, etc)
     * @param image The image name to locate (without extension)
     */
    service.getImageUrl = function(context, image)
    {
        var url =  'themes/' + service.currentTheme + '/' + context + '/' + image;

        if (image.indexOf('.') == -1)
        {
            url += '.png';
        }

        return url;
    }

    /**
     * Find the appropriate themed class for the given class/context
     *
     * @param context The image context (main-menu, frame, etc)
     * @param cssClas The css class to locate
     */
    service.getCssClass = function(context, cssClass)
    {
        return cssClass;
    }

    init();

    return service;

}]);
