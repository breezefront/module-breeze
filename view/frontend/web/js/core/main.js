/* global ko */
(function () {
    'use strict';

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

    /** Init view components */
    function mountView(scope, config) {
        var elements =  $('[data-bind*="scope:"]').filter(function () {
            return $(this).attr('data-bind').indexOf('\'' + scope + '\'') !== -1;
        });

        if (elements.length) {
            elements.each(function () {
                mount(config.component, {
                    settings: config,
                    el: this
                });
            });
        } else {
            mount(config.component, {
                settings: config,
                el: false
            });
        }
    }

    /** Process 'data-mage-init' and 'text/x-magento-init' scripts */
    function processElement(el) {
        var isScript = el.tagName === 'SCRIPT',
            settings = isScript ? el.textContent : el.dataset.mageInit;

        if (isScript) {
            el = false;
        }

        try {
            settings = JSON.parse(settings);
        } catch (e) {
            console.error(e);
        }

        $.each(settings, function (component, config) {
            if (isScript) {
                el = false;

                if (component !== '*') {
                    el = $(component);

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
                    // eslint-disable-next-line max-nested-callbacks
                    $.each(config[i].components, function (scope, cfg) {
                        cfg.__scope = scope;
                        mountView(scope, cfg);
                    });
                } else {
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
        $(el).attr(
            'data-mage-init',
            JSON.stringify($.extend(
                $(el).data('mage-init') || {},
                extractJsonFromDataBind('mageInit', $(el).data('bind'))
            ))
        );
    }

    /** Get event name to listen */
    function eventName() {
        var name = 'DOMContentLoaded';

        if (typeof Turbo !== 'undefined') {
            name = 'turbo:load';
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

        node.querySelectorAll('[data-mage-init],[type="text/x-magento-init"]')
            .forEach(processElement);
    }

    $(document).on(eventName(), function (event) {
        // destroy all widgets and views if turbo cache is disabled
        window.breeze.registry.delete();

        document.dispatchEvent(new CustomEvent('breeze:load', {
            detail: event.detail ? event.detail : {
                url: window.location.href
            }
        }));

        walk(document);
    });

    $(document).on('contentUpdated', function (event) {
        walk(event.target);
    });

    $(document).on('turbo:before-cache', function () {
        // destroy all widgets and views
        window.breeze.registry.delete();
    });
})();
