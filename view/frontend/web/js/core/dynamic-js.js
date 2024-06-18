(() => {
    'use strict';

    var promises = {},
        debouncedContentUpdated = _.debounce(() => $(document).trigger('contentUpdated'), 40),
        jsBundles = JSON.parse($('[type="breeze/dynamic-js"]').text());

    function processMatchedLoadRule(loadRules, alias) {
        var callback = () => {
            require([alias], debouncedContentUpdated);
        };

        if (loadRules.onInteraction) {
            $.lazy(callback);
        } else {
            callback();
        }
    }

    function processOnRevealRules(loadRules, alias) {
        if (!loadRules?.onReveal) {
            return;
        }

        $.async(loadRules.onReveal.join(','), (el) => {
            $.onReveal(el, () => processMatchedLoadRule(loadRules, alias), {
                rootMargin: '120px',
            });
        });
    }

    function processOnEventRules(loadRules, alias) {
        if (!loadRules?.onEvent) {
            return;
        }

        $.each(loadRules.onEvent, (i, eventAndSelector) => {
            var parts = eventAndSelector.split(' '),
                eventName = parts.shift(),
                selector = parts.join(' ');

            $(document).one(eventName, selector, () => {
                processMatchedLoadRule(loadRules, alias);
            });
        });
    }

    function processOnDomRules(loadRules, alias) {
        if (!loadRules?.onDom) {
            return;
        }

        $.async(loadRules.onDom.join(','), () => {
            processMatchedLoadRule(loadRules, alias);
        });
    }

    try {
        $.each(jsBundles, (bundle, items) => {
            $.each(items, (alias, values) => {
                if (values.ref) {
                    $.breeze.jsconfig[alias] = items[values.ref];
                    $.breeze.jsconfig[alias].ref = values.ref;
                } else {
                    $.breeze.jsconfig[alias] = values;
                }
                $.breeze.jsconfig[alias].bundle = bundle;

                if (values.global) {
                    require.config({
                        shim: {
                            [alias]: {
                                exports: values.global
                            }
                        }
                    });
                }
            });
        });
        $.each($.breeze.jsconfig, (alias, values) => {
            (values.import || []).forEach(path => {
                if (!$.breeze.jsconfig[path]) {
                    $.breeze.jsconfig[path] = {
                        path,
                        bundle: values.bundle
                    };
                }
            });
        });
    } catch (e) {
        console.log(e);
    }

    $(document).on('breeze:load', () => {
        $.each($.breeze.jsconfig, (alias, values) => {
            processOnRevealRules(values.load, alias);
            processOnEventRules(values.load, alias);
            processOnDomRules(values.load, alias);
        });
    });

    $(document).on('bundle:load', (event, bundle) => {
        require(
            Object.entries(jsBundles[bundle] || {})
                .filter(([, values]) => !values.load)
                .map(([alias]) => alias)
        );
    });

    $(document).on('bundle:autoload', (event, bundle) => {
        require(
            Object.entries(jsBundles[bundle] || {})
                .filter(([, values]) => values.autoload && !values.load)
                .map(([alias]) => alias)
        );
    });

    $.breezemap.loadComponent = function (alias, respectLoadRules) {
        var result = promises[alias],
            useMemo = true;

        if (!result) {
            result = new Promise(resolve => {
                var callback = () => require([alias], () => resolve($.breezemap.__get(alias))),
                    loadRules = $.breeze.jsconfig[alias]?.load || {},
                    hasLoadRules = !_.isEmpty(_.pick(loadRules, 'onReveal', 'onEvent', 'onDom'));

                if (hasLoadRules && respectLoadRules) {
                    useMemo = false;
                }

                if ($.breeze.jsconfig[alias] && (!hasLoadRules || !respectLoadRules)) {
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

    // dynamic widgets
    $.each($.breeze.jsconfig, alias => {
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
})();
