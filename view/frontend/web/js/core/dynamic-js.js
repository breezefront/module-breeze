(() => {
    'use strict';

    var promises = {},
        states = {},
        queue = [],
        componentNameRe = /\/[a-z]{2}_[A-Z]{2}\/(?<name>[a-zA-Z0-9]+_[a-zA-Z0-9]+\/.*?)(.min)?.js$/,
        bundlePrefixRe = /(?<prefix>Swissup_Breeze\/bundles\/\d+\/).*\.js$/,
        bundlePrefix = $('script[src*="/Swissup_Breeze/bundles/"]').attr('src')
            ?.match(bundlePrefixRe).groups.prefix;

    $.breeze.jsconfig = {
        map: {},
        rules: {},
    };

    function getUrl(path) {
        if (path.includes('//')) {
            return path.endsWith('.js') || path.endsWith('/') || path.includes('?') ? path : path + '.js';
        }

        return window.require.toUrl(path);
    }

    function collect(alias, aliasAsPath) {
        var result = [],
            path = aliasAsPath ? alias : $.breeze.jsconfig.map[alias] || alias,
            imports = $.breeze.jsconfig.rules[path]?.import || [],
            index = imports.indexOf(alias),
            [bundle, lastIndex] = path.split('*');

        if (path.includes('*')) {
            lastIndex = parseInt(lastIndex, 10) || 0;
            bundle = bundlePrefix + bundle;
            path = bundle + (lastIndex || '');
            imports = imports.concat(_.range(0, lastIndex).map(i => bundle + (i || '')));
        }

        imports.forEach((item, i) => {
            collect(item, i === index).forEach(dependency => {
                result.push(dependency);
            });
        });

        result.push(path);

        return result.map(getUrl);
    }

    function registerComponent(component) {
        var aliases = Object.entries($.breeze.jsconfig.map).map(([key, value]) => {
            return value === component ? key : false;
        });

        [component, ...aliases].filter(name => name).forEach(name => {
            if (!$.breezemap.__get(name)) {
                $.breezemap.__register(name);
            }
        });
    }

    function loadScript(alias, aliasAsPath) {
        var path = aliasAsPath ? alias : $.breeze.jsconfig.map[alias] || alias;

        if (states[path]) {
            return states[path];
        }

        queue.push(path);
        states[path] = new Promise(resolve => {
            var items = collect(alias);

            // Load js in parallel, execute in sequence
            Promise.all(items.map(item => $.preloadScript(item))).then(async function tryLoad() {
                var counter, match;

                if (queue[0] !== path) {
                    return setTimeout(tryLoad, 50);
                }

                for (const item of items) {
                    match = item.match(componentNameRe);
                    counter = $.breezemap.__counter;

                    await $.loadScript(item);

                    if (match && counter !== $.breezemap.__counter) {
                        registerComponent(match.groups.name);
                    }
                }

                if (counter !== $.breezemap.__counter) {
                    registerComponent(alias);
                }

                resolve();
                queue.shift();
            });
        });

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
                var callback = () => loadScript(alias).then(() => resolve($.breezemap.__get(alias))),
                    loadRules = $.breeze.jsconfig.rules[path]?.load || {},
                    hasLoadRules = !_.isEmpty(_.pick(loadRules, 'onReveal', 'onEvent'));

                if (hasLoadRules && respectLoadRules) {
                    useMemo = false;
                }

                if ($.breeze.jsconfig.map[alias] && (!hasLoadRules || !respectLoadRules)) {
                    if (loadRules.onInteraction) {
                        $.lazy(callback);
                    } else {
                        callback();
                    }
                } else {
                    resolve($.breezemap.__get(alias));
                }
            });

            if (useMemo) {
                promises[alias] = result;
                result.then(() => {
                    if (window.location.search.includes('breeze=1') &&
                        $.breezemap.__get(alias) === undefined
                    ) {
                        console.log(alias);
                    }
                });
            }
        }

        return result;
    };
})();
