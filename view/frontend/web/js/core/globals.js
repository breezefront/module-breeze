(function () {
    'use strict';

    window.breeze = $.breeze = {};
    window.mage = $.mage = {};

    $.breeze.loadedScripts = {};
    $.breeze.jsconfig = {};

    $.breezemap = new Proxy({
        'jquery': $,
        'ko': ko,
        'knockout': ko,
        'underscore': _,
        'mage/mage': $.mage,
        __counter: 1,
        __aliases: {},
        __getAll: () => ({ ...$.breezemap }),
        __get: key => $.breezemap[key],
        __lastComponent: (offset = 0) => $.breezemap[`__component${$.breezemap.__counter - 1 - offset}`],
        __register: (name, oldName) => {
            if ($.breezemap[name]) {
                return;
            }

            if (!oldName || _.isNumber(oldName)) {
                $.breezemap[name] = $.breezemap.__lastComponent(oldName);
            } else {
                $.breezemap[name] = $.breezemap[oldName];
            }
        }
    }, {
        set(obj, alias, value) {
            obj[alias] = value;

            $(document).trigger('breeze:component:load', { alias, value });

            return true;
        }
    });
})();
