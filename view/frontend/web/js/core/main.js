/* global ko */
(function () {
    'use strict';

    /** Init 'data-mage-init' and 'text/x-magento-init' scripts */
    function mount(component, details) {
        /** Callback to run while browser is resting */
        function callback() {
            console.log(component);
            document.dispatchEvent(new CustomEvent('breeze:mount:' + component, {
                detail: details
            }));
        }

        if (window.requestIdleCallback) {
            window.requestIdleCallback(callback);
        } else {
            window.setTimeout(callback, 1);
        }
    }

    /** Init view components */
    function mountView(scope, config) {
        $('[data-bind*="scope:"]')
            .filter(function () {
                return $(this).attr('data-bind').indexOf(scope) !== -1;
            })
            .each(function () {
                mount(config.component, {
                    settings: config,
                    el: this,
                    scope: scope
                });
            });
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
                component = Object.keys(config)[0];
                config = Object.values(config)[0];
            }

            if (component === 'Magento_Ui/js/core/app') {
                $.each(config.components, function (scope, cfg) {
                    mountView(scope, cfg);
                });
            } else {
                mount(component, {
                    settings: config,
                    el: el
                });
            }
        });
    }

    /** Create data-mage-init attributes for all matches elements based on script contents */
    function convertScriptsToDataMageInit(script) {
        var settings;

        try {
            settings = JSON.parse(script.textContent);
        } catch (e) {
            console.error(e);
        }

        $.each(settings, function (selector, components) {
            if (selector === '*') {
                return;
            }

            $(selector).each(function () {
                $(this).attr(
                    'data-mage-init',
                    JSON.stringify($.extend($(this).data('mage-init') || {}, components))
                );
            });

            delete settings[selector];
        });

        script.textContent = JSON.stringify(settings);
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

    document.addEventListener(eventName(), function (event) {
        // destroy all widgets and views if turbo cache is disabled
        window.breeze.registry.delete();

        document.dispatchEvent(new CustomEvent('breeze:load', {
            detail: event.detail ? event.detail : {
                url: window.location.href
            }
        }));

        document
            .querySelectorAll('[type="text/x-magento-init"]')
            .forEach(convertScriptsToDataMageInit);

        document
            .querySelectorAll('[data-bind*="mageInit:"]')
            .forEach(convertDataBindToDataMageInit);

        document
            .querySelectorAll('[data-mage-init],[type="text/x-magento-init"]')
            .forEach(processElement);
    });

    document.addEventListener('turbo:before-cache', function () {
        // destroy all widgets and views
        window.breeze.registry.delete();
    });
})();
