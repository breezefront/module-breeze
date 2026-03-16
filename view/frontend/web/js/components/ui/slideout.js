define([
    'jquery'
], function ($) {
    'use strict';

    $.widget('slideout', {
        options: {
            overlay: true,
            focusTrap: true,
            closeButton: true,
        },

        create: function () {
            $(this.options.trigger).attr('tabindex', 0);

            this._on(this.options.trigger, {
                click: this.toggle,
                keydown: e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.toggle();
                    } else if (e.key === 'Escape') {
                        this.close();
                    }
                }
            });

            this._on(document, {
                'click .slideout-close': 'close',
                'click .slideout-overlay': 'close',
                keydown: e => {
                    if (e.key === 'Escape' && this.el.hasClass('active')) {
                        this.close();
                    }
                }
            });
        },

        destroy: function () {
            this.close();
            this.overlay?.remove();
            this.closeButton?.remove();
            this._super();
        },

        toggle: function (flag) {
            if (flag === false || this.el.hasClass('active')) {
                this.close();
            } else {
                this.open();
            }
        },

        open: function () {
            if (this.options.focusTrap && !this.focusTrap) {
                this.focusTrap = this.createFocusTrap(this.el, {
                    initialFocus: false
                });
            }
            if (this.options.overlay && !this.overlay) {
                this.overlay = $('<div class="slideout-overlay"></div>').insertAfter(this.el);
            }
            if (this.options.closeButton && !this.closeButton) {
                this.closeButton = $(`
                    <button class="slideout-close button-close" aria-label="${$t('Close')}"></button>
                `).appendTo(this.el);
            }

            this._trigger('beforeOpen');
            this.focusTrap && $.breeze.scrollbar.hide();
            this.el.addClass('active');
            setTimeout(() => {
                this.focusTrap?.activate();
                this._trigger('afterOpen');
            }, 300); // wait till css animation is over
        },

        close: function () {
            this._trigger('beforeClose');
            this.focusTrap?.deactivate();
            this.el.removeClass('active');
            setTimeout(() => {
                this.focusTrap && $.breeze.scrollbar.reset();
                this._trigger('afterClose');
            }, 300); // wait till css animation is over
        }
    });
});
