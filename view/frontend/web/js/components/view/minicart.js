/* global breeze ko _ */
(function () {
    'use strict';

    breeze.view('minicart', {
        cart: {},
        shoppingCartUrl: window.checkout.shoppingCartUrl,
        maxItemsToDisplay: window.checkout.maxItemsToDisplay,
        isLoading: ko.observable(false),

        /**
         * @override
         */
        init: function () {
            var cartData = breeze.sections.get('cart');

            this.update(cartData());

            cartData.subscribe(function (updatedCart) {
                this.update(updatedCart);
            }, this);
        },

        initSidebar: function () {
        },

        /**
         * Close mini shopping cart.
         */
        closeMinicart: function () {
            $('[data-block="minicart"]').find('[data-dropdown]').dropdown('close');
        },

        /**
         * @param {String} productType
         * @return {*|String}
         */
        getItemRenderer: function (productType) {
            return this.itemRenderer[productType] || 'defaultRenderer';
        },

        /**
         * Update mini shopping cart content.
         *
         * @param {Object} updatedCart
         * @returns void
         */
        update: function (updatedCart) {
            _.each(updatedCart, function (value, key) {
                if (!this.cart.hasOwnProperty(key)) {
                    this.cart[key] = ko.observable();
                }
                this.cart[key](value);
            }, this);
        },

        /**
         * Get cart param by name.
         *
         * @param {String} name
         * @returns {*}
         */
        getCartParamUnsanitizedHtml: function (name) {
            if (!_.isUndefined(name)) {
                if (!this.cart.hasOwnProperty(name)) {
                    this.cart[name] = ko.observable();
                }
            }

            return this.cart[name]();
        },

        /**
         * @deprecated please use getCartParamUnsanitizedHtml.
         * @param {String} name
         * @returns {*}
         */
        getCartParam: function (name) {
            return this.getCartParamUnsanitizedHtml(name);
        },

        /**
         * Returns array of cart items, limited by 'maxItemsToDisplay' setting
         * @returns []
         */
        getCartItems: function () {
            var items = this.getCartParamUnsanitizedHtml('items') || [];

            items = items.slice(parseInt(-this.maxItemsToDisplay, 10));

            return items;
        },

        /**
         * Returns count of cart line items
         * @returns {Number}
         */
        getCartLineItemsCount: function () {
            var items = this.getCartParamUnsanitizedHtml('items') || [];

            return parseInt(items.length, 10);
        }
    });

    document.addEventListener('breeze:mount:Magento_Checkout/js/view/minicart', function (event) {
        $(event.detail.el).minicart(event.detail.settings);
    });
})();
