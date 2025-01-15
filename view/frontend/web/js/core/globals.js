(function () {
    'use strict';

    window.breeze = $.breeze = {};
    window.mage = $.mage = {};

    $.breeze.loadedScripts = {};
    $.breeze.jsconfig = {};

    $.breezemap = {
        'jquery': $,
        'underscore': _,
        'mage/mage': $.mage,
    };
})();
