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
                    $('body').spinner(true, {
                        delay: 150
                    });

                    return $('#authenticationPopup').authPopup('showModal').then(() => {
                        $('body').spinner(false);
                    });
                }

                location.href = this.options.checkoutUrl;
            }.bind(this));
        }
    });
})();
