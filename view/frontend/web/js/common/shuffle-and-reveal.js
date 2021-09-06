(function () {
    'use strict';

    /**
     * @param {Cash} elements
     */
    $.breeze.shuffleElements = function (elements) {
        var parent, child, lastSibling;

        if (elements.length) {
            parent = $(elements[0]).parent();
        }

        while (elements.length) {
            child = elements.splice(Math.floor(Math.random() *  elements.length), 1)[0];
            lastSibling = parent.find('[data-shuffle-group="' + $(child).data('shuffle-group') + '"]').last();
            lastSibling.after(child);
        }
    };

    /**
     * @param {Cash} elements
     * @param {Number} limit
     */
    $.breeze.revealElements = function (elements, limit) {
        limit = limit || elements.length;

        // Let's wait for the first feedback about not working `shuffle-group` logic

        return elements.slice(0, limit).show();
    };
})();
