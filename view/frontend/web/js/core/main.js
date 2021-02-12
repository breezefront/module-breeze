(function () {
    'use strict';

    /** Init 'data-mage-init' and 'text/x-magento-init' scripts */
    function mount(component, config, el) {
        console.log('breeze:mount:' + component);

        document.dispatchEvent(new CustomEvent('breeze:mount:' + component, {
            detail: {
                el: el,
                settings: config
            }
        }));
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

            mount(component, config, el);
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
                var data = $(this).data('mage-init') || {};

                $.each(components, function (component, config) {
                    data[component] = config;
                });

                $(this).data('mage-init', data);
            });

            delete settings[selector];
        });

        script.textContent = JSON.stringify(settings);
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
        document.dispatchEvent(new CustomEvent('breeze:load', {
            detail: event.detail ? event.detail : {
                url: window.location.href
            }
        }));

        document
            .querySelectorAll('[type="text/x-magento-init"]')
            .forEach(convertScriptsToDataMageInit);

        document
            .querySelectorAll('[data-mage-init],[type="text/x-magento-init"]')
            .forEach(processElement);
    });

    document.addEventListener('turbo:before-cache', function () {
        window.breeze.widget().destroy();
    });
})();
