(function () {
    'use strict';

    $.widget('redirectUrl', {
        component: 'redirectUrl',
        options: {
            event: 'click',
            url: undefined
        },

        _create: function () {
            var handlers = {};

            handlers[this.options.event] = '_onEvent';

            this._on(handlers);
        },

        _onEvent: function () {
            $.breeze.visit(this.options.url || this.element.val());
        }
    });
})();
