/* global ko */
window.breeze = window.breeze || {};
window.breeze.sectionData = (function () {
    'use strict';

    var data = {};

    return {
        /**
         * @param {String} name
         * @return {Function}
         */
        get: function (name) {
            if (!data[name]) {
                data[name] = ko.observable({});
            }

            return data[name];
        },

        /**
         * @param {String} name
         * @param {Object} section
         */
        set: function (name, section) {
            this.get(name)(section);
        }
    };
})();
