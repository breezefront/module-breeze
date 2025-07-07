(() => {
    'use strict';

    var promises = {};

    function processMatchedLoadRule(loadRules, alias, callback) {
        callback = callback || (() => {
            require([alias], () => {
                $(document).trigger('contentUpdated');
            });
        });

        if (loadRules.onInteraction) {
            $.lazy(callback);
        } else {
            callback();
        }
    }

    function processOnRevealRules(loadRules, alias, callback) {
        if (!loadRules?.onReveal) {
            return;
        }

        setTimeout(() => {
            $.async(loadRules.onReveal.join(','), (el) => {
                $.onReveal(el, () => processMatchedLoadRule(loadRules, alias, callback), {
                    rootMargin: '120px',
                });
            });
        });
    }

    function processOnEventRules(loadRules, alias, callback) {
        if (!loadRules?.onEvent) {
            return;
        }

        $.each(loadRules.onEvent, (i, eventAndSelector) => {
            var parts = eventAndSelector.split(' '),
                eventName = parts.shift(),
                selector = parts.join(' ');

            $(document).one(eventName, selector, () => {
                processMatchedLoadRule(loadRules, alias, callback);
            });
        });
    }

    function processOnDomRules(loadRules, alias, callback) {
        if (!loadRules?.onDom) {
            return;
        }

        $.async(loadRules.onDom.join(','), () => {
            processMatchedLoadRule(loadRules, alias, callback);
        });
    }

    function processLoadRules(loadRules, alias, callback) {
        processOnRevealRules(loadRules, alias, callback);
        processOnEventRules(loadRules, alias, callback);
        processOnDomRules(loadRules, alias, callback);
    }

    $(document).on('breeze:load', () => {
        $.each($.breeze.jsconfig, (alias, values) => {
            processLoadRules(values.load, alias);
        });
    });

    $(document).on('bundle:load', (event, bundle) => {
        require(
            Object.entries($.breeze.jsbundles[bundle] || {})
                .filter(([, values]) => !values.load)
                .map(([alias]) => alias)
        );
    });

    $(document).on('bundle:autoload', (event, bundle) => {
        require(
            Object.entries($.breeze.jsbundles[bundle] || {})
                .filter(([, values]) => values.autoload && !values.load)
                .map(([alias]) => alias)
        );
    });

    $.breezemap.loadComponent = function (alias, respectLoadRules) {
        var result = promises[alias],
            useMemo = true;

        if (!result) {
            result = new Promise(resolve => {
                var callback = () => require([alias], () => {
                        resolve($.breezemap.__get(alias));
                    }),
                    loadRules = $.breeze.jsconfig[alias]?.load || {},
                    hasLoadRules = !_.isEmpty(_.pick(loadRules, 'onReveal', 'onEvent', 'onDom'));

                if (hasLoadRules && respectLoadRules) {
                    useMemo = false;
                }

                if (loadRules.onInteraction && (!hasLoadRules || !respectLoadRules)) {
                    $.lazy(callback);
                } else if (hasLoadRules && respectLoadRules) {
                    processLoadRules(loadRules, alias, callback);
                } else {
                    callback();
                }
            });

            if (useMemo) {
                promises[alias] = result;
            }
        }

        return result;
    };
})();
