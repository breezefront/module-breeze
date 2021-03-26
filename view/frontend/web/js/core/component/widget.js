(function () {
    'use strict';

    var WidgetModel;

    window.breeze = window.breeze || {};

    /** Base class */
    WidgetModel = function (prototype, settings, el) {
        var result = Object.create(WidgetModel.prototype);

        Object.assign(result, prototype);

        result.initialize.apply(result, [settings, el]);

        return result;
    };

    WidgetModel.prototype = {
        /**
         * @param {Object} options
         * @param {Element} element
         * @return {WidgetModel}
         */
        initialize: function (options, element) {
            this.element = $(element);
            this.option(options);
            this.create();
            this.init();

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
            if (typeof options === 'string') {
                this.options = options;
            } else {
                this.options = $.extend(true, {}, this.options || {}, options || {});
            }

            return this;
        }
    };

    window.breeze.widget = window.breeze.component(window.breeze.factory(WidgetModel, false));
})();
