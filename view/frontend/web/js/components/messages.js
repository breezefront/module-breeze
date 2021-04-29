/* global _ */
(function () {
    'use strict';

    $.view('messages', {
        /** Init component */
        create: function () {
            this.cookieMessages = _.unique($.cookies.getJson('mage-messages') || [], 'text');
            this.messages = $.sections.get('messages');
            this.removeCookieMessages();
        },

        /** Remove mage-messages cookie */
        removeCookieMessages: function () {
            $.cookies.remove('mage-messages', {
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
        var cookieMessages = $.cookies.getJson('mage-messages') || [],
            messages = _.get(data, 'response.messages'.split('.'), {});

        $.view('messages').invoke('removeCookieMessages');

        messages.messages = messages.messages || [];
        messages.messages = messages.messages.concat(cookieMessages);
        $.sections.set('messages', messages);
    });

    $(document).on('breeze:mount:Magento_Theme/js/view/messages', function (event, data) {
        $(data.el).messages(data.settings);
    });
})();
