/* global breeze */
(function () {
    'use strict';

    breeze.widget('collapsible', {
        options: {
            active: false,
            openedState: null,
            collapsible: true,
            header: '[data-role=title]',
            content: '[data-role=content]',
            trigger: '[data-role=trigger]',
            collateral: {
                element: null,
                openedState: null
            }
        },

        /** Mount widget on the element */
        create: function () {
            this.header = typeof this.options.header === 'object' ?
                this.options.header : this.element.find(this.options.header).first();
            this.trigger = typeof this.options.trigger === 'object' ?
                this.options.trigger : this.header.find(this.options.trigger).first();
            this.content = typeof this.options.content === 'object' ?
                this.options.content : this.header.next(this.options.content).first();

            if (!this.trigger.length) {
                this.trigger = this.header;
            }

            this.header.attr('role', 'tab');
            this.trigger.attr('data-trigger', true);
            this.element.attr('data-collapsible', true);
            this.element.attr('role', 'tablist');
            this.content.attr('role', 'tabpanel');

            if (this.options.active) {
                this.open();
            } else {
                this.close();
            }
        },

        /** Hide expanded widgets */
        destroy: function () {
            if (!this.options.active) {
                this.close();
            }
        },

        /** Open dropdown */
        open: function () {
            this.element.trigger('beforeOpen');

            if (this.options.openedState) {
                this.element.addClass(this.options.openedState);
            }

            if (this.options.collateral.element) {
                $(this.options.collateral.element).addClass(this.options.collateral.openedState);
            }

            this.header.attr({
                'aria-selected': true,
                'aria-expanded': true
            });
            this.content.attr({
                'aria-hidden': false
            });
            this.content.show();

            this.element.trigger('dimensionsChanged', {
                opened: true
            });
        },

        /** Close dropdown */
        close: function () {
            if (this.options.openedState) {
                this.element.removeClass(this.options.openedState);
            }

            if (this.options.collateral.element) {
                $(this.options.collateral.element).removeClass(this.options.collateral.openedState);
            }

            this.header.attr({
                'aria-selected': false,
                'aria-expanded': false
            });
            this.content.attr({
                'aria-hidden': true
            });
            this.content.hide();

            this.element.trigger('dimensionsChanged', {
                opened: false
            });
        },

        /** Toggle dropdown */
        toggle: function () {
            if (this.element.hasClass(this.options.openedState)) {
                if (this.options.collapsible) {
                    this.close();
                }
            } else {
                this.open();
            }
        }
    });

    document.addEventListener('breeze:mount:collapsible', function (event) {
        $(event.detail.el).collapsible(event.detail.settings);
    });

    $(document).on('click.collapsible', '[data-trigger]', function () {
        var instance = $(this).closest('[data-collapsible]').collapsible('instance');

        if (instance) {
            instance.toggle();

            return false;
        }
    });
})();
