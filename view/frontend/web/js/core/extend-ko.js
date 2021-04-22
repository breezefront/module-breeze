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
