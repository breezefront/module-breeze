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
            },
            ajaxUrlElement: '[data-ajax=true]',
            ajaxUrlAttribute: 'href',
            ajaxContent: false
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
            this.content.attr('role', 'tabpanel');

            if (this.header.parent().attr('role') !== 'presentation') {
                this.header.parent().attr('role', 'tablist');
            }

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

        /** [isActive description] */
        isActive: function () {
            return this.content.attr('aria-hidden') === 'false';
        },

        /** Open dropdown */
        open: function () {
            this.element.trigger('beforeOpen', {
                instance: this
            });

            if (this.options.ajaxContent) {
                this.loadContent();
            }

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
                instance: this,
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
        },

        /** @private */
        loadContent: function () {
            var url = this.element.find(this.options.ajaxUrlElement).attr(this.options.ajaxUrlAttribute),
                self = this;

            if (!url || this.element.data('loaded')) {
                return;
            }

            self.element.trigger('beforeLoad', {
                instance: self
            });

            if (self.options.loadingClass) {
                self.element.addClass(self.options.loadingClass);
            }
            self.content.attr('aria-busy', 'true');

            breeze.request.get({
                url: url,
                type: 'html',

                /** [success description] */
                success: function (response) {
                    self.element.data('loaded', true);
                    self.content.empty().append(response.text).trigger('contentUpdated');
                },

                /** [complete description] */
                complete: function () {
                    self.element.removeClass(self.options.loadingClass);
                    self.content.removeAttr('aria-busy');
                    self.element.trigger('afterLoad', {
                        instance: self
                    });
                }
            });
        }
    });

    $(document).on('breeze:mount:collapsible', function (event, data) {
        $(data.el).collapsible(data.settings);
    });

    $(document).on('click.collapsible', '[data-trigger]', function () {
        var instance = $(this).closest('[data-collapsible]').collapsible('instance');

        if (instance) {
            instance.toggle();

            return false;
        }
    });
})();
