(function () {
    'use strict';

    $.widget('toggleAdvanced', {
        component: 'toggleAdvanced',
        options: {
            baseToggleClass: 'active',
            selectorsToggleClass: 'hidden',
            toggleContainers: null,
            newLabel: null,
            curLabel: null,
            currentLabelElement: null
        },

        create: function () {
            var self = this;

            this.options = $.extend(this.options, _.filter({
                baseToggleClass: this.element.data('base-toggle-class'),
                selectorsToggleClass: this.element.data('selectors-toggle-class'),
                toggleContainers: this.element.data('toggle-selectors')
            }, function (value) {
                return value;
            }));

            this.element.on('click', function (e) {
                e.preventDefault();
                self.toggle();
            });
        },

        toggle: function () {
            this.element.toggleClass(this.options.baseToggleClass);

            if (this.options.toggleContainers) {
                $(this.options.toggleContainers).toggleClass(this.options.selectorsToggleClass);
            }
        }
    });
})();
