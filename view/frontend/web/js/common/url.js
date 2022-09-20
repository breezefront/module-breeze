(function () {
    'use strict';

    var baseUrl = window.BASE_URL;

    $.breeze.url = {
        setBaseUrl: function (url) {
            baseUrl = url;
        },

        build: function (path) {
            if (path.indexOf(baseUrl) !== -1) {
                return path;
            }

            return baseUrl + path;
        }
    };

    $.breezemap['mage/url'] = $.breeze.url;
})();
