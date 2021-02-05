/* global breeze */
(function () {
    'use strict';

    breeze.widget('dropdown', {
        options: {
            active: 'active',
            menu: '[data-target="dropdown"]'
        },

        /** Init widget */
        init: function () {
            this.status = false;
            this.parent = this.element.parentNode;

            $(this.element).attr('data-dropdown', true);
            $(this.element).attr('aria-haspopup', true);
            $(this.parent).attr('data-trigger', true);

            this.close();
        },

        /** Hide expanded menu's, remove event listeneres */
        destroy: function () {
            this.close();
        },

        /** Open dropdown */
        open: function () {
            this.status = true;

            $(this.element).addClass(this.options.active)
                .attr('aria-expanded', true);
            $(this.parent).addClass(this.options.active)
                .find(this.options.menu)
                .attr('aria-hidden', false);
        },

        /** Close dropdown */
        close: function () {
            this.status = false;

            $(this.element).removeClass(this.options.active)
                .attr('aria-expanded', false);
            $(this.parent).removeClass(this.options.active)
                .find(this.options.menu)
                .attr('aria-hidden', true);
        },

        /** Toggle dropdown */
        toggle: function () {
            if (this.status) {
                this.close();
            } else {
                this.open();
            }
        }
    });

    document.addEventListener('breeze:mount:dropdown', function (event) {
        $(event.detail.el).dropdown(event.detail.settings);
    });

    $(document).on('click.dropdown', function (event) {
        var dropdown = $(event.target).closest('[data-dropdown]').dropdown('instance'),
            status = dropdown && dropdown.status;

        window.breeze.widget('dropdown').invoke('close');

        if (dropdown) {
            if (!status) {
                dropdown.open();
            }

            event.stopPropagation();
        }
    });
})();
