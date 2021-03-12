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
            this.options = $.extend(true, {}, this.options, options || {});

            if (this.init) {
                this.init();
            }

            if (!ko.dataFor(element)) {
                ko.applyBindings(this, element);
            }

            return this;
        }
    };

    window.breeze.view = window.breeze.component(ViewModel);
})();
