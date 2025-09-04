define([
    'jquery',
    'underscore',
    'uiClass',
    'Magento_Customer/js/customer-data',
    'escaper'
], function ($, _, uiClass, customerData, escaper) {
    'use strict';

    $.breezemap['Magento_Ui/js/model/messages'] = uiClass.extend({
        initialize: function () {
            this._super().initObservable();
            return this;
        },

        initObservable: function () {
            this.errorMessages = ko.observableArray([]);
            this.successMessages = ko.observableArray([]);
            return this;
        },

        add: function (message, type) {
            this.clear();
            type.push(message.message || message);
            return true;
        },

        addSuccessMessage: function (message) {
            return this.add(message, this.successMessages);
        },

        addErrorMessage: function (message) {
            return this.add(message, this.errorMessages);
        },

        getErrorMessages: function () {
            return this.errorMessages;
        },

        getSuccessMessages: function () {
            return this.successMessages;
        },

        hasMessages: function () {
            return this.errorMessages().length || this.successMessages().length;
        },

        clear: function () {
            this.errorMessages.removeAll();
            this.successMessages.removeAll();
        }
    });

    $.breezemap['Magento_Ui/js/model/messageList'] = new $.breezemap['Magento_Ui/js/model/messages'];

    $.view('uiMessages', {
        component: 'Magento_Ui/js/view/messages',
        defaults: {
            template: 'uiMessages'
        },

        create: function () {
            this.messageContainer = this.options.messageContainer || $.breezemap['Magento_Ui/js/model/messageList'];
        },

        isVisible: function () {
            return this.messageContainer.hasMessages();
        },

        removeAll: function () {
            this.messageContainer.clear();
            return this;
        }
    });

    $.view('messages', {
        component: 'Magento_Theme/js/view/messages',
        defaults: {
            allowedTags: ['div', 'span', 'b', 'strong', 'i', 'em', 'u', 'a']
        },

        create: function () {
            this.observe({'cookieMessagesObservable': []});
            this.cookieMessages = _.unique($.cookies.getJson('mage-messages') || [], 'text');
            this.cookieMessagesObservable(this.cookieMessages);
            this.messages = customerData.get('messages').extend({
                disposableCustomerData: 'messages'
            });

            this.purgeMessages(); // call for magento < 2.4.7
            this.removeCookieMessages();
        },

        removeCookieMessages: function () {
            $.cookies.remove('mage-messages', {
                domain: ''
            });
        },

        prepareMessageForHtml: function (message) {
            return escaper.escapeHtml(message, this.allowedTags);
        },

        purgeMessages: function () {
            if (!_.isEmpty(this.messages().messages)) {
                customerData.set('messages', {});
            }
        },

        destroy: function () {
            $('.messages', this.element).remove();
            this._super();
        }
    });

    function removeMessage(el) {
        var messages = $(el).parent('.messages');

        $(el).remove();

        if (!messages.children().length) {
            messages.empty();
        }
    }

    // Appear effect when sticky position is used. See _messages.less
    $(document).on('breeze:load', () => {
        if (!$('body').hasClass('breeze-theme')) {
            return;
        }

        $.async('.message:where(.warning, .success, .notice, .error, .info)', (el) => {
            $(el).append('<button type="button" class="button-close"></button>');

            setTimeout(() => {
                $(el).addClass('shown');
            }, 0);

            $(el).on('animationend', (e) => {
                if (e.animationName === 'message-hide') {
                    removeMessage(el);
                }
            });
        });

        $(document).on('click', '.message > .button-close', function () {
            var message = $(this).closest('.message').removeClass('shown');

            setTimeout(() => {
                removeMessage(message);
            }, 100);
        });
    });
});
