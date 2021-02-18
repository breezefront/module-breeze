/* global breeze _ */
(function () {
    'use strict';

    breeze.view('messages', {
        /** Init component */
        init: function () {
            this.cookieMessages = _.unique(breeze.cookies.getJson('mage-messages') || [], 'text');
            this.messages = breeze.sections.get('messages');

            if (!_.isEmpty(this.messages().messages)) {
                breeze.sections.set('messages', {});
            }

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
        }
    });

    document.addEventListener('breeze:mount:Magento_Theme/js/view/messages', function (event) {
        $(event.detail.el).messages(event.detail.settings);
    });
})();
