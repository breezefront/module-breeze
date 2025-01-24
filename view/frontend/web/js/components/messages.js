(function () {
    'use strict';

    $.view('uiMessages', {
        component: 'Magento_Ui/js/view/messages',
        defaults: {
            template: 'uiMessages'
        },

        create: function () {
            this.messageContainer = this.options.messageContainer || this;
            this.errorMessages = this.messageContainer.errorMessages || ko.observableArray([]);
            this.successMessages = this.messageContainer.successMessages || ko.observableArray([]);
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
            return this;
        },

        clear: function () {
            return this.removeAll();
        },

        add: function (message, type) {
            this.removeAll();
            type.push(message);
        },

        addErrorMessage: function (message) {
            this.add(message, this.errorMessages);
        },

        addSuccessMessage: function (message) {
            this.add(message, this.successMessages);
        },

        getErrorMessages: function () {
            return this.errorMessages();
        },

        getSuccessMessages: function () {
            return this.successMessages();
        }
    });

    $.view('messages', {
        component: 'Magento_Theme/js/view/messages',

        create: function () {
            this.observe({'cookieMessagesObservable': []});
            this.cookieMessages = _.unique($.cookies.getJson('mage-messages') || [], 'text');
            this.cookieMessagesObservable(this.cookieMessages);
            this.messages = $.customerData.get('messages').extend({
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

        /**
         * @param {String} message
         * @return {String}
         */
        prepareMessageForHtml: function (message) {
            return message.replace(/\+/g, ' ');
        },

        purgeMessages: function () {
            if (!_.isEmpty(this.messages().messages)) {
                $.customerData.set('messages', {});
            }
        },

        destroy: function () {
            $('.messages', this.element).remove();
            this._super();
        }
    });

    // Merge cookie messages (ajax compare) with json response messages
    $(document).on('customer-data-reload', function (event, data) {
        var cookieMessages = $.cookies.getJson('mage-messages') || [],
            messages = _.get(data, 'response.messages'.split('.'), {});

        $.view('messages').invoke('removeCookieMessages');

        messages.messages = messages.messages || [];
        messages.messages = messages.messages.concat(cookieMessages);
        $.customerData.set('messages', messages);
    });

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
                var messages = $(el).parent('.messages');

                if (e.animationName === 'message-hide') {
                    $(el).remove();
                    if (!messages.children().length) {
                        messages.empty();
                    }
                }
            });
        });

        $(document).on('click', '.message > .button-close', function () {
            var message = $(this).closest('.message').removeClass('shown');

            setTimeout(() => {
                $(message).remove();
            }, 100);
        });
    });
})();
