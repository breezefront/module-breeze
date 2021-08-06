/* global _ ko */
(function () {
    'use strict';

    // Magento_Ui/js/view/messages
    $.view('uiMessages', {
        component: 'Magento_Ui/js/view/messages',
        defaults: {
            template: 'uiMessages'
        },

        create: function () {
            this.errorMessages = ko.observableArray([]);
            this.successMessages = ko.observableArray([]);
            this.messageContainer = this;
        },

        isVisible: function () {
            return this.hasMessages();
        },

        hasMessages: function () {
            return this.errorMessages().length > 0 || this.successMessages().length > 0;
        },

        removeAll: function () {
            this.errorMessages.removeAll();
            this.successMessages.removeAll();
        },

        addErrorMessage: function (message) {
            this.errorMessages.push(message);
        },

        addSuccessMessage: function (message) {
            this.successMessages.push(message);
        },

        getErrorMessages: function () {
            return this.errorMessages();
        },

        getSuccessMessages: function () {
            return this.successMessages();
        }
    });

    // Magento_Theme/js/view/messages
    $.view('messages', {
        component: 'Magento_Theme/js/view/messages',

        /** Init component */
        create: function () {
            var self = this;

            this.cookieMessages = _.unique($.cookies.getJson('mage-messages') || [], 'text');
            this.messages = $.sections.get('messages');

            // cleanup possible duplicates
            this.cookieMessages = _.reject(this.cookieMessages, function (cookieMessage) {
                return _.some(self.messages().messages, function (sectionMessage) {
                    return sectionMessage.text === cookieMessage.text;
                });
            });

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
            return message.replace(/\+/g, ' ');
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
})();
