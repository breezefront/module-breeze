(function () {
    'use strict';

    /**
     * @param {HTMLElement} el
     * @param {Array} data
     * @param {Object} breakpoints
     * @param {Object} currentViewport
     */
    function initializeWidget(el, data, breakpoints, currentViewport) {
        $.each(data, function (component, config) {
            config = config || {};
            config.breakpoints = breakpoints;
            config.currentViewport = currentViewport;
            $.breeze.mount(component, {
                el: el,
                settings: config
            });
        });
    }

    $(document).on('breeze:mount:Magento_PageBuilder/js/widget-initializer', function (event, data) {
        $.each(data.settings.config, function (selector, config) {
            // eslint-disable-next-line max-nested-callbacks
            $.async(selector, function (element) {
                element = $(element);

                if (data.el) {
                    // eslint-disable-next-line max-nested-callbacks
                    element = element.filter(function () {
                        return $(this).parents().has(this).length > 0;
                    });
                }

                if (element.length) {
                    initializeWidget(element, config, data.settings.breakpoints, data.settings.currentViewport);
                }
            });
        });
    });
})();
