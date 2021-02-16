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
            this.element = element;
            this.options = $.extend({}, this.options, options || {});

            if (this.init) {
                this.init();
            }

            return this;
        }
    };

    window.breeze.widget = window.breeze.component(WidgetModel);
})();
