/* global breeze */
(function () {
    'use strict';

    breeze.widget('dropdown', {
        options: {
            parent: null,
            activeClass: 'active',
            dialog: false,
            menu: '[data-target="dropdown"]'
        },

        /** Init widget */
        create: function () {
            this.status = false;

            if (this.options.parent) {
                this.parent = $(this.options.parent);
            } else {
                this.parent = this.element.parent();
            }

            this.element.attr('data-dropdown', true);
            this.element.attr('aria-haspopup', true);
            this.parent.attr('data-trigger', true);
            this.parent.attr('data-dropdown-parent', true);

            this.close();
        },

        /** Hide expanded menu's, remove event listeneres */
        destroy: function () {
            this.close();
        },

        /** Open dropdown */
        open: function () {
            this.status = true;

            this.element.addClass(this.options.activeClass)
                .attr('aria-expanded', true);
            this.parent.addClass(this.options.activeClass)
                .find(this.options.menu)
                .attr('aria-hidden', false);
        },

        /** Close dropdown */
        close: function () {
            this.status = false;

            this.element.removeClass(this.options.activeClass)
                .attr('aria-expanded', false);
            this.parent.removeClass(this.options.activeClass)
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

    $(document).on('breeze:mount:dropdown', function (event, data) {
        $(data.el).dropdown(data.settings);
    });

    $(document).on('click.dropdown', function (event) {
        var dialog,
            dropdown = $(event.target).closest('[data-dropdown]').dropdown('instance'),
            status = dropdown && dropdown.status;

        if (!dropdown) {
            // Do not close dropdown when click inside its content
            dialog = $(event.target)
                .closest('[data-dropdown-parent]')
                .find('[data-dropdown]')
                .dropdown('instance');

            if (dialog && dialog.options.dialog) {
                return;
            }
        }

        window.breeze.widget('dropdown').invoke('close');

        if (dropdown) {
            if (!status) {
                dropdown.open();
            }

            return false;
        }
    });
})();
