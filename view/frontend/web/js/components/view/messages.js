/* global breeze _ */
(function () {
    'use strict';

    breeze.view('messages', {
        /** Init component */
        init: function () {
            this.cookieMessages = _.unique(breeze.cookies.getJson('mage-messages') || [], 'text');
            this.messages = breeze.sections.get('messages');

            breeze.cookies.remove('mage-messages', {
                domain: ''
            });
        },

        /**
         * @param {String} message
         * @return {String}
         */
        prepareMessageForHtml: function (message) {
            return message;
        },

        /** Hide all messages */
        destroy: function () {
            $('.messages', this.element).remove();
            this.messages([]);
        }
    });

    document.addEventListener('breeze:mount:Magento_Theme/js/view/messages', function (event) {
        $(event.detail.el).messages(event.detail.settings);
    });
})();
