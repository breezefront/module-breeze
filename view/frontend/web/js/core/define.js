(function () {
    'use strict';

    var suffixRe = /Swissup_Breeze\/.*?(core|main)(?<suffix>\.min\.js|\.js)$/,
        jsSuffix = $('script[src*="/Swissup_Breeze/"]')
            .filter((i, el) => el.src.includes('/core.') || el.src.includes('/main.'))
            .attr('src')
            .match(suffixRe).groups.suffix,
        config = {
            paths: {},
            shim: {},
        };

    $.breezemap = {
        'jquery': $,
        'ko': ko,
        'underscore': _,
        'mage/mage': $.mage,
        __counter: 1,
        __aliases: {},
        __get: key => $.breezemap[$.breezemap.__aliases[key] || key],
        __lastComponent: (offset = 0) => $.breezemap[`__component${$.breezemap.__counter - 1 - offset}`],
        __register: (name, oldName) => {
            if (!oldName || _.isNumber(oldName)) {
                $.breezemap[name] = $.breezemap.__lastComponent(oldName);
            } else {
                $.breezemap[name] = $.breezemap[oldName];
            }
        },
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
        } else if (config.paths[alias] || alias.includes('//')) {
            result = $.loadScript(config.paths[alias] || alias);
        } else if ($.breeze.jsconfig.map[alias]) {
            result = $.breezemap.loadComponent(alias);
        } else if (window.location.search.includes('breeze=1')) {
            console.log(alias);
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
                .then(values => {
                    for (const [index, value] of values.entries()) {
                        if (value === undefined && config.shim[deps[index]]?.exports) {
                            values[index] = window[config.shim[deps[index]].exports];
                        }
                    }

                    return register(success.apply(this, values));
                })
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
    window.require.toUrl = (path) => {
        if (path.includes('//')) {
            return path;
        }

        if (path.endsWith('.min')) {
            path += '.js';
        } else if (!path.endsWith('.min.js')) {
            path = path.replace(/\.js$/, '');
            path += jsSuffix;
        }

        return window.VIEW_URL + '/' + path;
    };
    window.require.config = (cfg) => $.extend(true, config, cfg || {});
})();
