/* global ko _ */
(function () {
    'use strict';

    var ViewModel;

    window.breeze = window.breeze || {};

    /** Base class */
    ViewModel = function (prototype, settings, el) {
        var result = Object.create(ViewModel.prototype);

        Object.assign(result, prototype);

        result.initialize.apply(result, [settings, el]);

        return result;
    };

    ViewModel.prototype = {
        /**
         * @param {Object} options
         * @param {Element} element
         * @return {ViewModel}
         */
        initialize: function (options, element) {
            this.element = element;
            this.option(options);
            this.create();
            this.init();
            this.applyBindings(element);

            return this;
        },

        /** [applyBindings description] */
        applyBindings: function (element) {
            if (!ko.dataFor(element)) {
                ko.applyBindings(this, element);
            }
        },

        /** [create description] */
        create: function () {},

        /** [init description] */
        init: function () {},

        /**
         * @param {Object} options
         */
        option: function (options) {
            this.options = $.extend(true, {}, this.options || {}, options || {});
            this.options = $.extend(true, this.options, this.options.config || {});

            return this;
        },

        /**
         * @param {String} path
         * @return {Mixed}
         */
        path: function (path) {
            return _.get(this.options, path.split('/'));
        }
    };

    window.breeze.view = window.breeze.component(window.breeze.factory(ViewModel, true));
})();
