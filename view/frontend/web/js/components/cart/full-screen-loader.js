define([
    'jquery'
], function ($) {
    'use strict';

    return {
        startLoader: function () {
            $('body').spinner(true);
        },

        stopLoader: function () {
            $('body').spinner(false);
        }
    };
});
