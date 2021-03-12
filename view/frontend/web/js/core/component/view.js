/* global ko */
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

            if (!ko.dataFor(element)) {
                ko.applyBindings(this, element);
            }

            return this;
        },

        /** [create description] */
        create: function () {},

        /** [init description] */
        init: function () {},

        /**
         * @param {Object} options
         */
        option: function (options) {
            this.options = $.extend(true, {}, this.options, options || {});

            return this;
        }
    };

    window.breeze.view = window.breeze.component(ViewModel);
})();
