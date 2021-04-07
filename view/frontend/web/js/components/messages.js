/* global breeze _ */
(function () {
    'use strict';

    breeze.view('messages', {
        /** Init component */
        create: function () {
            this.cookieMessages = _.unique(breeze.cookies.getJson('mage-messages') || [], 'text');
            this.messages = breeze.sections.get('messages');
            this.removeCookieMessages();
        },

        /** Remove mage-messages cookie */
        removeCookieMessages: function () {
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

    // Merge cookie messages (ajax compare) with json response messages
    $(document).on('customer-data-reload', function (event, data) {
        var cookieMessages = breeze.cookies.getJson('mage-messages') || [],
            messages = _.get(data, 'response.messages'.split('.'), {});

        breeze.view('messages').invoke('removeCookieMessages');

        messages.messages = messages.messages || [];
        messages.messages = messages.messages.concat(cookieMessages);
        breeze.sections.set('messages', messages);
    });

    $(document).on('breeze:mount:Magento_Theme/js/view/messages', function (event, data) {
        $(data.el).messages(data.settings);
    });
})();
