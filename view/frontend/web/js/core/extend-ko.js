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
