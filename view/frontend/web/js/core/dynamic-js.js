(() => {
    'use strict';

    var promises = {},
        states = {},
        bundlePrefixRe = /(?<prefix>Swissup_Breeze\/bundles\/\d+\/).*\.js$/,
        bundlePrefix = $('script[src*="/Swissup_Breeze/bundles/"]').attr('src')
            ?.match(bundlePrefixRe).groups.prefix,
        suffixRe = /Swissup_Breeze\/.*?(core|main)(?<suffix>\.min\.js|\.js)$/,
        jsSuffix = $('script[src*="/Swissup_Breeze/"]')
            .filter((i, el) => el.src.includes('/core.') || el.src.includes('/main.'))
            .attr('src')
            .match(suffixRe).groups.suffix;

    $.breeze.jsconfig = {
        map: {},
        rules: {},
    };

    function getUrl(path) {
        if (path.includes('//')) {
            return path;
        }

        if (path.endsWith('.min')) {
            path += '.js';
        } else if (!path.endsWith('.min.js')) {
            path = path.replace(/\.js$/, '');
            path += jsSuffix;
        }
        return window.require.toUrl(path);
    }

    function loadScript(alias, aliasAsPath) {
        var path = aliasAsPath ? alias : $.breeze.jsconfig.map[alias] || alias,
            imports = $.breeze.jsconfig.rules[path]?.import || [],
            index = imports.indexOf(alias),
            [bundle, lastIndex] = path.split('*');

        if (!states[path]) {
            if (path.includes('*')) {
                lastIndex = parseInt(lastIndex, 10) || 0;
                bundle = bundlePrefix + bundle;
                path = bundle + (lastIndex || '');
                imports = imports.concat(_.range(0, lastIndex).map(i => bundle + (i || '')));
            }

            states[path] = new Promise(resolve => {
                Promise.all(imports.map((item, i) => loadScript(item, i === index))).then(() => {
                    $.loadScript(getUrl(path), () => {
                        resolve();
                    });
                });
            });
        }

        return states[path];
    }

    function processMatchedLoadRule(loadRules, path) {
        var callback = () => {
            loadScript(path).then(() => $(document).trigger('contentUpdated'));
        };

        if (loadRules.onInteraction) {
            $.lazy(callback);
        } else {
            callback();
        }
    }

    function processOnRevealRules(loadRules, path) {
        if (!loadRules?.onReveal) {
            return;
        }

        $.async(loadRules.onReveal.join(','), (el) => {
            $.onReveal(el, () => {
                if (states[path]) {
                    return;
                }

                processMatchedLoadRule(loadRules, path);
            }, {
                rootMargin: '120px',
            });
        });
    }

    function processOnEventRules(loadRules, path) {
        if (!loadRules?.onEvent) {
            return;
        }

        $.each(loadRules.onEvent, (i, eventAndSelector) => {
            var parts = eventAndSelector.split(' '),
                eventName = parts.shift(),
                selector = parts.join(' ');

            $(document).one(eventName, selector, () => {
                processMatchedLoadRule(loadRules, path);
            });
        });
    }

    try {
        $.breeze.jsconfig = JSON.parse($('[type="breeze/dynamic-js"]').text());
    } catch (e) {
        console.log(e);
    }

    $.each($.breeze.jsconfig.map, alias => {
        if (!/^[a-zA-Z_.]+$/.test(alias)) {
            return;
        }
        $.fn[alias] = function (settings) {
            require([alias], () => {
                if (!this[alias].__dynamic) {
                    this[alias](settings);
                }
            });
            return this;
        };
        $.fn[alias].__dynamic = true;
    });

    $(document).on('breeze:load', () => {
        $.each($.breeze.jsconfig.rules, (path, values) => {
            processOnRevealRules(values.load, path);
            processOnEventRules(values.load, path);
        });
    });

    $.breezemap.loadComponent = function (alias, respectLoadRules) {
        var path = $.breeze.jsconfig.map[alias] || alias,
            result = promises[alias],
            useMemo = true;

        if (!result) {
            result = new Promise(resolve => {
                if ($.breeze.jsconfig.rules[path]?.load && respectLoadRules) {
                    useMemo = false;
                }

                if ($.breeze.jsconfig.map[alias] &&
                    (!$.breeze.jsconfig.rules[path]?.load || !respectLoadRules)
                ) {
                    loadScript(alias).then(() => resolve($.breezemap.__get(alias)));
                } else {
                    resolve($.breezemap.__get(alias));
                }
            });

            if (useMemo) {
                promises[alias] = result;
            }
        }

        return result;
    };
})();
