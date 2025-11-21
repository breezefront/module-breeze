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

    $.breeze.isDebugMode = () => {
        return location.search.includes('breeze=1')
            || location.hash.includes('breeze')
            || $.storage.get('breeze_debug');
    };
    $.breeze.isCompatMode = () => !!$('script[src*="/requirejs-config"]').length;
    $.breeze.debug = message => {
        if ($.breeze.isDebugMode()) {
            console.debug(message);
        }
    };

    (() => {
        const state = {
            busy: false,
            promise: Promise.resolve(),
            resolve: null,
            timer: null,
        };

        $.breeze.busy = ms => {
            if (!state.busy) {
                state.busy = true;
                state.promise = new Promise(r => { state.resolve = r });
                state.timer = setTimeout($.breeze.done, ms);
            }
        };
        $.breeze.done = () => {
            if (state.busy) {
                state.busy = false;
                clearTimeout(state.timer);
                state.resolve?.();
            }
        };
        $.breeze.idle = () => state.promise;
    })();
})();
