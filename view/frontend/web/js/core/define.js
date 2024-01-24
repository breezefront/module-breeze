(function () {
    'use strict';

    $.breezemap = {
        'jquery': $,
        'ko': ko,
        'underscore': _,
        'mage/mage': $.mage,
        __counter: 1,
        __aliases: {},
        __get: key => $.breezemap[$.breezemap.__aliases[key] || key],
        __lastComponent: (offset = 0) => $.breezemap[`__component${$.breezemap.__counter - 1 - offset}`],
    };

    function register(value, key) {
        if (value === undefined || value instanceof Promise) {
            return value;
        }

        key = key || value?.component || `__component${$.breezemap.__counter++}`;

        if ($.breezemap[key] === undefined) {
            $.breezemap[key] = value;
        }

        return value;
    }

    function resolve(alias) {
        var result = $.breezemap.__get(alias);

        if (result !== undefined) {
            return result;
        }

        if (alias.indexOf('text!') === 0) {
            result = alias.substr(5).replace(/[/.]/g, '_');
            result = $('#' + result).html();
        } else if (alias.includes('//')) {
            result = $.loadScript(alias);
        } else if ($.breeze.jsconfig.map[alias]) {
            result = require('loadComponent')(alias);
        }

        return register(result, alias);
    }

    /**
     * @param {Array} deps
     * @param {Function} callback
     */
    window.require = function (deps, success, error) {
        var args = [];

        if (!_.isArray(deps)) {
            return resolve(deps);
        }

        deps.forEach(alias => {
            args.push(resolve(alias));
        });

        success = success || _.noop;

        // If there is a promise in arguments - wait for it.
        // Otherwise, execute it immediately.
        if (args.some(arg => arg && arg.then)) {
            Promise.all(args)
                .then(values => register(success.apply(this, values)))
                .catch(reason => {
                    if (error) {
                        error(reason);
                    } else {
                        throw reason;
                    }
                });
        } else {
            register(success.apply(this, args));
        }
    };

    window.define = window.requirejs = window.require;
    window.require.toUrl = (path) => window.VIEW_URL + '/' + path;
    window.require.config = _.noop;
})();
