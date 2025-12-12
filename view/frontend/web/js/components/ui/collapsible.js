(function () {
    'use strict';

    $.widget('collapsible', {
        component: 'collapsible',
        options: {
            active: false,
            openedState: 'active',
            saveState: false,
            collapsible: true,
            header: '[data-role=title]',
            content: '[data-role=content]',
            trigger: '[data-role=trigger]',
            collateral: {
                element: null,
                openedState: null
            },
            ajaxUrlElement: '[data-ajax=true]',
            ajaxUrlAttribute: 'href',
            ajaxContent: false
        },

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

            this.header.removeAttr('aria-level');
            if (!this.header.attr('role')) {
                this.header.attr('role', 'button');
            }
            this.trigger.attr('data-trigger', true);
            this.trigger.attr('tabindex', 0);
            this.trigger.children('a').attr('tabindex', -1);
            this.element.attr('data-collapsible', true);
            this.processState();

            if (this.options.active) {
                this.open();
            } else {
                this.close();
            }

            this._on({
                'keydown [data-trigger]': function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggle();
                    }
                }.bind(this)
            });
        },

        init: function () {
            this.disabled = false;
            if (this.options.active) {
                this.open();
            }
        },

        processState: function () {
            var urlPath = window.location.pathname.replace(/\./g, ''),
                state;

            this.stateKey = encodeURIComponent(urlPath + this.element.attr('id'));

            if (!this.options.saveState || this.options.disabled) {
                return;
            }

            state = $.storage.get(this.stateKey);

            if (!state && state !== false) {
                $.storage.set(this.stateKey, this.options.active);
            } else {
                this.options.active = !!state;
            }
        },

        /** Hide expanded widgets */
        destroy: function () {
            if (this.options.openedState) {
                this.element.removeClass(this.options.openedState);
            }

            if (this.options.collateral.element && this.options.collateral.openedState) {
                $(this.options.collateral.element).removeClass(this.options.collateral.openedState);
            }

            this._super();
        },

        isActive: function () {
            return this.content.attr('aria-hidden') === 'false';
        },

        isEnabled: function () {
            return !this.disabled;
        },

        /** Checks if collapsible is behaved like dropdown (layered for one-column layout) */
        isDropdown: function () {
            return this.content.css('position') === 'absolute';
        },

        /** Disable click events */
        disable: function () {
            this.disabled = true;
        },

        /** Enable click events */
        enable: function () {
            this.disabled = false;
        },

        activate: function () {
            this.open();
        },

        /** Open dropdown */
        open: function () {
            this._trigger('beforeOpen');

            if (this.options.ajaxContent) {
                this.loadContent();
            }

            if (this.options.saveState) {
                $.storage.set(this.stateKey, true);
            }

            if (this.options.openedState) {
                this.element.addClass(this.options.openedState);
            }

            if (this.options.collateral.element) {
                $(this.options.collateral.element).addClass(this.options.collateral.openedState);
            }

            if (this.header.length && this.content.length) {
                this.header.attr({
                    'aria-expanded': true
                });
                this.content.attr({
                    'aria-hidden': false
                });
            }
            this.content.show();

            // constraint dropdown into the visible viewport
            if (this.isDropdown()) {
                this.content.contstraint();
            }

            this.element.trigger('dimensionsChanged', {
                opened: true
            });
        },

        deactivate: function () {
            this.close();
        },

        close: function () {
            if (this.options.saveState) {
                $.storage.set(this.stateKey, false);
            }

            if (this.content.css('position') !== 'absolute') {
                this.content.css('width', this.content.css('width'));
                setTimeout(() => {
                    this.content.css('width', '');
                }, 400);
            }

            if (this.options.openedState) {
                this.element.removeClass(this.options.openedState);
            }

            if (this.options.collateral.element) {
                $(this.options.collateral.element).removeClass(this.options.collateral.openedState);
            }

            if (this.header.length && this.content.length) {
                this.header.attr({
                    'aria-expanded': false
                });
                this.content.attr({
                    'aria-hidden': true
                });
            }
            this.content.hide();

            this.element.trigger('dimensionsChanged', {
                opened: false
            });
        },

        toggle: function () {
            if (this.element.hasClass(this.options.openedState)) {
                if (this.options.collapsible) {
                    this.close();
                }
            } else {
                this.open();
            }
        },

        _loadContent: function () {
            return this.loadContent();
        },

        loadContent: function () {
            var url = this.element.find(this.options.ajaxUrlElement).attr(this.options.ajaxUrlAttribute),
                self = this;

            if (!url || this.element.data('loaded')) {
                return;
            }

            self._trigger('beforeLoad');

            if (self.options.loadingClass) {
                self.element.addClass(self.options.loadingClass);
            }
            self.content.spinner(true);
            self.content.attr('aria-busy', 'true');

            $.request.get({
                url: url,
                type: 'html',
                success: function (data) {
                    self.element.data('loaded', true);
                    self.content.empty().append(data).trigger('contentUpdated');
                },
                complete: function () {
                    self.element.removeClass(self.options.loadingClass);
                    self.content.spinner(false);
                    self.content.removeAttr('aria-busy');
                    self._trigger('afterLoad');
                }
            });
        }
    });

    $.breezemap['mage/collapsible'] = $.breezemap['collapsible'];

    $(document).on('click.collapsible', function (event) {
        var instance = $(event.target).closest('[data-trigger]').closest('[data-collapsible]').collapsible('instance'),
            tmpInstance;

        if (!instance) {
            // Do not close collapsible when click inside its content
            tmpInstance = $(event.target)
                .closest('[data-collapsible]')
                .collapsible('instance');

            if (tmpInstance && tmpInstance.options.dialog) {
                return;
            }
        }

        $.widget('collapsible').each(function (widget) {
            if (widget === instance) {
                return;
            }

            if (widget.isDropdown() && widget.isEnabled()) {
                widget.close();
            }
        });

        if (!instance || !instance.isEnabled()) {
            return;
        }

        instance.toggle();

        return false;
    });
})();
