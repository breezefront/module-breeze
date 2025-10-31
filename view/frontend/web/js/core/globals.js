(function () {
    'use strict';

    window.breeze = $.breeze = {};
    window.mage = $.mage = {};

    $.breeze.loadedScripts = {};
    $.breeze.jsconfig = {};

    $.breezemap = {
        'jquery': $,
        'underscore': _,
        'domReady!': true,
    };

    $.breeze.isDebugMode = () => location.search.includes('breeze=1') || location.hash.includes('breeze');
    $.breeze.isCompatMode = () => !!$('script[src*="/requirejs-config"]').length;
    $.breeze.debug = message => {
        if ($.breeze.isDebugMode()) {
            console.log(message);
        }
    };
})();
