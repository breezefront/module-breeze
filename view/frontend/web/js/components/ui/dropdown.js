(function () {
    'use strict';

    $.widget('dropdown', {
        component: 'dropdown',
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

            if (!this.element.is('a, button')) {
                this.element.attr('role', 'button');
                this.element.attr('tabindex', 0);
            }

            this.element.attr('data-dropdown', true);
            this.element.attr('aria-haspopup', true);
            this.parent.attr('data-trigger', true);
            this.parent.attr('data-dropdown-parent', true);

            this._on({
                keydown: function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggle();
                    }
                }.bind(this)
            });

            this._on(document, {
                keydown: function (e) {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        this.close();
                    }
                }.bind(this)
            });

            this.close();
        },

        /** Hide expanded menu's, remove event listeneres */
        destroy: function () {
            this.close();
            this._super();
        },

        /** Open dropdown */
        open: function () {
            this._trigger('beforeOpen');

            this.status = true;

            this.element.addClass(this.options.activeClass)
                .attr('aria-expanded', true);
            this.parent.addClass(this.options.activeClass)
                .find(this.options.menu)
                .attr('aria-hidden', false)
                .contstraint();
        },

        /** Close dropdown */
        close: function () {
            if (!this.status) {
                return;
            }

            this._trigger('beforeClose');

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

    $(document).on('click.dropdown', function (event) {
        var dialog,
            dropdown = $(event.target).closest('[data-dropdown]').dropdown('instance'),
            modalContext = $(event.target).closest('.modal-popup'),
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

        if (modalContext.length) {
            $.widget('dropdown').each(function (widget) {
                if (modalContext.has(widget.element.get(0)).length) {
                    widget.close();
                }
            });
        } else {
            $.widget('dropdown').invoke('close');
        }

        if (dropdown) {
            if (!status) {
                dropdown.open();
            }

            return false;
        }
    });
})();
