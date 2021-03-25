/* global breeze _ */
(function () {
    'use strict';

    breeze.widget('toggleAdvanced', {
        options: {
            baseToggleClass: 'active',
            selectorsToggleClass: 'hidden',
            toggleContainers: null,
            newLabel: null,
            curLabel: null,
            currentLabelElement: null
        },

        /** Initialize plugin */
        create: function () {
            var self = this;

            this.options = $.extend(this.options, _.filter({
                baseToggleClass: $(this.element).data('base-toggle-class'),
                selectorsToggleClass: $(this.element).data('selectors-toggle-class'),
                toggleContainers: $(this.element).data('toggle-selectors')
            }, function (value) {
                return value;
            }));

            $(this.element).on('click', function (e) {
                e.preventDefault();
                self.toggle();
            });
        },

        /** Toggle dropdown */
        toggle: function () {
            $(this.element).toggleClass(this.options.baseToggleClass);

            if (this.options.toggleContainers) {
                $(this.options.toggleContainers).toggleClass(this.options.selectorsToggleClass);
            }
        }
    });

    $(document).on('breeze:mount:toggleAdvanced', function (event) {
        $(event.detail.el).toggleAdvanced(event.detail.settings);
    });
})();
