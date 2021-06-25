(function () {
    'use strict';

    $.widget('redirectUrl', {
        component: 'redirectUrl',
        options: {
            event: 'click',
            url: undefined
        },

        /**
         * This method constructs a new widget.
         * @private
         */
        _create: function () {
            var handlers = {};

            handlers[this.options.event] = '_onEvent';

            this._on(handlers);
        },

        /**
         * This method set the url for the redirect.
         * @private
         */
        _onEvent: function () {
            if (this.options.url) {
                location.href = this.options.url;
            } else {
                location.href = this.element.val();
            }
        }
    });
})();
