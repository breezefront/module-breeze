define([
    'uiComponent',
    'Magento_Checkout/js/model/quote'
], function (Component, quote) {
    'use strict';

    if (!window.giftOptionsConfig) {
        return;
    }

    Component.extend({
        component: 'Magento_GiftMessage/js/view/gift-message',

        initialize: function () {
            var message = this.itemId
                ? window.giftOptionsConfig.giftMessage.itemLevel?.[this.itemId]?.message
                : window.giftOptionsConfig.giftMessage.orderLevel;

            this._super();
            this.index = this.__scope;
            this.itemId = this.itemId || 'orderLevel';

            this.observe({
                formBlockVisibility: false,
                resultBlockVisibility: false,
                alreadyAdded: _.isObject(message),
                recipient: message?.recipient || '',
                sender: message?.sender || '',
                message: message?.message || ''
            });

            this.isResultBlockVisible();
        },

        isResultBlockVisible: function () {
            if (this.alreadyAdded()) {
                this.resultBlockVisibility(true);
            }
        },

        getObservable: function (key) {
            return this[key];
        },

        toggleFormBlockVisibility: function () {
            if (!this.alreadyAdded()) {
                this.formBlockVisibility(!this.formBlockVisibility());
            } else {
                this.resultBlockVisibility(!this.resultBlockVisibility());
            }
        },

        editOptions: function () {
            this.resultBlockVisibility(false);
            this.formBlockVisibility(true);
        },

        hideFormBlock: function () {
            this.formBlockVisibility(false);

            if (this.alreadyAdded()) {
                this.resultBlockVisibility(true);
            }
        },

        hasActiveOptions: function () {
            return !!this.getRegion('additionalOptions')().find(option => option.isActive());
        },

        isActive: function () {
            var itemConfig = window.giftOptionsConfig.giftMessage.itemLevel[this.itemId] || {};

            if (this.itemId === 'orderLevel') {
                return window.giftOptionsConfig.isOrderLevelGiftOptionsEnabled;
            }

            return itemConfig.hasOwnProperty('is_available') ?
                itemConfig.is_available : window.giftOptionsConfig.isItemLevelGiftOptionsEnabled;
        },

        submitOptions: function () {
            this.send();
        },

        deleteOptions: function () {
            this.send(true);
        },

        send: function (remove) {
            var url;

            if (window.giftOptionsConfig.isCustomerLoggedIn) {
                url = this.itemId === 'orderLevel'
                    ? '/carts/mine/gift-message'
                    : `/carts/mine/gift-message/${this.itemId}`;
            } else {
                url = this.itemId === 'orderLevel'
                    ? `/guest-carts/${quote.getQuoteId()}/gift-message`
                    : `/guest-carts/${quote.getQuoteId()}/gift-message/${this.itemId}`;
            }

            $('body').spinner(true);

            return $.post({
                url: $.breeze.url.rest(url),
                global: false,
                data: {
                    gift_message: {
                        recipient: remove ? '' : this.recipient(),
                        sender: remove ? '' : this.sender(),
                        message: remove ? '' : this.message()
                    }
                },
                success: () => {
                    this.formBlockVisibility(false);
                    this.alreadyAdded(!remove);
                    this.resultBlockVisibility(!remove);

                    if (remove) {
                        this.recipient('');
                        this.sender('');
                        this.message('');
                    }

                    // window.location.href = $.breeze.url.build('checkout/cart/updatePost') +
                    //     '?form_key=' + window.checkoutConfig.formKey +
                    //     '&cart[]';
                },
                always: () => {
                    $('body').spinner(false);
                }
            });
        }
    });
});
