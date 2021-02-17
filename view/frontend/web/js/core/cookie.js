/* global Cookies */
(function () {
    'use strict';

    var defaults = {
            path: '/',
            domain: null,
            secure: true,
            expires: null,
            samesite: 'strict'
        },
        settings = window.cookiesConfig || {};

    if (settings.lifetime) {
        settings.expires = new Date();
        settings.expires = new Date(settings.expires.getTime() + settings.lifetime * 1000);
        delete settings.lifetime;
    }

    window.breeze.cookies = Cookies.withAttributes($.extend(defaults, settings));
})();
