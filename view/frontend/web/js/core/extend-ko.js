/* global ko */
ko.bindingHandlers.blockLoader = {
    /**
     * Process loader for block
     * @param {String} element
     * @param {Boolean} displayBlockLoader
     */
    update: function (element, displayBlockLoader) {
        'use strict';

        element = $(element);

        if (ko.unwrap(displayBlockLoader())) {
            $.fn.blockLoader().show(element);
        } else {
            $.fn.blockLoader().hide(element);
        }
    }
};
