/* global ko */
ko.bindingHandlers.blockLoader = {
    /**
     * Process loader for block
     * @param {String} element
     * @param {Boolean} displayBlockLoader
     */
    update: function (element, displayBlockLoader) {
        'use strict';

        if (ko.unwrap(displayBlockLoader())) {
            $(element).spinner(true);
        } else {
            $(element).spinner(false);
        }
    }
};

ko.bindingHandlers.i18n = {
    /**
     * @param {Object} element
     * @param {Function} value
     */
    update: function (element, value) {
        'use strict';

        $(element).text($.__(ko.unwrap(value() || '')));
    }
};

ko.bindingHandlers.mageInit = {
    /**
     * Initializes components assigned to HTML elements.
     *
     * @param {HTMLElement} el
     * @param {Function} valueAccessor
     */
    init: function (el, valueAccessor) {
        'use strict';

        var data = valueAccessor();

        _.each(data, function (config, component) {
            window.breeze.mount(component, {
                settings: config,
                el: el
            });
        });
    }
};
