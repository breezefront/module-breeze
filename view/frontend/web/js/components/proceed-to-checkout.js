(function () {
    'use strict';

    $.widget('proceedToCheckout', {
        component: 'Magento_Checkout/js/proceed-to-checkout',
        create: function () {
            var cart = $.sections.get('cart'),
                customer = $.sections.get('customer');

            $(this.element).on('click', function (event) {
                event.preventDefault();

                if (!customer().firstname && cart().isGuestCheckoutAllowed === false) {
                    return $('.block-authentication').modal('openModal');
                }

                location.href = this.options.checkoutUrl;
            }.bind(this));
        }
    });
})();
