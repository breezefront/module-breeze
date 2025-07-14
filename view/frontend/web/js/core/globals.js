(function () {
    'use strict';

    if (window.breeze && window.breeze._initialized) {
        return;
    }

    window.breeze = $.breeze = window.breeze || {};
    window.mage = $.mage = window.mage || {};

    $.breeze.loadedScripts = $.breeze.loadedScripts || {};
    $.breeze.jsconfig = $.breeze.jsconfig || {};
    $.breeze._initialized = true;

    $.breezemap = {
        'jquery': $,
        'underscore': _,
        'domReady!': true,
    };
})();
