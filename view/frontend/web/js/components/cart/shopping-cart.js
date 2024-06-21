(() => {
    'use strict';

    $.widget('shoppingCart', {
        component: 'shoppingCart',
        _create: function () {
            this._on(document, {
                [`click ${this.options.emptyCartButton}`]: this._confirmClearCart,
                [`click ${this.options.continueShoppingButton}`]: () => {
                    location.href = this.options.continueShoppingUrl;
                },
            });

            $(document).on('ajax:removeFromCart ajax:updateItemQty ajax:updateCartItemQty', () => {
                location.reload();
            });
        },

        destroy: function () {
            $(document).off('ajax:removeFromCart ajax:updateItemQty ajax:updateCartItemQty');
            return this._super();
        },

        _confirmClearCart: function (e) {
            e.preventDefault();
            $(this.options.emptyCartButton).spinner(true);
            require(['Magento_Ui/js/modal/confirm'], confirm => {
                confirm({
                    content: $.mage.__('Are you sure you want to remove all items from your shopping cart?'),
                    actions: {
                        confirm: () => this.clearCart(),
                        cancel: () => $(this.options.emptyCartButton).spinner(false)
                    }
                });
            });
        },

        clearCart: function () {
            $(this.options.emptyCartButton).attr('name', 'update_cart_action_temp');
            $(this.options.updateCartActionContainer)
                .attr('name', 'update_cart_action')
                .attr('value', 'empty_cart');
            $(this.options.emptyCartButton).parents('form').submit();
        }
    });
})();
