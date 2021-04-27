(function () {
    'use strict';

    var link = $('<link type="text/css" rel="stylesheet">');

    link.attr('href', require.baseUrl + '/js/lib/lite-yt-embed.css');

    $('head').append(link);
})();
