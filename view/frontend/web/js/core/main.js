/* global ko _ */
(function () {
    'use strict';

    var scripts = {};

    /** Init 'data-mage-init' and 'text/x-magento-init' scripts */
    function mount(component, data) {
        /** Callback to run while browser is resting */
        function callback() {
            $(document).trigger('breeze:mount:' + component, data);
        }

        if (window.requestIdleCallback) {
            window.requestIdleCallback(callback);
        } else {
            window.setTimeout(callback, 1);
        }
    }

    window.breeze = window.breeze || {};
    window.breeze.mount = mount;

    /** Init view components */
    function mountView(scope, config) {
        var elements =  $('[data-bind*="scope:"]').filter(function () {
            return $(this).attr('data-bind').indexOf('\'' + scope + '\'') !== -1;
        });

        if (!elements.length) {
            elements = $([false]);
        }

        elements.each(function () {
            mount(config.component, {
                settings: config,
                el: this
            });
        });
    }

    /** Process 'data-mage-init' and 'text/x-magento-init' scripts */
    function processElement(el) {
        var isScript = el.tagName === 'SCRIPT',
            settings = isScript ? el.textContent : el.dataset.mageInit;

        $(el).data('breeze-processed', true);

        if (isScript) {
            // Move script to the bottom so it will not break :nth-child, and ~ selectors
            // and still will be accessible for reinitialization when using turbo cache.
            $('.breeze-container').append(el);
            el = false;
        }

        try {
            settings = JSON.parse(settings);
        } catch (e) {
            console.error(e);
        }

        $.each(settings, function (component, config) {
            var selector = false;

            if (isScript) {
                el = false;

                if (component !== '*') {
                    el = $('html').find(component);
                    selector = component;

                    // eslint-disable-next-line max-depth
                    if (!el.length) {
                        return;
                    }
                }

                component = Object.keys(config);
                config = Object.values(config);
            } else {
                component = [component];
                config = [config];
            }

            $.each(component, function (i, name) {
                if (name === 'Magento_Ui/js/core/app') {
                    if (!config[i].components) {
                        return;
                    }

                    // eslint-disable-next-line max-nested-callbacks
                    $.each(config[i].components, function (scope, cfg) {
                        cfg.__scope = scope;
                        mountView(scope, cfg);
                    });
                } else {
                    if (selector) {
                        config[i].__selector = selector;
                    }

                    mount(name, {
                        settings: config[i],
                        el: el
                    });
                }
            });
        });
    }

    /** Extract json by key from dataBind string */
    function extractJsonFromDataBind(key, dataBind) {
        var json = {},
            bindings = ko.expressionRewriting.parseObjectLiteral(dataBind);

        /** Parse mageInit binding from data-bind string */
        function parseJson(string) {
            var parsed = {},
                literal = ko.expressionRewriting.parseObjectLiteral(string);

            if (literal[0].unknown) {
                if (literal[0].unknown.indexOf &&
                    (literal[0].unknown.indexOf('[') === 0 ||
                     literal[0].unknown.indexOf('function') > -1)
                ) {
                    throw 'Unable to parse complex literal';
                }

                return literal[0].unknown;
            }

            $.each(literal, function (i, object) {
                parsed[object.key] = parseJson(object.value);
            });

            return parsed;
        }

        $.each(bindings, function (i, binding) {
            if (binding.key !== 'mageInit') {
                return;
            }

            json = parseJson(binding.value);

            return false;
        });

        return json;
    }

    /** Update data-mage-init attribute for all matches elements based on data-bind value */
    function convertDataBindToDataMageInit(el) {
        var json;

        if ($(el).closest('[data-bind*="scope:"]').length) {
            return;
        }

        try {
            json = extractJsonFromDataBind('mageInit', $(el).data('bind'))
        } catch (e) {
            return;
        }

        $(el).attr(
            'data-mage-init',
            JSON.stringify($.extend($(el).data('mage-init') || {}, json))
        );
    }

    /** Convert data-mage-init-lazy attributes */
    function convertLazyInitToDataMageInit(el) {
        $(el).attr('data-mage-init', $(el).attr('data-mage-init-lazy'));
    }

    /** Get event name to listen */
    function loadEventName() {
        var name = 'DOMContentLoaded';

        if (typeof Turbo !== 'undefined' || typeof Turbolinks !== 'undefined') {
            name = 'turbo:load turbolinks:load';
        }

        return name;
    }

    /**
     * @param {Element} node
     */
    function walk(node) {
        node = node || document;

        node.querySelectorAll('[data-bind*="mageInit:"]')
            .forEach(convertDataBindToDataMageInit);

        node.querySelectorAll('[data-mage-init-lazy]')
            .forEach(convertLazyInitToDataMageInit);

        $(node).find('[data-mage-init],[type="text/x-magento-init"]')
            .not('[data-breeze-processed]')
            .each(function () {
                processElement(this);
            });
    }

    /** [onBreezeLoad description] */
    function onBreezeLoad() {
        $(document).trigger('breeze:load');

        walk(document);

        $('script[src]').each(function () {
            scripts[this.src] = true;
        });
    }

    $(document).on(loadEventName(), function () {
        var newScripts = _.isEmpty(scripts) ? [] : $('script[src]').filter(function () {
                return !scripts[this.src];
            }),
            spinnerTimeout,
            i = 0;

        // destroy all widgets and views
        window.breeze.registry.delete();

        if (!newScripts.length) {
            return onBreezeLoad();
        }

        // wait for dynamic scripts when turbo is used (fixes product page/account scripts)
        spinnerTimeout = setTimeout(function () {
            $('body').spinner(true);
        }, 200);

        /** [onScriptLoad description] */
        function onScriptLoad() {
            if (++i < newScripts.length) {
                return;
            }

            clearTimeout(spinnerTimeout);
            $('body').spinner(false);
            onBreezeLoad();
        }

        newScripts.each(function () {
            if (this.async) {
                return onScriptLoad();
            }

            $(this).on('load error', onScriptLoad);
        });
    });

    $(document).on('contentUpdated', function (event) {
        walk(event.target);
    });

    $(window).on('resize', _.debounce(function () {
        $('body').trigger('breeze:resize');
    }, 100));

    window.breeze.referrer = document.referrer;
})();
