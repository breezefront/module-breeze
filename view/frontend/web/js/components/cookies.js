/* global breeze Cookies */
(function () {
    'use strict';

    $(document).on('breeze:mount:mage/cookies', function (event) {
        breeze.cookies = Cookies.withAttributes(event.detail.settings);
    });
})();
