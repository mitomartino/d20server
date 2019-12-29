angular.module('d20helper.filters.numeric', [])

    /**
     * filter: diskspace
     *
     * Displays numeric text as disk space Gb/Mb/Kb/bytes
     */
    .filter('diskspace', function()
    {
        var gig  = 1024 * 1024 * 1024;
        var meg  = 1024 * 1024;
        var kilo = 1024;

        return function(input)
        {
            var bytes = parseInt(input);

            if (bytes >= gig)
            {
                return (bytes / gig).toFixed(2) + ' Gb';
            }

            if (bytes >= meg)
            {
                return (bytes / meg).toFixed(2) + ' Mb';
            }

            if (bytes >= kilo)
            {
                return (bytes / kilo).toFixed(2) + ' Kb';
            }

            return bytes + ' bytes';
        }
    })

    /**
     * filter: hms
     *
     * Displays numeric text as hours / minutes/ seconds
     */
    .filter('hms', function()
    {
        var secondsInHour   = 60 * 60;
        var secondsInMinute = 60;

        return function(input)
        {
            var totalSeconds = parseInt(input);

            if (isNaN(totalSeconds))
            {
                return '';
            }

            var hours        = Math.floor(totalSeconds / secondsInHour);
            var remain       = totalSeconds - (hours * secondsInHour);
            var minutes      = Math.floor(remain / secondsInMinute);

            remain -= (minutes * secondsInMinute);

            var result = '';

            hours = hours % 24;

            if (hours < 10)
            {
                result += '0';
            }

            result += hours + ':'

            if (minutes < 10)
            {
                result += '0';
            }

            result += minutes + ':';

            if (remain < 10)
            {
                result += '0';
            }

            result += remain;

            return result;
        }
    });