/* global breeze _ */
(function () {
    'use strict';

    breeze.view('messages', {
        /** Init component */
        init: function () {
            var json = breeze.cookies.get('mage-messages');

            this.cookieMessages = json ? _.unique(JSON.parse(json), 'text') : [];
            this.messages = breeze.sectionData.get('messages');

            if (!_.isEmpty(this.messages().messages)) {
                breeze.sectionData.set('messages', {});
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
