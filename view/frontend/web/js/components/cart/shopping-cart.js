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

            this.cartSubscription = $.customerData.get('cart').subscribe(() => {
                location.reload();
            });
        },

        destroy: function () {
            this.cartSubscription.dispose();
            this._super();
        },

        _confirmClearCart: function () {
            $.confirm({
                content: $.mage.__('Are you sure you want to remove all items from your shopping cart?'),
                actions: {
                    confirm: () => {
                        this.clearCart();
                    }
                }
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
