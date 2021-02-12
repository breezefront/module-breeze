/* global breeze Cookies */
(function () {
    'use strict';

    $(document).on('breeze:mount:mage/cookies', function (event) {
        breeze.cookies = Cookies.withAttributes($.extend({
            path: '/',
            domain: null,
            secure: false,
            expires: null,
            lifetime: null,
            samesite: 'strict'
        }, event.detail.settings));
    });
})();
